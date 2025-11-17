# 21 - DECISÕES TÉCNICAS (ADRs)

## Visão Geral

Este documento registra as Decisões de Arquitetura (Architecture Decision Records - ADRs) do projeto NeuroOne. Cada decisão importante é documentada com contexto, alternativas consideradas, justificativa e consequências.

**Formato**: Baseado em [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) por Michael Nygard.

---

## ADR-001: React como Framework Frontend

**Status**: ✅ Aceito
**Data**: 2025-01-10
**Decisores**: Equipe técnica

### Contexto

Precisamos escolher um framework JavaScript moderno para construir a interface do usuário do NeuroOne, que suporte:
- Componentização
- Estado complexo (sessões em tempo real)
- Integração com WebSocket
- Reutilização de código
- Ecossistema maduro

### Alternativas Consideradas

1. **React** (escolhida)
2. Vue.js 3
3. Svelte
4. Angular

### Decisão

Escolhemos **React 18** com hooks e context API.

### Justificativa

- ✅ Ecossistema maduro e extenso
- ✅ Suporte excelente a TypeScript
- ✅ React Testing Library para testes
- ✅ Comunidade ativa (resolução rápida de problemas)
- ✅ Integração nativa com Vite (build rápido)
- ✅ Equipe já tem experiência
- ✅ Chart.js, Three.js (jogos) têm bindings React

### Consequências

**Positivas**:
- Desenvolvimento ágil com componentes reutilizáveis
- Facilidade para contratar desenvolvedores
- Documentação abundante

**Negativas**:
- Bundle size maior que Svelte (mitigado com code splitting)
- Curva de aprendizado para hooks (aceitável)

---

## ADR-002: Supabase como Backend-as-a-Service

**Status**: ✅ Aceito
**Data**: 2025-01-10
**Decisores**: Equipe técnica

### Contexto

Precisamos de:
- Banco de dados PostgreSQL
- Autenticação JWT
- Storage para arquivos
- Row Level Security (RLS)
- APIs REST/Realtime automáticas

### Alternativas Consideradas

1. **Supabase** (escolhida)
2. Firebase
3. Backend customizado (Node.js + PostgreSQL próprio)
4. AWS Amplify

### Decisão

Usar **Supabase** como BaaS principal.

### Justificativa

- ✅ PostgreSQL (relacional, ACID compliance)
- ✅ RLS nativo (segurança granular)
- ✅ Open-source (sem vendor lock-in)
- ✅ Self-hosting possível no futuro
- ✅ Preço competitivo ($25/mês Pro)
- ✅ Realtime subscriptions nativas
- ✅ Região São Paulo disponível (baixa latência)

**vs Firebase**:
- PostgreSQL > NoSQL para dados relacionais (turmas, alunos, sessões)
- SQL queries mais flexíveis
- Open-source (Firebase é proprietário)

**vs Backend Customizado**:
- Reduz 60% do tempo de desenvolvimento
- Infraestrutura gerenciada (updates, backups)
- Foco em funcionalidades de negócio

### Consequências

**Positivas**:
- Desenvolvimento rápido
- Infraestrutura robusta desde dia 1
- Migrations SQL versionadas

**Negativas**:
- Dependência externa (mitigado: é open-source)
- Limitações de customização (aceitável para nosso caso)

---

## ADR-003: PWA ao invés de App Nativo Mobile

**Status**: ✅ Aceito
**Data**: 2025-01-12
**Decisores**: Equipe técnica + Stakeholders

### Contexto

Alunos precisam acessar o sistema via tablet/smartphone para conectar headset EEG via Bluetooth.

### Alternativas Consideradas

1. **PWA (Progressive Web App)** (escolhida)
2. React Native
3. Capacitor (híbrido)
4. Apps nativos separados (Swift + Kotlin)

### Decisão

Desenvolver **PWA** com Web Bluetooth API.

### Justificativa

