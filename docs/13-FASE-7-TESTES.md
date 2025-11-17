# 13 - FASE 7: TESTES E QA

## Visão Geral

A Fase 7 estabelece a estratégia completa de testes e garantia de qualidade (QA) do NeuroOne, incluindo testes unitários, integração, E2E, acessibilidade e performance.

**Duração estimada**: 2 semanas
**Prioridade**: Média-Alta (após todas as funcionalidades implementadas)
**Dependências**: Fases 1-5 completas

---

## Estratégia de Testes

### Pirâmide de Testes

```
        ┌─────────────┐
        │   E2E (5%)  │  ← Cypress
        ├─────────────┤
        │ Integration │  ← React Testing Library
        │    (25%)    │     Supertest (API)
        ├─────────────┤
        │    Unit     │  ← Vitest (Frontend)
        │    (70%)    │     Jest (Backend)
        └─────────────┘
```

---

## 1. Testes Unitários

### 1.1 Frontend - Vitest + React Testing Library

**Configuração**: `frontend/vitest.config.js`

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**Setup**: `frontend/src/tests/setup.js`

```javascript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock do Supabase
global.mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  })),
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn()
  }
};
```

**Exemplo de Teste - Componente**:

`frontend/src/components/AttentionCircle.test.jsx`

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AttentionCircle from './AttentionCircle';

