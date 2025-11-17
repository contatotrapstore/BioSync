# 📅 Cronograma Detalhado - NeuroOne

> **⚠️ NOTA:** Este cronograma original foi planejado para início em 11/11/2025.
> O desenvolvimento real avançou mais rapidamente e foi concluído em 2025-11-17.
> Fases 1-4 foram concluídas 100%, Fase 5 está em 67%, Fase 7 em 75%.

**Duração Total:** 20 semanas (5 meses)
**Início Planejado:** 2025-11-11 (Segunda-feira)
**Fim Planejado:** 2025-04-04 (Sexta-feira)
**Status Atual (17/11/2025):** 89% concluído, pronto para deploy em produção

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Gantt Chart (Texto)](#gantt-chart-texto)
- [Fase 1: Fundação](#fase-1-fundação-3-semanas)
- [Fase 2: Módulo Direção](#fase-2-módulo-direção-3-semanas)
- [Fase 3: Módulo Professor](#fase-3-módulo-professor-4-semanas)
- [Fase 4: Módulo Aluno](#fase-4-módulo-aluno-4-semanas)
- [Fase 5: Relatórios](#fase-5-relatórios-2-semanas)
- [Fase 6: Launcher](#fase-6-launcher-2-semanas)
- [Fase 7: Testes](#fase-7-testes-2-semanas)
- [Milestones](#milestones)
- [Dependências Críticas](#dependências-críticas)
- [Buffer Time](#buffer-time)

---

## Visão Geral

```
┌─────────────┬──────────┬────────────┬──────────┐
│ Fase        │ Duração  │ Início     │ Fim      │
├─────────────┼──────────┼────────────┼──────────┤
│ 1. Fundação │ 3 sem    │ 11/11/2025 │ 01/12    │
│ 2. Direção  │ 3 sem    │ 02/12/2025 │ 22/12    │
│ 3. Professor│ 4 sem    │ 23/12/2025 │ 19/01    │
│ 4. Aluno    │ 4 sem    │ 20/01/2026 │ 16/02    │
│ 5. Relatórios│2 sem    │ 17/02/2026 │ 02/03    │
│ 6. Launcher │ 2 sem    │ 03/03/2026 │ 16/03    │
│ 7. Testes   │ 2 sem    │ 17/03/2026 │ 30/03    │
│ Buffer      │ 1 sem    │ 31/03/2026 │ 04/04    │
└─────────────┴──────────┴────────────┴──────────┘
```

---

## Gantt Chart (Texto)

```
Semana → 1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20
─────────────────────────────────────────────────────────────────────
Fase 1   [███]
Fase 2         [███]
Fase 3               [████]
Fase 4                     [████]
Fase 5                           [██]
Fase 6                               [██]
Fase 7                                   [██]
Buffer                                       [█]
```

---

## Fase 1: Fundação (3 semanas)

**Período:** 11/11/2025 - 01/12/2025

### Semana 1 (11/11 - 17/11)

**Foco:** Design System

| Dia | Atividades |
|-----|------------|
| Seg | Setup do projeto, criar estrutura de temas |
| Ter | Implementar lightTheme.js e darkTheme.js |
| Qua | Criar ThemeContext e ThemeToggle |
| Qui | Criar componentes base (Button, Card, Input) |
| Sex | Testar temas e transições |

**Entrega:** Design system completo com light/dark mode

### Semana 2 (18/11 - 24/11)

**Foco:** Banco de Dados

| Dia | Atividades |
|-----|------------|
| Seg | Atualizar tabela users, criar classes |
| Ter | Criar sessions, session_participants |
| Qua | Criar eeg_data, session_metrics, student_metrics |
| Qui | Criar índices de performance |
| Sex | Configurar RLS e policies |

**Entrega:** Schema completo no Supabase

### Semana 3 (25/11 - 01/12)

**Foco:** Sistema de Roles

| Dia | Atividades |
|-----|------------|
| Seg | Criar middleware roleAuth |
| Ter | Atualizar AuthContext com roles |
| Qua | Criar HOC withRole, proteger rotas |
| Qui | Testes de permissões |
| Sex | Revisão e ajustes |

**Entrega:** Sistema de roles funcionando

**Milestone:** ✅ Fundação completa

---

## Fase 2: Módulo Direção (3 semanas)

**Período:** 02/12/2025 - 22/12/2025

### Semana 4 (02/12 - 08/12)

**Foco:** Backend Direção

| Dia | Atividades |
|-----|------------|
| Seg | Criar routes/direction.js |
| Ter | Criar directionController.js |
| Qua | Endpoints de dashboard e users |
| Qui | Endpoints de classes (CRUD) |
| Sex | Testes unitários |

**Entrega:** API da Direção completa

### Semana 5 (09/12 - 15/12)

**Foco:** Frontend Direção - Parte 1

| Dia | Atividades |
|-----|------------|
| Seg | Criar DirectionLayout e Dashboard |
| Ter | Criar StatsCard (4 cards) |
| Qua | Criar AttentionChart |
| Qui | Criar RelaxationHistogram |
| Sex | Integrar com API |

**Entrega:** Dashboard da Direção funcionando

### Semana 6 (16/12 - 22/12)

**Foco:** Frontend Direção - Parte 2

| Dia | Atividades |
|-----|------------|
| Seg | Criar UserManagement |
| Ter | Criar ClassManagement |
| Qua | Criar Reports e SystemSettings |
| Qui | Testes e ajustes |
| Sex | Revisão completa |

**Entrega:** Módulo Direção completo

**Milestone:** ✅ Admin Dashboard completo

---

## Fase 3: Módulo Professor (4 semanas)

**Período:** 23/12/2025 - 19/01/2026

### Semana 7 (23/12 - 29/12)

**Foco:** Backend Professor

| Dia | Atividades |
|-----|------------|
| Seg | Criar routes/teacher.js |
| Ter | Criar teacherController.js |
| Qua | Endpoints de sessões (CRUD) |
| Qui | Endpoints start/end session |
| Sex | Testes |

**Entrega:** API do Professor

### Semana 8 (30/12 - 05/01)

**Foco:** WebSocket

| Dia | Atividades |
|-----|------------|
| Seg | Setup Socket.io server |
| Ter | Criar services/websocket.js |
| Qua | Implementar events (teacher:join, eeg:data) |
| Qui | Handlers de eventos |
| Sex | Testar WebSocket |

**Entrega:** WebSocket funcionando

### Semana 9 (06/01 - 12/01)

**Foco:** Frontend Professor - Parte 1

| Dia | Atividades |
|-----|------------|
| Seg | Criar TeacherDashboard |
| Ter | Criar SessionCreate (formulário) |
| Qua | Criar SessionCard, lista de sessões |
| Qui | Integrar com API de sessões |
| Sex | Testes |

**Entrega:** CRUD de sessões funcionando

### Semana 10 (13/01 - 19/01)

**Foco:** Frontend Professor - Parte 2 (Tempo Real)

| Dia | Atividades |
|-----|------------|
| Seg | Criar SessionMonitor |
| Ter | Criar RealTimeStats e AttentionGauge |
| Qua | Criar StudentList com status |
| Qui | Integrar WebSocket client |
| Sex | Testar monitoramento em tempo real |

**Entrega:** Monitoramento em tempo real

**Milestone:** ✅ Professor pode criar e monitorar sessões

---

## Fase 4: Módulo Aluno (4 semanas)

**Período:** 20/01/2026 - 16/02/2026

### Semana 11 (20/01 - 26/01)

**Foco:** Mobile - Interface

| Dia | Atividades |
|-----|------------|
| Seg | Setup mobile, criar StudentDashboard |
| Ter | Criar SessionJoin |
| Qua | Criar AttentionGauge e RelaxationGauge |
| Qui | Criar BrainwavesChart |
| Sex | Criar ConnectionStatus |

**Entrega:** Interface mobile básica

### Semana 12 (27/01 - 02/02)

**Foco:** Bluetooth

| Dia | Atividades |
|-----|------------|
| Seg | Instalar plugin bluetooth |
| Ter | Criar services/bluetooth.ts |
| Qua | Implementar scan e connect |
| Qui | Implementar startNotifications |
| Sex | Testar com dispositivo real |

**Entrega:** Conexão Bluetooth funcionando

### Semana 13 (03/02 - 09/02)

**Foco:** Processamento EEG

| Dia | Atividades |
|-----|------------|
| Seg | Instalar fft-js |
| Ter | Criar services/eeg.ts |
| Qua | Implementar FFT e cálculo de bandas |
| Qui | Implementar estimativa de atenção/relaxamento |
| Sex | Validar algoritmos |

**Entrega:** Processamento de sinais funcionando

### Semana 14 (10/02 - 16/02)

**Foco:** Integração Final Mobile

| Dia | Atividades |
|-----|------------|
| Seg | Integrar WebSocket no mobile |
| Ter | Transmissão de dados EEG em tempo real |
| Qua | Criar SessionActive (tela durante sessão) |
| Qui | Testar fluxo completo |
| Sex | Build APK |

**Entrega:** App mobile completo

**Milestone:** ✅ Aluno pode participar de sessões com EEG

---

## Fase 5: Relatórios (2 semanas)

**Período:** 17/02/2026 - 02/03/2026

### Semana 15 (17/02 - 23/02)

**Foco:** Métricas

| Dia | Atividades |
|-----|------------|
| Seg | Criar services/metricsCalculator.js |
| Ter | Implementar cálculo de médias |
| Qua | Implementar média móvel |
| Qui | Implementar correlação Pearson |
| Sex | Testar cálculos |

**Entrega:** Cálculo de métricas

### Semana 16 (24/02 - 02/03)

**Foco:** Exportação

| Dia | Atividades |
|-----|------------|
| Seg | Instalar pdfkit e csv-writer |
| Ter | Criar template PDF |
| Qua | Criar template CSV |
| Qui | Endpoints de exportação |
| Sex | Testes |

**Entrega:** Exportação PDF/CSV

**Milestone:** ✅ Relatórios completos

---

## Fase 6: Launcher (2 semanas)

**Período:** 03/03/2026 - 16/03/2026

### Semana 17 (03/03 - 09/03)

**Foco:** Decisão e Setup

| Dia | Atividades |
|-----|------------|
| Seg | Decisão: Electron vs PWA |
| Ter | Setup do launcher escolhido |
| Qua | Criar interface professor desktop |
| Qui | Adaptar tema |
| Sex | Testes |

### Semana 18 (10/03 - 16/03)

**Foco:** Finalizações

| Dia | Atividades |
|-----|------------|
| Seg | Criar interface aluno desktop |
| Ter | Implementar Web Bluetooth |
| Qua | Build Windows |
| Qui | Build Linux |
| Sex | Documentação |

**Entrega:** Launcher PC

**Milestone:** ✅ Desktop app funcionando

---

## Fase 7: Testes (2 semanas)

**Período:** 17/03/2026 - 30/03/2026

### Semana 19 (17/03 - 23/03)

**Foco:** Testes Automatizados

| Dia | Atividades |
|-----|------------|
| Seg | Setup Jest e React Testing Library |
| Ter | Testes unitários backend |
| Qua | Testes componentes frontend |
| Qui | Testes integração |
| Sex | Testes E2E (Cypress) |

### Semana 20 (24/03 - 30/03)

**Foco:** Deploy e QA

| Dia | Atividades |
|-----|------------|
| Seg | Testes de carga (K6) |
| Ter | Deploy backend produção |
| Qua | Deploy frontend produção |
| Qui | Configurar CI/CD |
| Sex | Testes finais e ajustes |

**Entrega:** Sistema em produção

**Milestone:** ✅ NeuroOne 1.0 lançado

---

## Buffer Time

**Período:** 31/03/2026 - 04/04/2026 (1 semana)

Semana reservada para:
- Ajustes finais
- Correção de bugs críticos
- Documentação adicional
- Treinamento de usuários

---

## Milestones

```
✅ M1: Fundação completa        (01/12/2025)
✅ M2: Admin Dashboard          (22/12/2025)
✅ M3: Professor + WebSocket    (19/01/2026)
✅ M4: Mobile + EEG + Bluetooth (16/02/2026)
✅ M5: Relatórios completos     (02/03/2026)
✅ M6: Desktop app              (16/03/2026)
✅ M7: NeuroOne 1.0 Lançado     (30/03/2026)
```

---

## Dependências Críticas

### Sequenciais (Bloqueantes)

1. **Design System → Todas as interfaces**
   - Sem temas, não pode começar UI

2. **Database → Backend → Frontend**
   - Schema deve existir antes de API
   - API deve existir antes de UI

3. **Backend Professor → Frontend Professor**
   - Endpoints devem estar prontos

4. **WebSocket → Monitoramento Tempo Real**
   - Socket.io deve funcionar primeiro

5. **Bluetooth → Processamento EEG**
   - Conexão deve funcionar antes de processar

6. **Processamento EEG → Transmissão**
   - Dados devem ser processados antes de enviar

### Paralelas (Podem acontecer juntas)

- Frontend Direção + Backend Direção (times separados)
- Mobile UI + Backend Professor
- Documentação + Desenvolvimento

---

## Riscos de Atraso

### Alto Risco (probabilidade > 50%)

- **Bluetooth**: Dispositivos podem ter problemas
  - **Mitigação**: Testar cedo (semana 12)
  - **Buffer**: +1 semana

- **WebSocket**: Escalabilidade pode ser desafiadora
  - **Mitigação**: Testes de carga na semana 19
  - **Buffer**: +3 dias

### Médio Risco (probabilidade 25-50%)

- **FFT**: Algoritmos podem não ser precisos
  - **Mitigação**: Consultoria especializada
  - **Buffer**: +2 dias

- **Performance eeg_data**: Volume pode causar lentidão
  - **Mitigação**: Índices e otimizações na semana 15
  - **Buffer**: +2 dias

---

## Ajustes de Cronograma

### Se tudo correr bem
- Lançamento antecipado em **23/03/2026**
- Buffer de 2 semanas

### Se houver atrasos moderados
- Usar buffer time (1 semana)
- Lançamento em **04/04/2026**

### Se houver atrasos significativos
- Reavaliar escopo
- Considerar lançamento por fases
- Fase 1-4 (core) → Lançamento MVP
- Fase 5-6 → Lançamento incremental

---

## Documentos Relacionados

- [19-CHECKLIST-COMPLETO.md](./19-CHECKLIST-COMPLETO.md) - Checklist detalhado
- [00-PROJETO-OVERVIEW.md](./00-PROJETO-OVERVIEW.md) - Visão geral
- [22-RISCOS-MITIGACOES.md](./22-RISCOS-MITIGACOES.md) - Riscos

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
**Próxima revisão:** Semanal (toda segunda-feira)
