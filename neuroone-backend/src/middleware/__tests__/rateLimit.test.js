/**
 * Testes Unitários - rateLimit.js
 * Testa rate limiting e proteção contra spam
 */

import { jest } from '@jest/globals';
import { RateLimiter, createRateLimitMiddleware, clearSocketLimits } from '../rateLimit.js';

describe('Rate Limiting', () => {
  describe('RateLimiter', () => {
    let rateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve permitir requests dentro do limite', () => {
      const socketId = 'socket-123';
      const eventName = 'test:event';
      const limits = { maxRequests: 5, windowMs: 60000 };

      // Primeiras 5 requests devem ser permitidas
      for (let i = 0; i < 5; i++) {
        const allowed = rateLimiter.isAllowed(socketId, eventName, limits);
        expect(allowed).toBe(true);
      }
    });

    it('deve bloquear requests que excedem o limite', () => {
      const socketId = 'socket-456';
      const eventName = 'spam:event';
      const limits = { maxRequests: 3, windowMs: 60000 };

      // Primeiras 3 permitidas
      for (let i = 0; i < 3; i++) {
        rateLimiter.isAllowed(socketId, eventName, limits);
      }

      // 4ª request deve ser bloqueada
      const allowed = rateLimiter.isAllowed(socketId, eventName, limits);
      expect(allowed).toBe(false);
    });

    it('deve resetar contador após janela de tempo expirar', () => {
      const socketId = 'socket-789';
      const eventName = 'time:event';
      const limits = { maxRequests: 2, windowMs: 1000 };

      // Primeira request
      rateLimiter.isAllowed(socketId, eventName, limits);
      rateLimiter.isAllowed(socketId, eventName, limits);

      // 3ª bloqueada
      expect(rateLimiter.isAllowed(socketId, eventName, limits)).toBe(false);

      // Avançar tempo além da janela
      jest.advanceTimersByTime(1001);

      // Deve permitir novamente
      expect(rateLimiter.isAllowed(socketId, eventName, limits)).toBe(true);
    });

    it('deve isolar limites por socket', () => {
      const socket1 = 'socket-1';
      const socket2 = 'socket-2';
      const eventName = 'isolated:event';
      const limits = { maxRequests: 2, windowMs: 60000 };

      // Socket 1: 2 requests
      rateLimiter.isAllowed(socket1, eventName, limits);
      rateLimiter.isAllowed(socket1, eventName, limits);

      // Socket 2 ainda deve ter limite disponível
      expect(rateLimiter.isAllowed(socket2, eventName, limits)).toBe(true);
      expect(rateLimiter.isAllowed(socket2, eventName, limits)).toBe(true);

      // Ambos devem estar no limite
      expect(rateLimiter.isAllowed(socket1, eventName, limits)).toBe(false);
      expect(rateLimiter.isAllowed(socket2, eventName, limits)).toBe(false);
    });

    it('deve isolar limites por evento', () => {
      const socketId = 'socket-multi';
      const event1 = 'event:1';
      const event2 = 'event:2';
      const limits = { maxRequests: 2, windowMs: 60000 };

      // Event 1: atingir limite
      rateLimiter.isAllowed(socketId, event1, limits);
      rateLimiter.isAllowed(socketId, event1, limits);
      expect(rateLimiter.isAllowed(socketId, event1, limits)).toBe(false);

      // Event 2: ainda disponível
      expect(rateLimiter.isAllowed(socketId, event2, limits)).toBe(true);
    });

    it('deve limpar dados antigos no cleanup', () => {
      const socketId = 'socket-old';
      const eventName = 'old:event';
      const limits = { maxRequests: 1, windowMs: 1000 };

      rateLimiter.isAllowed(socketId, eventName, limits);

      // Avançar além da janela
      jest.advanceTimersByTime(2000);

      // Executar cleanup manualmente
      rateLimiter.cleanup();

      // Verificar que permite novamente (dados limpos)
      expect(rateLimiter.isAllowed(socketId, eventName, limits)).toBe(true);
    });

    it('deve remover socket específico', () => {
      const socketId = 'socket-remove';
      const eventName = 'remove:event';
      const limits = { maxRequests: 1, windowMs: 60000 };

      rateLimiter.isAllowed(socketId, eventName, limits);
      expect(rateLimiter.isAllowed(socketId, eventName, limits)).toBe(false);

      // Remover socket
      rateLimiter.removeSocket(socketId);

      // Deve permitir novamente
      expect(rateLimiter.isAllowed(socketId, eventName, limits)).toBe(true);
    });
  });

  describe('createRateLimitMiddleware', () => {
    let middleware;
    let mockSocket;
    let mockHandler;
    let mockData;
    let socketCounter = 0;

    beforeEach(() => {
      middleware = createRateLimitMiddleware();
      // Use unique socket ID for each test to avoid cross-test interference
      mockSocket = {
        id: `socket-test-${++socketCounter}`,
        emit: jest.fn(),
      };
      mockHandler = jest.fn();
      mockData = { test: 'data' };
    });

    it('deve chamar handler quando dentro do limite', () => {
      const wrappedHandler = middleware('eeg:data', mockHandler);

      wrappedHandler(mockSocket, mockData);

      expect(mockHandler).toHaveBeenCalledWith(mockSocket, mockData);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('deve bloquear e enviar erro quando excede limite', () => {
      const wrappedHandler = middleware('student:join', mockHandler);
      const limits = { maxRequests: 5, windowMs: 60000 };

      // Executar 6 vezes (limite é 5)
      for (let i = 0; i < 6; i++) {
        wrappedHandler(mockSocket, mockData);
      }

      // Primeiras 5 devem chamar handler
      expect(mockHandler).toHaveBeenCalledTimes(5);

      // 6ª deve emitir erro
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        message: expect.stringContaining('Rate limit exceeded'),
        event: 'student:join',
      }));
    });

    it('deve usar limites específicos por evento', () => {
      const eegHandler = middleware('eeg:data', mockHandler);
      const joinHandler = middleware('teacher:join', jest.fn());

      // eeg:data tem limite de 300/min
      for (let i = 0; i < 300; i++) {
        eegHandler(mockSocket, mockData);
      }
      expect(mockHandler).toHaveBeenCalledTimes(300);

      // 301 deve bloquear
      eegHandler(mockSocket, mockData);
      expect(mockSocket.emit).toHaveBeenCalled();
    });

    it('deve usar limite default para eventos desconhecidos', () => {
      const unknownHandler = middleware('unknown:event', mockHandler);

      // Limite default é 100
      for (let i = 0; i < 100; i++) {
        unknownHandler(mockSocket, mockData);
      }
      expect(mockHandler).toHaveBeenCalledTimes(100);

      // 101 deve bloquear
      unknownHandler(mockSocket, mockData);
      expect(mockSocket.emit).toHaveBeenCalled();
    });

    it('deve aceitar limites customizados', () => {
      const customMiddleware = createRateLimitMiddleware({
        'custom:event': { maxRequests: 2, windowMs: 1000 },
      });

      const customHandler = customMiddleware('custom:event', mockHandler);

      customHandler(mockSocket, mockData);
      customHandler(mockSocket, mockData);
      expect(mockHandler).toHaveBeenCalledTimes(2);

      customHandler(mockSocket, mockData);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
  });

  describe('clearSocketLimits', () => {
    it('deve limpar limites de socket específico', () => {
      const middleware = createRateLimitMiddleware();
      const socket = { id: 'socket-clear', emit: jest.fn() };
      const handler = jest.fn();
      // Use student:join which has limit of 5
      const wrappedHandler = middleware('student:join', handler);

      // Atingir limite (5 requests)
      wrappedHandler(socket, {});
      wrappedHandler(socket, {});
      wrappedHandler(socket, {});
      wrappedHandler(socket, {});
      wrappedHandler(socket, {});
      wrappedHandler(socket, {}); // 6º bloqueado

      expect(socket.emit).toHaveBeenCalled();

      // Limpar
      clearSocketLimits(socket);

      // Deve permitir novamente
      socket.emit.mockClear();
      handler.mockClear();

      // After clearing, should allow requests again
      wrappedHandler(socket, {});
      expect(handler).toHaveBeenCalled();
      expect(socket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Limites Específicos do NeuroOne', () => {
    let middleware;
    let socketCounter = 0;

    beforeEach(() => {
      middleware = createRateLimitMiddleware();
    });

    it('deve permitir 300 requests de EEG por minuto', () => {
      const socket = { id: `eeg-socket-${++socketCounter}`, emit: jest.fn() };
      const handler = jest.fn();
      const eegHandler = middleware('eeg:data', handler);

      for (let i = 0; i < 300; i++) {
        eegHandler(socket, { attention: 50 });
      }

      expect(handler).toHaveBeenCalledTimes(300);
      expect(socket.emit).not.toHaveBeenCalled();
    });

    it('deve permitir apenas 5 joins de aluno por minuto', () => {
      const socket = { id: `join-socket-${++socketCounter}`, emit: jest.fn() };
      const handler = jest.fn();
      const joinHandler = middleware('student:join', handler);

      for (let i = 0; i < 5; i++) {
        joinHandler(socket, { sessionId: 'test' });
      }

      expect(handler).toHaveBeenCalledTimes(5);

      joinHandler(socket, { sessionId: 'test' });
      expect(socket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        event: 'student:join',
        limit: 5,
      }));
    });

    it('deve permitir apenas 5 joins de professor por minuto', () => {
      const socket = { id: `teacher-socket-${++socketCounter}`, emit: jest.fn() };
      const handler = jest.fn();
      const joinHandler = middleware('teacher:join', handler);

      for (let i = 0; i < 5; i++) {
        joinHandler(socket, { sessionId: 'test' });
      }

      expect(handler).toHaveBeenCalledTimes(5);

      joinHandler(socket, { sessionId: 'test' });
      expect(socket.emit).toHaveBeenCalled();
    });
  });
});
