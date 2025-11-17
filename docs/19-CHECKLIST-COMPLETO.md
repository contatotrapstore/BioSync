# ✅ Checklist Completo - NeuroOne

**Total:** 130+ tasks organizadas por módulo
**Versão:** 1.0
**Data:** 2025-11-07

---

## 📋 Índice

- [Como Usar Este Checklist](#como-usar-este-checklist)
- [Progresso Geral](#progresso-geral)
- [Fase 1: Fundação (30 tasks)](#fase-1-fundação-30-tasks)
- [Fase 2: Módulo Direção (20 tasks)](#fase-2-módulo-direção-20-tasks)
- [Fase 3: Módulo Professor (25 tasks)](#fase-3-módulo-professor-25-tasks)
- [Fase 4: Módulo Aluno (30 tasks)](#fase-4-módulo-aluno-30-tasks)
- [Fase 5: Relatórios (15 tasks)](#fase-5-relatórios-15-tasks)
- [Fase 6: Launcher (8 tasks)](#fase-6-launcher-8-tasks)
- [Fase 7: Testes e QA (12 tasks)](#fase-7-testes-e-qa-12-tasks)

---

## Como Usar Este Checklist

1. **Marque** as tasks conforme forem sendo concluídas
2. **Anote problemas** ou bloqueios encontrados
3. **Revise diariamente** para acompanhar progresso
4. **Atualize estimativas** se necessário

### Legenda de Prioridade

- 🔴 **Crítico**: Bloqueia outras tasks
- 🟡 **Importante**: Alta prioridade
- 🟢 **Normal**: Pode esperar

### Legenda de Status

- `[ ]` - Não iniciado
- `[~]` - Em progresso
- `[x]` - Concluído
- `[!]` - Bloqueado

---

## Progresso Geral

```
Fase 1: [x] 30/30  (100%) ✅ CONCLUÍDA
Fase 2: [x] 20/20  (100%) ✅ CONCLUÍDA
Fase 3: [x] 25/25  (100%) ✅ CONCLUÍDA
Fase 4: [x] 30/30  (100%) ✅ IMPLEMENTADA
Fase 5: [~] 10/15  (67%)  🔄 EM ANDAMENTO (Deploy configs, PDF export implementados)
Fase 6: [ ] 0/8    (0%)   ⏳ PENDENTE
Fase 7: [~] 9/12   (75%)  🔄 EM ANDAMENTO (29 testes backend passando)

TOTAL:  [~] 124/140 (89%) 🚀 PRONTO PARA PRODUÇÃO
```

**Última atualização:** 2025-11-17

---

## Fase 1: Fundação (30 tasks)

**Duração:** 3 semanas
**Objetivo:** Design system, database, roles

### 1.1 Design System (10 tasks)

- [ ] 🔴 Criar `lightTheme.js` com todas as cores
- [ ] 🔴 Criar `darkTheme.js` com todas as cores
- [ ] 🔴 Criar `ThemeContext.jsx` com toggle
- [ ] 🟡 Criar componente `ThemeToggle.jsx`
- [ ] 🟡 Criar componente base `Button.jsx`
- [ ] 🟡 Criar componente base `Card.jsx`
- [ ] 🟡 Criar componente base `Input.jsx`
- [ ] 🟢 Testar transições entre temas
- [ ] 🟢 Validar acessibilidade (WCAG AA)
- [ ] 🟢 Documentar componentes

### 1.2 Banco de Dados (12 tasks)

- [ ] 🔴 Atualizar tabela `users` (adicionar `user_role`)
- [ ] 🔴 Criar tabela `classes`
- [ ] 🔴 Criar tabela `class_students`
- [ ] 🔴 Criar tabela `sessions`
- [ ] 🔴 Criar tabela `session_participants`
- [ ] 🔴 Criar tabela `eeg_data`
- [ ] 🔴 Criar tabela `session_metrics`
- [ ] 🔴 Criar tabela `student_metrics`
- [ ] 🟡 Criar índices de performance
- [ ] 🟡 Configurar Row Level Security (RLS)
- [ ] 🟡 Criar policies de acesso
- [ ] 🟢 Criar seeds de teste

### 1.3 Sistema de Roles (8 tasks)

- [ ] 🔴 Criar middleware `roleAuth.js`
- [ ] 🔴 Atualizar `AuthContext.jsx` (adicionar role)
- [ ] 🔴 Criar HOC `withRole`
- [ ] 🟡 Proteger rotas por role
- [ ] 🟡 Criar páginas de erro 403 Forbidden
- [ ] 🟢 Testar permissões Direção
- [ ] 🟢 Testar permissões Professor
- [ ] 🟢 Testar permissões Aluno

---

## Fase 2: Módulo Direção (20 tasks)

**Duração:** 3 semanas
**Objetivo:** Admin completo

### 2.1 Frontend - Direção (10 tasks)

- [ ] 🔴 Criar `DirectionLayout.jsx`
- [ ] 🔴 Criar página `DirectionDashboard.jsx`
- [ ] 🟡 Criar componente `StatsCard.jsx` (4 cards)
- [ ] 🟡 Criar componente `AttentionChart.jsx` (Recharts)
- [ ] 🟡 Criar componente `RelaxationHistogram.jsx`
- [ ] 🟡 Criar página `UserManagement.jsx`
- [ ] 🟡 Criar página `ClassManagement.jsx`
- [ ] 🟡 Criar página `Reports.jsx`
- [ ] 🟡 Criar página `SystemSettings.jsx`
- [ ] 🟢 Integrar com API

### 2.2 Backend - Direção (10 tasks)

- [ ] 🔴 Criar `routes/direction.js`
- [ ] 🔴 Criar `directionController.js`
- [ ] 🟡 Endpoint: GET `/dashboard` (stats)
- [ ] 🟡 Endpoint: GET `/users` (listar todos)
- [ ] 🟡 Endpoint: POST `/users` (criar usuário)
- [ ] 🟡 Endpoint: PUT `/users/:id` (atualizar)
- [ ] 🟡 Endpoint: DELETE `/users/:id` (deletar)
- [ ] 🟡 Endpoint: GET/POST `/classes` (CRUD turmas)
- [ ] 🟢 Testes unitários controller
- [ ] 🟢 Documentação API (Swagger)

---

## Fase 3: Módulo Professor (25 tasks)

**Duração:** 4 semanas
**Objetivo:** Interface professor + WebSocket

### 3.1 Frontend - Professor (12 tasks)

- [ ] 🔴 Criar página `TeacherDashboard.jsx`
- [ ] 🔴 Criar página `SessionCreate.jsx` (formulário)
- [ ] 🔴 Criar página `SessionMonitor.jsx` (tempo real)
- [ ] 🟡 Criar componente `SessionCard.jsx`
- [ ] 🟡 Criar componente `RealTimeStats.jsx`
- [ ] 🟡 Criar componente `StudentList.jsx`
- [ ] 🟡 Criar componente `AttentionGauge.jsx`
- [ ] 🟡 Criar componente `MovingAverageChart.jsx`
- [ ] 🟡 Integrar WebSocket client
- [ ] 🟡 Handler de eventos WebSocket
- [ ] 🟢 Testar reconexão WebSocket
- [ ] 🟢 Responsividade mobile

### 3.2 Backend - Professor (13 tasks)

- [ ] 🔴 Criar `routes/teacher.js`
- [ ] 🔴 Criar `teacherController.js`
- [ ] 🔴 Criar `services/websocket.js` (Socket.io)
- [ ] 🟡 Endpoint: GET `/sessions` (listar)
- [ ] 🟡 Endpoint: POST `/sessions` (criar)
- [ ] 🟡 Endpoint: POST `/sessions/:id/start`
- [ ] 🟡 Endpoint: POST `/sessions/:id/end`
- [ ] 🟡 WebSocket: `teacher:join` event
- [ ] 🟡 WebSocket: `student:connected` event
- [ ] 🟡 WebSocket: `eeg:update` event
- [ ] 🟡 Salvar dados EEG no banco
- [ ] 🟢 Testes unitários
- [ ] 🟢 Testes integração WebSocket

---

## Fase 4: Módulo Aluno (30 tasks)

**Duração:** 4 semanas
**Objetivo:** Mobile + Bluetooth + EEG

### 4.1 Mobile - Interface (10 tasks)

- [ ] 🔴 Criar página `StudentDashboard.tsx`
- [ ] 🔴 Criar página `SessionJoin.tsx`
- [ ] 🔴 Criar página `SessionActive.tsx`
- [ ] 🟡 Criar componente `AttentionGauge.tsx`
- [ ] 🟡 Criar componente `RelaxationGauge.tsx`
- [ ] 🟡 Criar componente `BrainwavesChart.tsx`
- [ ] 🟡 Criar componente `ConnectionStatus.tsx`
- [ ] 🟡 Criar componente `PersonalInsights.tsx`
- [ ] 🟢 Adaptar theme mobile
- [ ] 🟢 Responsividade tablet

### 4.2 Mobile - Bluetooth (10 tasks)

- [ ] 🔴 Instalar `@capacitor-community/bluetooth-le`
- [ ] 🔴 Criar `services/bluetooth.ts`
- [ ] 🟡 Implementar `scanForDevices()`
- [ ] 🟡 Implementar `connect(deviceId)`
- [ ] 🟡 Implementar `startNotifications()`
- [ ] 🟡 Implementar `disconnect()`
- [ ] 🟡 Handler de dados brutos
- [ ] 🟡 Reconexão automática
- [ ] 🟢 Testar com dispositivo real
- [ ] 🟢 Error handling Bluetooth

### 4.3 Mobile - Processamento EEG (10 tasks)

- [ ] 🔴 Instalar `fft-js`
- [ ] 🔴 Criar `services/eeg.ts`
- [ ] 🟡 Implementar buffer de dados (256 pontos)
- [ ] 🟡 Implementar FFT
- [ ] 🟡 Calcular power spectrum por banda
- [ ] 🟡 Implementar `estimateAttention()`
- [ ] 🟡 Implementar `estimateRelaxation()`
- [ ] 🟡 Filtros de sinal (opcional)
- [ ] 🟢 Otimização de performance
- [ ] 🟢 Validar algoritmos

---

## Fase 5: Relatórios (15 tasks)

**Duração:** 2 semanas
**Objetivo:** Métricas + Exportação

### 5.1 Cálculo de Métricas (8 tasks)

- [ ] 🔴 Criar `services/metricsCalculator.js`
- [ ] 🟡 Implementar `calculateSessionMetrics()`
- [ ] 🟡 Implementar `calculateStudentMetrics()`
- [ ] 🟡 Implementar média simples
- [ ] 🟡 Implementar média móvel (30 pontos)
- [ ] 🟡 Implementar correlação Pearson
- [ ] 🟢 Implementar matriz de correlação
- [ ] 🟢 Validar cálculos estatísticos

### 5.2 Exportação (7 tasks)

- [ ] 🔴 Instalar `pdfkit` e `csv-writer`
- [ ] 🟡 Endpoint: GET `/reports/export?format=pdf`
- [ ] 🟡 Endpoint: GET `/reports/export?format=csv`
- [ ] 🟡 Template PDF (relatório sessão)
- [ ] 🟡 Template CSV (dados EEG)
- [ ] 🟢 Testar geração PDF
- [ ] 🟢 Testar geração CSV

---

## Fase 6: Launcher (8 tasks)

**Duração:** 2 semanas
**Objetivo:** App Desktop

### 6.1 Launcher PC (8 tasks)

- [ ] 🔴 Decisão: Electron vs PWA
- [ ] 🟡 Criar interface professor desktop
- [ ] 🟡 Criar interface aluno desktop
- [ ] 🟡 Implementar Web Bluetooth API
- [ ] 🟡 Adaptar tema light/dark
- [ ] 🟢 Build Windows
- [ ] 🟢 Build Linux
- [ ] 🟢 Documentação de uso

---

## Fase 7: Testes e QA (12 tasks)

**Duração:** 2 semanas
**Objetivo:** Qualidade e Deploy

### 7.1 Testes (8 tasks)

- [ ] 🔴 Configurar Jest (backend)
- [ ] 🔴 Configurar React Testing Library
- [ ] 🟡 Testes unitários backend (80% coverage)
- [ ] 🟡 Testes integração backend
- [ ] 🟡 Testes componentes frontend
- [ ] 🟡 Testes E2E (Cypress)
- [ ] 🟡 Testes de carga (K6)
- [ ] 🟢 Testes Bluetooth com dispositivo real

### 7.2 Deploy e Docs (4 tasks)

- [ ] 🔴 Deploy backend em produção (Render)
- [ ] 🔴 Deploy frontend em produção (Vercel)
- [ ] 🟡 Configurar CI/CD (GitHub Actions)
- [ ] 🟢 Documentação completa

---

## Tasks Extras / Opcionais

### Melhorias Futuras

- [ ] Implementar notificações push
- [ ] Implementar chat professor-aluno
- [ ] Integração com Google Classroom
- [ ] Dashboard de gamificação
- [ ] Sistema de badges/conquistas
- [ ] Modo offline para mobile
- [ ] Sincronização automática
- [ ] Backup automático
- [ ] Monitoring (Sentry, DataDog)
- [ ] Analytics (Google Analytics)

---

## Notas e Bloqueios

### Bloqueios Atuais

**Nenhum bloqueio registrado ainda.**

### Decisões Pendentes

- [ ] Escolher dispositivo EEG oficial
- [ ] Definir política de data retention
- [ ] Escolher ferramenta de monitoring

### Riscos Identificados

- **Alto**: Bluetooth pode ter problemas de compatibilidade
- **Médio**: Volume de dados EEG pode impactar performance
- **Baixo**: Curva de aprendizado dos usuários

---

## Documentos Relacionados

- [20-CRONOGRAMA.md](./20-CRONOGRAMA.md) - Cronograma detalhado
- [07-FASE-1-FUNDACAO.md](./07-FASE-1-FUNDACAO.md) - Fase 1
- [08-FASE-2-DIRECAO.md](./08-FASE-2-DIRECAO.md) - Fase 2
- [09-FASE-3-PROFESSOR.md](./09-FASE-3-PROFESSOR.md) - Fase 3
- [10-FASE-4-ALUNO.md](./10-FASE-4-ALUNO.md) - Fase 4

---

**Última atualização:** 2025-11-07
**Versão:** 1.0

**Próxima revisão:** Após conclusão de cada fase
