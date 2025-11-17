# 🧠 NeuroOne - Visão Geral do Projeto

**Versão:** 1.0
**Data:** 2025-11-07
**Status:** Em Planejamento

---

## 📋 Índice

- [Sumário Executivo](#sumário-executivo)
- [Objetivo da Reestruturação](#objetivo-da-reestruturação)
- [Personas](#personas)
- [Stack Tecnológico](#stack-tecnológico)
- [Duração e Fases](#duração-e-fases)
- [Equipe Necessária](#equipe-necessária)
- [KPIs e Métricas de Sucesso](#kpis-e-métricas-de-sucesso)

---

## Sumário Executivo

**NeuroOne** é uma plataforma educacional de neurofeedback que permite monitorar e analisar a atenção e relaxamento de alunos em tempo real através de dispositivos EEG (Eletroencefalograma).

O projeto atual (BioSync Game) é uma plataforma de jogos cognitivos. Esta reestruturação transformará o sistema em uma ferramenta educacional completa com 3 tipos de usuários:

1. **Direção (Administrador)**: Gestão completa, relatórios agregados, configurações
2. **Professor**: Criação de sessões, monitoramento em tempo real, análises
3. **Aluno**: Participação em sessões, visualização de métricas pessoais

---

## Objetivo da Reestruturação

### Problema Atual
- Sistema focado em jogos cognitivos individuais
- Sem recursos de monitoramento em tempo real
- Sem conexão com dispositivos EEG
- Sem análise de ondas cerebrais
- Sem sistema de sessões de aula

### Solução Proposta
Criar plataforma completa de neurofeedback educacional com:
- ✅ Monitoramento de atenção e relaxamento em tempo real
- ✅ Integração com dispositivos EEG via Bluetooth
- ✅ Processamento de sinais cerebrais (FFT)
- ✅ Análises e correlações estatísticas
- ✅ Relatórios por aluno, turma e sessão
- ✅ Interface adaptada para cada tipo de usuário
- ✅ Modo claro e escuro

### Abordagem
**Reestruturação progressiva** mantendo infraestrutura base:
- Manter: Supabase, JWT, Vercel, Render
- Reconstruir: Frontend, Backend API, Mobile App
- Adicionar: WebSocket, Bluetooth, Processamento EEG

---

## Personas

### 👔 1. Direção (Administrador)

**Perfil:**
- Diretor(a) ou coordenador(a) pedagógico(a)
- Visão macro da escola
- Tomador de decisões estratégicas

**Necessidades:**
- Dashboard com visão geral de todas turmas e sessões
- Relatórios agregados de desempenho
- Gestão de usuários (professores e alunos)
- Gestão de turmas
- Configurações do sistema
- Exportação de dados (PDF/CSV)

**Plataforma:**
- Web (Desktop/Tablet)

---

### 👨‍🏫 2. Professor

**Perfil:**
- Professor(a) de qualquer disciplina
- Responsável por turmas
- Conduz sessões de monitoramento

**Necessidades:**
- Criar e gerenciar sessões de aula
- Iniciar/encerrar sessões
- Monitorar alunos em tempo real
- Ver atenção e relaxamento da turma
- Ver dados individuais de cada aluno
- Gerar relatórios de sessão
- Enviar dados para direção

**Plataforma:**
- Web (Desktop/Tablet)
- PWA (opcional)

---

### 🧒 3. Aluno

**Perfil:**
- Estudante do ensino fundamental ou médio
- Participa de sessões de monitoramento
- Quer visualizar seu próprio desempenho

**Necessidades:**
- Conectar dispositivo EEG via Bluetooth
- Entrar em sessão ativa do professor
- Transmitir dados em tempo real
- Visualizar suas métricas (atenção, relaxamento)
- Ver análise de ondas cerebrais
- Receber feedback personalizado
- Histórico de sessões

**Plataforma:**
- Mobile (Android/iOS)
- Tablet

---

## Stack Tecnológico

### Frontend (Admin/Professor/Direção)

```
Framework:      React 18
UI Library:     Material-UI v5 (custom theme)
Router:         React Router DOM v6
HTTP Client:    Axios
Charts:         Recharts
Real-time:      Socket.io-client
State:          Context API / Zustand
Build:          Vite
```

### Mobile (Aluno)

```
Framework:      React 18 + TypeScript
Platform:       Capacitor 7
Bluetooth:      @capacitor-community/bluetooth-le
Signal:         fft-js (FFT processing)
Real-time:      Socket.io-client
Charts:         Recharts Mobile
Build:          Capacitor + Android Studio
```

### Backend

```
Runtime:        Node.js 18
Framework:      Express.js
Database:       Supabase (PostgreSQL 17)
Auth:           JWT (access + refresh tokens)
Real-time:      Socket.io server
Validation:     express-validator
Security:       Helmet, CORS, Rate Limiting
```

### Infraestrutura

```
Frontend:       Vercel
Backend:        Render.com
Database:       Supabase (sa-east-1)
CI/CD:          GitHub Actions
Monitoring:     (A definir)
```

---

## Duração e Fases

**Duração Total:** 20 semanas (5 meses)

### Fase 1: Fundação e Design System
**Duração:** 3 semanas
**Entregas:**
- Design system (light/dark theme)
- Novo schema de banco de dados
- Sistema de roles e permissões

### Fase 2: Módulo Direção
**Duração:** 3 semanas
**Entregas:**
- Dashboard da direção
- Gestão de usuários e turmas
- Relatórios básicos

### Fase 3: Módulo Professor
**Duração:** 4 semanas
**Entregas:**
- Interface do professor
- Criação e gestão de sessões
- Monitoramento em tempo real via WebSocket
- Dashboards e gráficos

### Fase 4: Módulo Aluno
**Duração:** 4 semanas
**Entregas:**
- App mobile
- Conexão Bluetooth com EEG
- Processamento de sinais (FFT)
- Transmissão em tempo real
- Dashboard pessoal

### Fase 5: Relatórios e Análises
**Duração:** 2 semanas
**Entregas:**
- Cálculo de métricas agregadas
- Correlações estatísticas
- Exportação PDF/CSV
- Gráficos avançados

### Fase 6: Launcher PC
**Duração:** 2 semanas
**Entregas:**
- Interface desktop (PWA ou Electron)
- Suporte a Bluetooth desktop

### Fase 7: Testes e Polimento
**Duração:** 2 semanas
**Entregas:**
- Testes unitários e integração
- Testes E2E
- Testes de carga
- Documentação completa
- Deploy em produção

---

## Equipe Necessária

### Desenvolvedores (Recomendado)

1. **Backend Developer (1 pessoa)**
   - Node.js + Express
   - WebSocket (Socket.io)
   - Supabase/PostgreSQL
   - RESTful API design

2. **Frontend Developer (1 pessoa)**
   - React 18
   - Material-UI
   - WebSocket client
   - Charts e visualizações

3. **Mobile Developer (1 pessoa)**
   - React Native / Capacitor
   - TypeScript
   - Bluetooth LE integration
   - Signal processing (FFT)

4. **Full Stack Developer (1 pessoa)** - Opcional
   - Suporte geral
   - Integrações

### Especialistas (Consultoria)

5. **Signal Processing Expert** - Consultoria pontual
   - Processamento de sinais EEG
   - Algoritmos de FFT
   - Validação de métricas

6. **UI/UX Designer** - Part-time
   - Design system
   - Protótipos
   - Testes de usabilidade

### QA e Operações

7. **QA Engineer** - Part-time
   - Testes automatizados
   - Testes E2E
   - Testes com dispositivos reais

8. **DevOps** - Consultoria pontual
   - CI/CD setup
   - Monitoring
   - Scaling

### Time Mínimo
- **2 desenvolvedores full-stack** + consultoria especializada

### Time Ideal
- **4 desenvolvedores** + **1 QA** + consultoria

---

## KPIs e Métricas de Sucesso

### Técnicas

- ✅ **Uptime:** 99.5%+
- ✅ **Latência API:** < 200ms (p95)
- ✅ **Latência WebSocket:** < 500ms
- ✅ **Code Coverage:** 80%+
- ✅ **Performance Score:** 90+ (Lighthouse)
- ✅ **Zero vulnerabilidades críticas** (npm audit)

### Negócio

- ✅ **Adoção:** 80%+ dos professores usando
- ✅ **Engajamento:** 3+ sessões por semana por turma
- ✅ **Retenção:** 90%+ após 3 meses
- ✅ **Satisfação:** NPS 50+ (Net Promoter Score)
- ✅ **Dados coletados:** 10.000+ pontos de EEG por mês

### Educação

- ✅ **Insights gerados:** 5+ insights por sessão
- ✅ **Relatórios criados:** 100+ por mês
- ✅ **Melhoria de atenção:** 10%+ após 3 meses de uso

---

## Próximos Passos

1. ✅ Revisar e aprovar esta documentação
2. 📝 Ler documentos detalhados de cada fase
3. 🚀 Iniciar Fase 1: Fundação e Design System
4. 📊 Acompanhar progresso via checklist

---

## Documentos Relacionados

- [01-ANALISE-ESTADO-ATUAL.md](./01-ANALISE-ESTADO-ATUAL.md) - Análise do código atual
- [02-DESIGN-SYSTEM.md](./02-DESIGN-SYSTEM.md) - Design system completo
- [03-ARQUITETURA.md](./03-ARQUITETURA.md) - Arquitetura técnica
- [19-CHECKLIST-COMPLETO.md](./19-CHECKLIST-COMPLETO.md) - Checklist de 120+ tasks
- [20-CRONOGRAMA.md](./20-CRONOGRAMA.md) - Cronograma detalhado

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
**Autor:** Equipe NeuroOne