- ✅ **Web Bluetooth API** disponível (Chrome Android/Desktop, Edge)
- ✅ Sem necessidade de publicar em stores (Apple/Google)
- ✅ Zero custo de distribuição
- ✅ Atualizações instantâneas (sem aprovação de store)
- ✅ Código compartilhado com web desktop
- ✅ Instalação simples ("Add to Home Screen")
- ✅ Funciona offline com Service Workers

**vs React Native**:
- Web Bluetooth funciona nativamente no PWA
- React Native exige módulos nativos complexos
- PWA = deploy imediato, RN = revisão de store (7-14 dias)

### Consequências

**Positivas**:
- Time-to-market 3x mais rápido
- Manutenção unificada (1 codebase)
- Distribuição instantânea

**Negativas**:
- **iOS tem suporte limitado** a Web Bluetooth (Safari)
  - **Mitigação**: Focar em Android/Windows tablets
  - Futuro: Wrapper Capacitor apenas para iOS se necessário
- Performance levemente inferior (aceitável para nosso uso)

---

## ADR-004: Servidor Python Separado para EEG

**Status**: ✅ Aceito
**Data**: 2025-01-13
**Decisores**: Equipe técnica

### Contexto

Sistema legado BioSync já possui servidor Python funcional (`server_headless-V4.py`) que:
- Recebe dados EEG via WebSocket
- Salva CSV automaticamente
- Redistribui para dashboards

### Alternativas Consideradas

1. **Manter servidor Python separado** (escolhida)
2. Reescrever tudo em Node.js
3. Unificar em um único servidor Node.js

### Decisão

Manter **arquitetura híbrida**: Python (porta 8080) + Node.js (porta 3000).

### Justificativa

- ✅ Aproveitar código Python testado e funcional
- ✅ Evitar reescrita (economia de 2-3 semanas)
- ✅ Python é superior para processamento científico de dados
- ✅ Numpy/Scipy/Matplotlib já integrados no monitor `biosync-atualizado`
- ✅ CSV automático é feature crítica (já funciona)

**Fluxo**:
```
[PWA Aluno] → [Python WS :8080] → CSV + redistribuição
                    ↓
            [Node.js Backend] → Supabase
```

### Consequências

**Positivas**:
- Reuso de código maduro
- Menor risco técnico
- Python otimizado para análise de dados

**Negativas**:
- Dois servidores para manter
- Sincronização entre Python e Node.js
  - **Mitigação**: Node.js consome WebSocket Python (bridge)

---

## ADR-005: Vite ao invés de Create React App

**Status**: ✅ Aceito
**Data**: 2025-01-10
**Decisores**: Equipe técnica

### Contexto

Ferramenta de build para projeto React.

### Alternativas Consideradas

1. **Vite** (escolhida)
2. Create React App (CRA)
3. Next.js
4. Webpack manual

### Decisão

Usar **Vite** como bundler.

### Justificativa

- ✅ **10-100x mais rápido** que CRA (HMR instantâneo)
- ✅ Build otimizado (Rollup)
- ✅ Suporte nativo a TypeScript sem configuração
- ✅ Configuração mínima
- ✅ CRA está deprecated (Meta parou de manter)
- ❌ Next.js é overkill (não precisamos SSR)

### Consequências

**Positivas**:
- Developer Experience excelente (HMR < 50ms)
- Builds de produção otimizados
- Comunidade ativa

**Negativas**:
- Nenhuma significativa

---

## ADR-006: JWT com Access + Refresh Tokens

**Status**: ✅ Aceito
**Data**: 2025-01-11
**Decisores**: Equipe técnica

### Contexto

Autenticação segura e UX fluente.

### Alternativas Consideradas

1. **JWT (Access 15min + Refresh 7 dias)** (escolhida)
2. Sessions em cookies (server-side)
3. JWT sem refresh (longa duração)

### Decisão

Implementar **Access Token (15 min) + Refresh Token (7 dias)**.