describe('AttentionCircle', () => {
  it('renders with low attention', () => {
    render(<AttentionCircle level="low" attention={35} />);

    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('Tente se concentrar mais')).toBeInTheDocument();
  });

  it('renders with high attention', () => {
    render(<AttentionCircle level="high" attention={85} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Excelente foco!')).toBeInTheDocument();
  });

  it('applies correct color for attention level', () => {
    const { container, rerender } = render(
      <AttentionCircle level="low" attention={30} />
    );

    const circle = container.querySelector('.attention-circle');
    expect(circle).toHaveStyle({ backgroundColor: '#EF4444' });

    rerender(<AttentionCircle level="high" attention={80} />);
    expect(circle).toHaveStyle({ backgroundColor: '#10B981' });
  });

  it('shows offline state when not connected', () => {
    render(<AttentionCircle level="medium" attention={0} connected={false} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
});
```

**Exemplo de Teste - Hook Customizado**:

`frontend/src/hooks/useAuth.test.js`

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase');

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null user when not authenticated', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('returns user when authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } }
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });

  it('signs in user successfully', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(async () => {
      const response = await result.current.signIn('test@example.com', 'password');
      expect(response.user).toEqual(mockUser);
    });
  });
});
```

**Exemplo de Teste - Utilitário**:

`frontend/src/lib/thinkgear-parser.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import ThinkGearParser from './thinkgear-parser';

describe('ThinkGearParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ThinkGearParser();
  });

  it('parses attention value correctly', () => {
    const mockData = [];

    parser.onParsed((data) => {
      mockData.push(data);
    });

    // Sync bytes
    parser.parseByte(0xAA);
    parser.parseByte(0xAA);
    // Payload length
    parser.parseByte(0x04);
    // Attention code
    parser.parseByte(0x04);
    // Attention value
    parser.parseByte(0x55); // 85
    // Checksum
    const checksum = ~(0x04 + 0x04 + 0x55) & 0xFF;
    parser.parseByte(checksum);

    expect(mockData).toHaveLength(1);
    expect(mockData[0].attention).toBe(85);
  });

  it('validates checksum and rejects invalid data', () => {
    const mockData = [];

    parser.onParsed((data) => {
      mockData.push(data);
    });

    parser.parseByte(0xAA);
    parser.parseByte(0xAA);
    parser.parseByte(0x04);
    parser.parseByte(0x04);
    parser.parseByte(0x55);
    parser.parseByte(0xFF); // Checksum inválido

    expect(mockData).toHaveLength(0);
  });
});
```

---

### 1.2 Backend - Jest + Supertest

**Configuração**: `backend/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/**/*.test.js'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js']
};
```

**Setup**: `backend/src/tests/setup.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

// Mock do Supabase para testes
jest.mock('@supabase/supabase-js');

global.mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
};

beforeAll(() => {
  createClient.mockReturnValue(global.mockSupabase);
});

afterEach(() => {
  jest.clearAllMocks();
});
```

**Exemplo de Teste - API Endpoint**:

`backend/src/routes/auth.test.js`

```javascript
const request = require('supertest');
const app = require('../app');
const { supabase } = require('../lib/supabase');

describe('POST /api/auth/login', () => {
  it('returns token on successful login', async () => {
    const mockUser = { id: '123', email: 'test@example.com', role: 'teacher' };

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'mock_token' } },
      error: null
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('returns 401 on invalid credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' }
    });

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrong' })
      .expect(401);
  });

  it('validates required fields', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' }) // Falta password
      .expect(400);
  });
});
```

**Exemplo de Teste - Middleware**:

`backend/src/middleware/auth.test.js`

```javascript
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./auth');

describe('authenticateToken middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('allows valid token', () => {
    const token = jwt.sign({ userId: '123', role: 'teacher' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(
      expect.objectContaining({ userId: '123', role: 'teacher' })
    );
  });

  it('rejects missing token', () => {
    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid token', () => {
    req.headers.authorization = 'Bearer invalid_token';

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

**Exemplo de Teste - Service/Business Logic**:

`backend/src/services/metrics.test.js`

```javascript
const { calculateSessionMetrics } = require('./metrics');

describe('calculateSessionMetrics', () => {
  it('calculates average attention correctly', () => {
    const dataPoints = [
      { attention: 70, relaxation: 60 },
      { attention: 80, relaxation: 70 },
      { attention: 75, relaxation: 65 }
    ];

    const metrics = calculateSessionMetrics(dataPoints);

    expect(metrics.avgAttention).toBe(75);
    expect(metrics.avgRelaxation).toBe(65);
  });

  it('handles empty data', () => {
    const metrics = calculateSessionMetrics([]);

    expect(metrics.avgAttention).toBe(0);
    expect(metrics.totalDataPoints).toBe(0);
  });

  it('filters poor quality signals', () => {
    const dataPoints = [
      { attention: 70, relaxation: 60, signalQuality: 20 }, // Good
      { attention: 80, relaxation: 70, signalQuality: 150 }, // Bad - should be filtered
      { attention: 75, relaxation: 65, signalQuality: 30 }  // Good
    ];

    const metrics = calculateSessionMetrics(dataPoints);

    expect(metrics.validDataPoints).toBe(2);
    expect(metrics.dataQuality).toBe(66.67); // 2/3 * 100
  });
});
```

---

## 2. Testes de Integração

### 2.1 Frontend Integration Tests

**Teste de Fluxo Completo de Login**:

`frontend/src/tests/integration/login-flow.test.jsx`

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

describe('Login Flow Integration', () => {
  it('allows teacher to login and see dashboard', async () => {
    const user = userEvent.setup();

    // Mock successful login
    const mockTeacher = {
      id: '123',
      email: 'teacher@school.com',
      role: 'teacher',
      name: 'John Teacher'
    };

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockTeacher },
      error: null
    });

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockTeacher } }
    });

    // Mock classes
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: '1', name: '3º Ano A' }]
        })
      })
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Preencher formulário
    await user.type(screen.getByLabelText(/email/i), 'teacher@school.com');
    await user.type(screen.getByLabelText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    // Verificar redirecionamento para dashboard
    await waitFor(() => {
      expect(screen.getByText(/olá, john teacher/i)).toBeInTheDocument();
      expect(screen.getByText(/minhas turmas/i)).toBeInTheDocument();
    });
  });
});
```

### 2.2 Backend API Integration Tests

**Teste de Fluxo de Sessão Completo**:

`backend/src/tests/integration/session-flow.test.js`

```javascript
const request = require('supertest');
const app = require('../../app');
const { supabase } = require('../../lib/supabase');

describe('Session Flow Integration', () => {
  let teacherToken;
  let classId;
  let sessionId;

  beforeAll(async () => {
    // Setup: criar professor e obter token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'Test123!' });

    teacherToken = loginRes.body.accessToken;

    // Criar turma
    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Test Class', description: 'Integration test' });

    classId = classRes.body.id;
  });

  it('creates session, receives EEG data, and generates report', async () => {
    // 1. Criar sessão
    const createRes = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: classId,
        sessionType: 'aula',
        durationMinutes: 30
      })
      .expect(201);

    sessionId = createRes.body.id;
    expect(createRes.body).toHaveProperty('startTime');

    // 2. Simular envio de dados EEG
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/eeg-data')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: 'student123',
          attention: 70 + i,
          relaxation: 60 + i,
          delta: 0.15,
          theta: 0.22,
          alpha: 0.35,
          beta: 0.20,
          gamma: 0.08
        })
        .expect(201);
    }

    // 3. Finalizar sessão
    await request(app)
      .patch(`/api/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ endTime: new Date().toISOString() })
      .expect(200);

    // 4. Verificar métricas calculadas
    const metricsRes = await request(app)
      .get(`/api/sessions/${sessionId}/metrics`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(metricsRes.body).toHaveProperty('avgAttention');
    expect(metricsRes.body.avgAttention).toBeGreaterThan(70);
    expect(metricsRes.body.totalDataPoints).toBe(10);
  });
});
```

---

## 3. Testes End-to-End (E2E)

### 3.1 Configuração Cypress

**Instalação**:
```bash
npm install --save-dev cypress @testing-library/cypress
```

**Configuração**: `cypress.config.js`

```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: true
  },
  env: {
    apiUrl: 'http://localhost:3000'
  }
});
```

**Commands**: `cypress/support/commands.js`

```javascript
Cypress.Commands.add('login', (email, password, role = 'teacher') => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Verificar redirecionamento baseado no role
    const dashboardRoutes = {
      teacher: '/teacher',
      student: '/student',
      direction: '/direction'
    };

    cy.url().should('include', dashboardRoutes[role]);
  });
});

