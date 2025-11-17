/**
 * Testes Unitários - auth.js
 * Testa autenticação JWT e verificação de roles
 */

import { jest } from '@jest/globals';

// Mock do Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Importar módulo após mock
const { verifyToken, socketAuthMiddleware, hasRole, isStudentInClass } = await import('../auth.js');

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('deve retornar user quando token é válido', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          role: 'aluno',
          name: 'Test User',
        },
      };

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await verifyToken('valid-token');

      expect(result).toEqual(mockUser);
      expect(mockGetUser).toHaveBeenCalledWith('valid-token');
    });

    it('deve retornar null quando token é inválido', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const result = await verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('deve retornar null quando ocorre erro', async () => {
      mockGetUser.mockRejectedValue(new Error('Network error'));

      const result = await verifyToken('token');

      expect(result).toBeNull();
    });
  });

  describe('socketAuthMiddleware', () => {
    let socket;
    let next;

    beforeEach(() => {
      socket = {
        handshake: {
          auth: {},
          query: {},
        },
      };
      next = jest.fn();
    });

    it('deve autenticar socket com token válido via auth', async () => {
      const mockUser = {
        id: '123',
        email: 'student@test.com',
        user_metadata: {
          role: 'aluno',
          name: 'Student',
        },
      };

      socket.handshake.auth.token = 'valid-token';
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await socketAuthMiddleware(socket, next);

      expect(socket.user).toEqual({
        id: '123',
        email: 'student@test.com',
        role: 'aluno',
        name: 'Student',
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('deve autenticar socket com token via query', async () => {
      const mockUser = {
        id: '456',
        email: 'teacher@test.com',
        user_metadata: {
          role: 'professor',
          name: 'Teacher',
        },
      };

      socket.handshake.query.token = 'query-token';
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await socketAuthMiddleware(socket, next);

      expect(socket.user).toBeDefined();
      expect(socket.user.role).toBe('professor');
      expect(next).toHaveBeenCalled();
    });

    it('deve rejeitar quando token não é fornecido', async () => {
      await socketAuthMiddleware(socket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Authentication token required');
    });

    it('deve rejeitar quando token é inválido', async () => {
      socket.handshake.auth.token = 'invalid';
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid' },
      });

      await socketAuthMiddleware(socket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Invalid or expired token');
    });

    it('deve usar role padrão "aluno" quando não especificado', async () => {
      const mockUser = {
        id: '789',
        email: 'notrole@test.com',
        user_metadata: {},
      };

      socket.handshake.auth.token = 'token';
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await socketAuthMiddleware(socket, next);

      expect(socket.user.role).toBe('aluno');
    });
  });

  describe('hasRole', () => {
    it('deve retornar true quando socket tem role permitido', () => {
      const socket = {
        user: { role: 'professor' },
      };

      const result = hasRole(socket, ['professor', 'direcao']);

      expect(result).toBe(true);
    });

    it('deve retornar false quando socket não tem role permitido', () => {
      const socket = {
        user: { role: 'aluno' },
      };

      const result = hasRole(socket, ['professor', 'direcao']);

      expect(result).toBe(false);
    });

    it('deve retornar false quando socket não tem user', () => {
      const socket = {};

      const result = hasRole(socket, ['professor']);

      expect(result).toBe(false);
    });
  });

  describe('isStudentInClass', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnThis();
      mockSingle.mockReturnValue({ data: null, error: null });
    });

    it('deve retornar true quando aluno está matriculado', async () => {
      mockSingle.mockResolvedValue({
        data: { id: '1', student_id: 'student-123', class_id: 'class-456' },
        error: null,
      });

      mockEq.mockImplementation(function(field, value) {
        if (field === 'class_id') return { eq: mockEq, single: mockSingle };
        return this;
      });

      const result = await isStudentInClass('student-123', 'class-456');

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('class_students');
    });

    it('deve retornar false quando aluno não está matriculado', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      mockEq.mockImplementation(function(field, value) {
        if (field === 'class_id') return { eq: mockEq, single: mockSingle };
        return this;
      });

      const result = await isStudentInClass('student-999', 'class-456');

      expect(result).toBe(false);
    });
  });
});