### Justificativa

**vs Sessions**:
- ✅ Stateless (escala horizontalmente)
- ✅ Funciona com arquitetura distribuída
- ✅ Supabase já fornece JWT nativamente

**vs JWT longa duração**:
- ✅ Mais seguro (window de exposição de 15 min)
- ✅ Refresh transparente (usuário não percebe)
- ✅ Revogação possível (via refresh token)

### Consequências

**Positivas**:
- Segurança balanceada com UX
- Revogação granular

**Negativas**:
- Lógica de refresh no frontend (aceitável)

---

## ADR-007: Row Level Security (RLS) ao invés de Middleware

**Status**: ✅ Aceito
**Data**: 2025-01-11
**Decisores**: Equipe técnica

### Contexto

Garantir que:
- Alunos vejam apenas seus dados
- Professores vejam dados de suas turmas
- Direção veja tudo

### Alternativas Consideradas

1. **RLS (Row Level Security) no Supabase** (escolhida)
2. Middleware de autorização no backend Node.js
3. Ambos (defesa em profundidade)

### Decisão

Usar **RLS como camada principal** de segurança.

### Justificativa

- ✅ Segurança na camada de dados (mais robusto)
- ✅ Funciona mesmo se backend for comprometido
- ✅ Automaticamente aplicado a queries
- ✅ Supabase otimiza queries com RLS
- ✅ Menos código para manter

```sql
-- Exemplo: Aluno só vê seus dados
CREATE POLICY "Students can view own data"
ON student_metrics
FOR SELECT
USING (auth.uid() = student_id);
```

### Consequências

**Positivas**:
- Segurança robusta e testável
- Proteção em múltiplas camadas

**Negativas**:
- Debugging pode ser complexo (mitigado com logs)

---

## ADR-008: Monorepo vs Multi-repo

**Status**: ✅ Aceito
**Data**: 2025-01-10
**Decisores**: Equipe técnica

### Contexto

Organização de código:
- Frontend React
- Backend Node.js
- Servidor Python
- Launcher Electron
- Docs

### Alternativas Consideradas

1. **Multi-repo** (escolhida)
2. Monorepo (Turborepo, Nx)

### Decisão

Usar **repositórios separados**.

### Justificativa

- ✅ Deploy independente (frontend ≠ backend ≠ Python)
- ✅ CI/CD mais simples
- ✅ Menor overhead (não precisamos de workspace tooling)
- ✅ Equipes podem ter acessos diferentes (opcional)
- ✅ Projeto não é tão grande para justificar monorepo

**Estrutura**:
```
neuroone/frontend      (Vercel)
neuroone/backend       (Railway)
neuroone/python-server (SSH)
neuroone/launcher      (Electron)
neuroone/docs          (GitHub Pages)
```

### Consequências

**Positivas**:
- Simplicidade
- Deploy granular

**Negativas**:
- Não compartilha código facilmente (aceitável - poucos tipos shared)

---

## ADR-009: Chart.js para Visualizações

**Status**: ✅ Aceito
**Data**: 2025-01-12
**Decisores**: Equipe técnica

### Contexto

Gráficos de:
- Evolução de atenção (linhas)
- Distribuição (pizza)
- Ondas cerebrais (barras)

### Alternativas Consideradas

1. **Chart.js** (escolhida)
2. Recharts
3. D3.js
4. Apache ECharts

### Decisão

Usar **Chart.js** via `react-chartjs-2`.

### Justificativa

- ✅ Simples e performático
- ✅ Bundle pequeno (~60KB)
- ✅ Animações suaves
- ✅ Responsivo out-of-the-box
- ✅ Documentação excelente

**vs Recharts**:
- Chart.js é mais leve
- Melhor performance com datasets grandes

**vs D3.js**:
- Chart.js é mais declarativo (menos código)
- D3 é overkill para gráficos simples

### Consequências