Cypress.Commands.add('createSession', (classId) => {
  cy.visit('/teacher/session/create');
  cy.get(`[data-class-id="${classId}"]`).click();
  cy.get('[name="sessionType"]').check('aula');
  cy.get('button[type="submit"]').click();

  cy.url().should('include', '/teacher/session/');
  cy.url().should('include', '/active');
});
```

### 3.2 Teste E2E - Fluxo Completo do Professor

`cypress/e2e/teacher-session.cy.js`

```javascript
describe('Teacher Session Flow', () => {
  beforeEach(() => {
    cy.login('teacher@school.com', 'Test123!', 'teacher');
  });

  it('creates session, monitors students, and ends session', () => {
    // 1. Navegar para criar sessão
    cy.visit('/teacher');
    cy.contains('button', 'Iniciar Nova Sessão').click();

    // 2. Selecionar turma
    cy.url().should('include', '/teacher/session/create');
    cy.get('.class-option').first().click();

    // 3. Configurar sessão
    cy.get('input[name="sessionType"][value="aula"]').check();
    cy.get('input[name="durationMinutes"]').clear().type('30');
    cy.contains('button', 'Iniciar Sessão').click();

    // 4. Verificar sessão ativa
    cy.url().should('include', '/teacher/session/');
    cy.url().should('include', '/active');
    cy.contains('Alunos Conectados').should('be.visible');

    // 5. Simular alunos conectando (via API)
    cy.window().then((win) => {
      const sessionId = win.location.pathname.split('/')[3];

      // Mock WebSocket events
      cy.intercept('GET', `/api/sessions/${sessionId}/participants`, {
        statusCode: 200,
        body: [
          { studentId: '1', name: 'João Silva', connected: true },
          { studentId: '2', name: 'Maria Santos', connected: true }
        ]
      });
    });

    // 6. Verificar grid de alunos
    cy.get('.student-card').should('have.length.at.least', 2);
    cy.get('.student-card').first().should('contain', 'João Silva');

    // 7. Finalizar sessão
    cy.contains('button', 'Finalizar Sessão').click();
    cy.contains('button', 'Confirmar').click();

    // 8. Verificar redirecionamento para relatório
    cy.url().should('include', '/report');
    cy.contains('Relatório de Sessão').should('be.visible');
  });

  it('shows real-time EEG updates', () => {
    cy.createSession('class-123');

    // Mock WebSocket data
    cy.window().then((win) => {
      win.postMessage({
        type: 'eeg:data',
        payload: {
          studentId: '1',
          attention: 85,
          relaxation: 70
        }
      }, '*');
    });

    // Verificar atualização de dados
    cy.get('[data-student-id="1"]').within(() => {
      cy.contains('85%').should('be.visible');
      cy.get('.indicator-green').should('be.visible');
    });
  });
});
```

### 3.3 Teste E2E - PWA Aluno com Bluetooth

`cypress/e2e/student-session.cy.js`

```javascript
describe('Student PWA Session', () => {
  beforeEach(() => {
    cy.login('student@school.com', 'Test123!', 'student');
  });

  it('connects EEG device and joins session', () => {
    // Mock Web Bluetooth API
    cy.window().then((win) => {
      win.navigator.bluetooth = {
        requestDevice: cy.stub().resolves({
          name: 'TGAM Device',
          gatt: {
            connect: cy.stub().resolves({
              getPrimaryService: cy.stub().resolves({
                getCharacteristic: cy.stub().resolves({
                  startNotifications: cy.stub().resolves(),
                  addEventListener: cy.stub()
                })
              })
            })
          }
        })
      };
    });

    // 1. Entrar na sessão
    cy.visit('/student');
    cy.contains('Entrar na Sessão').click();

    // 2. Conectar dispositivo
    cy.url().should('include', '/device-connect');
    cy.contains('button', 'Conectar Bluetooth').click();

    // Verificar conexão
    cy.contains('Dispositivo conectado', { timeout: 10000 }).should('be.visible');

    // 3. Continuar para sessão
    cy.contains('button', 'Continuar para Sessão').click();

    // 4. Verificar sessão ativa
    cy.url().should('include', '/session/');
    cy.url().should('include', '/active');
    cy.get('.attention-circle').should('be.visible');
  });

  it('shows attention indicator changing colors', () => {
    cy.visit('/student/session/active-123');

    // Simular dados EEG
    const testCases = [
      { attention: 30, expectedColor: 'rgb(239, 68, 68)', message: 'Tente se concentrar mais' },
      { attention: 55, expectedColor: 'rgb(245, 158, 11)', message: 'Continue assim!' },
      { attention: 85, expectedColor: 'rgb(16, 185, 129)', message: 'Excelente foco!' }
    ];

    testCases.forEach(({ attention, expectedColor, message }) => {
      cy.window().then((win) => {
        win.postMessage({
          type: 'eeg:update',
          payload: { attention }
        }, '*');
      });

      cy.get('.attention-circle').should('have.css', 'background-color', expectedColor);
      cy.contains(message).should('be.visible');
    });
  });
});
```

---

## 4. Testes de Acessibilidade

### 4.1 Configuração cypress-axe

```bash
npm install --save-dev cypress-axe axe-core
```

**Setup**: `cypress/support/e2e.js`

```javascript
import 'cypress-axe';
```

**Teste de Acessibilidade**:

`cypress/e2e/accessibility.cy.js`

```javascript
describe('Accessibility Tests', () => {
  it('has no detectable a11y violations on login page', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('has no detectable a11y violations on teacher dashboard', () => {
    cy.login('teacher@school.com', 'Test123!', 'teacher');
    cy.visit('/teacher');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('has no detectable a11y violations on session active', () => {
    cy.login('teacher@school.com', 'Test123!', 'teacher');
    cy.createSession('class-123');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('keyboard navigation works on forms', () => {
    cy.visit('/login');

    cy.get('input[name="email"]').focus().should('have.focus');
    cy.realPress('Tab');
    cy.get('input[name="password"]').should('have.focus');
    cy.realPress('Tab');
    cy.get('button[type="submit"]').should('have.focus');
    cy.realPress('Enter');
  });

  it('has proper ARIA labels', () => {
    cy.visit('/teacher/session/123/active');

    cy.get('.student-grid').should('have.attr', 'role', 'list');
    cy.get('.student-card').first().should('have.attr', 'role', 'listitem');
    cy.get('.attention-indicator').should('have.attr', 'aria-label');
  });
});
```

---

## 5. Testes de Performance

### 5.1 Lighthouse CI

**Configuração**: `lighthouserc.js`

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
```

### 5.2 Teste de Carga com Artillery

**Instalação**:
```bash
npm install --save-dev artillery
```

**Configuração**: `artillery.yml`

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load
    - duration: 60
      arrivalRate: 100
      name: Spike

scenarios:
  - name: Teacher creates session
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'teacher@test.com'
            password: 'Test123!'
          capture:
            - json: '$.accessToken'
              as: 'token'

      - post:
          url: '/api/sessions'
          headers:
            Authorization: 'Bearer {{ token }}'
          json:
            classId: '{{ $randomString() }}'
            sessionType: 'aula'

      - think: 5

      - post:
          url: '/api/eeg-data'
          headers:
            Authorization: 'Bearer {{ token }}'
          json:
            sessionId: '{{ sessionId }}'
            studentId: '{{ $randomString() }}'
            attention: '{{ $randomNumber(0, 100) }}'
            relaxation: '{{ $randomNumber(0, 100) }}'
```

**Executar**:
```bash
npx artillery run artillery.yml
```

---

## 6. Scripts de Teste

### 6.1 Frontend Scripts

`frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "cypress open",
    "test:e2e:headless": "cypress run",
    "test:a11y": "cypress run --spec 'cypress/e2e/accessibility.cy.js'",
    "lighthouse": "lhci autorun"
  }
}
```

### 6.2 Backend Scripts

`backend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:load": "artillery run artillery.yml"
  }
}
```

---

## 7. CI/CD Integration

### 7.1 GitHub Actions - Testes Automáticos

`.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run unit tests
        working-directory: frontend
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run tests
        working-directory: backend
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json
          flags: backend

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Start services
        run: |
          cd backend && npm start &
          cd frontend && npm run dev &
          sleep 10

      - name: Run Cypress tests
        working-directory: frontend
        run: npm run test:e2e:headless

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: frontend/cypress/screenshots

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.js'
          uploadArtifacts: true
```

---

## 8. Cobertura de Código

### 8.1 Metas de Cobertura

- **Frontend**: ≥ 80%
- **Backend**: ≥ 85%
- **Componentes críticos** (Auth, EEG Parser, Metrics): ≥ 95%

### 8.2 Relatórios de Cobertura

**Visualizar localmente**:
```bash
# Frontend
cd frontend
npm run test:coverage
open coverage/index.html

# Backend
cd backend
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 9. Testes Manuais

### 9.1 Checklist de Testes Manuais

**Funcionalidades Essenciais**:

- [ ] Login/Logout (todos os roles)
- [ ] Criação de usuário (direção)
- [ ] Criação de turma (direção)
- [ ] Criação de sessão (professor)
- [ ] Conexão Bluetooth (aluno mobile)
- [ ] Recepção de dados EEG em tempo real
- [ ] Indicador visual de atenção
- [ ] Gráficos de ondas cerebrais
- [ ] Finalização de sessão
- [ ] Geração de relatórios
- [ ] Exportação PDF/CSV
- [ ] PWA - Add to Home Screen
- [ ] PWA - Funcionamento offline

**Compatibilidade de Navegadores**:

- [ ] Chrome (Desktop)
- [ ] Chrome (Android)
- [ ] Edge (Desktop)
- [ ] Edge (Android)
- [ ] Safari (iOS) - Web Bluetooth limitado

**Dispositivos**:

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (iPad - 768x1024)
- [ ] Mobile (375x667, 414x896)

---

## 10. Estratégia de Bugs e QA

### 10.1 Processo de Report de Bugs

**Template de Issue**:

```markdown
## Descrição
[Descrição clara do bug]

## Passos para Reproduzir
1. Ir para '...'
2. Clicar em '...'
3. Observar erro

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que está acontecendo]

## Screenshots
[Se aplicável]

## Ambiente
- OS: [Windows/Mac/Android/iOS]
- Navegador: [Chrome 120]
- Dispositivo: [Desktop/Mobile]
- Versão: [v1.0.0]

## Severidade
- [ ] Crítico (bloqueador)
- [ ] Alto (funcionalidade quebrada)
- [ ] Médio (workaround disponível)
- [ ] Baixo (cosmético)
```

### 10.2 Priorização

**P0 - Crítico**:
- Sistema indisponível
- Perda de dados
- Vulnerabilidade de segurança

**P1 - Alto**:
- Funcionalidade principal quebrada
- Erro que afeta múltiplos usuários

**P2 - Médio**:
- Funcionalidade secundária com workaround
- Inconsistência visual

**P3 - Baixo**:
- Melhoria de UX
- Problemas cosméticos

---

## Checklist de Conclusão

- [ ] Testes unitários frontend (≥80% cobertura)
- [ ] Testes unitários backend (≥85% cobertura)
- [ ] Testes de integração implementados
- [ ] Testes E2E principais fluxos
- [ ] Testes de acessibilidade (WCAG AA)
- [ ] Testes de performance (Lighthouse)
- [ ] Testes de carga (Artillery)
- [ ] CI/CD configurado
- [ ] Relatórios de cobertura
- [ ] Testes manuais concluídos
- [ ] Processo de QA documentado

---

## Próximos Passos

Após Fase 7 completa:
- Deploy em produção ([18-DEPLOY-INFRAESTRUTURA.md](./18-DEPLOY-INFRAESTRUTURA.md))
- Monitoramento contínuo
- Testes de regressão a cada release

---

**Última atualização**: 2025-01-16
**Versão**: 1.0