**Positivas**:
- Desenvolvimento rápido
- Performance boa (60fps)

**Negativas**:
- Customizações avançadas limitadas (não é problema para nosso caso)

---

## ADR-010: Jest + Vitest ao invés de só Jest

**Status**: ✅ Aceito
**Data**: 2025-01-14
**Decisores**: Equipe técnica

### Contexto

Testes unitários precisam rodar rápido.

### Alternativas Consideradas

1. **Vitest (frontend) + Jest (backend)** (escolhida)
2. Jest para tudo
3. Vitest para tudo

### Decisão

Usar **Vitest no frontend**, **Jest no backend**.

### Justificativa

**Frontend (Vitest)**:
- ✅ Integra nativamente com Vite
- ✅ 10x mais rápido que Jest
- ✅ API compatível com Jest (fácil migração)
- ✅ HMR para testes (watch mode instantâneo)

**Backend (Jest)**:
- ✅ Mais maduro para Node.js
- ✅ Supabase mock funciona melhor
- ✅ Supertest integra perfeitamente

### Consequências

**Positivas**:
- Testes rápidos (feedback < 1s)
- Developer Experience excelente

**Negativas**:
- Duas ferramentas (aceitável - mesma API)

---

## Resumo de Decisões

| ADR | Decisão | Status | Impacto |
|-----|---------|--------|---------|
| 001 | React como framework | ✅ Aceito | Alto |
| 002 | Supabase como BaaS | ✅ Aceito | Alto |
| 003 | PWA ao invés de nativo | ✅ Aceito | Alto |
| 004 | Servidor Python separado | ✅ Aceito | Médio |
| 005 | Vite ao invés de CRA | ✅ Aceito | Médio |
| 006 | JWT Access + Refresh | ✅ Aceito | Alto |
| 007 | RLS como segurança principal | ✅ Aceito | Alto |
| 008 | Multi-repo | ✅ Aceito | Baixo |
| 009 | Chart.js para gráficos | ✅ Aceito | Baixo |
| 010 | Vitest + Jest | ✅ Aceito | Baixo |

---

## ADRs Pendentes (Para Discussão)

### ADR-011: Code Signing para Launcher

**Status**: 🔶 Proposto

**Questão**: Vale a pena adquirir certificado code signing ($200-400/ano)?

**Prós**:
- Windows SmartScreen não bloqueia
- macOS Gatekeeper aceita automaticamente

**Contras**:
- Custo anual
- Apps podem funcionar sem (usuários fazem bypass manual)

**Decisão**: Adiar para após MVP (opcional)

---

### ADR-012: TypeScript Gradual

**Status**: 🔶 Proposto

**Questão**: Migrar para TypeScript ou manter JavaScript?

**Prós TypeScript**:
- Type safety (menos bugs)
- Autocomplete melhor
- Refactorings mais seguros

**Contras**:
- Curva de aprendizado
- Setup adicional
- Builds mais lentos

**Decisão**: Propor migração gradual (arquivos novos em TS, antigos em JS)

---

## Processo para Criar Novo ADR

1. **Identificar Decisão Importante**
   - Afeta arquitetura
   - Difícil de reverter
   - Impacta múltiplos times

2. **Documentar**
   - Contexto e problema
   - Alternativas consideradas
   - Decisão e justificativa
   - Consequências (positivas e negativas)

3. **Revisar com Equipe**
   - Apresentar em reunião técnica
   - Coletar feedback
   - Ajustar se necessário

4. **Aprovar**
   - Status: Proposto → Aceito
   - Commit no Git
   - Comunicar a equipe

5. **Revisar Periodicamente**
   - Decisões podem se tornar obsoletas
   - Status: Aceito → Deprecated → Substituído

---

## Referências

- [Architecture Decision Records (ADR)](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Template](https://github.com/joelparkerhenderson/architecture-decision-record)

---

**Última atualização**: 2025-01-16
**Versão**: 1.0
