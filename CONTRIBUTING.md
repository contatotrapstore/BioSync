# 🤝 Guia de Contribuição - NeuroOne

Obrigado por considerar contribuir com o NeuroOne! Este documento fornece diretrizes para contribuições ao projeto.

---

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Padrões de Código](#padrões-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Features](#sugerir-features)

---

## 📜 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

### Nossos Padrões

✅ **Comportamentos encorajados:**
- Usar linguagem acolhedora e inclusiva
- Respeitar pontos de vista e experiências diferentes
- Aceitar críticas construtivas de forma elegante
- Focar no que é melhor para a comunidade

❌ **Comportamentos inaceitáveis:**
- Uso de linguagem ou imagens sexualizadas
- Comentários insultuosos ou depreciativos
- Assédio público ou privado
- Publicar informações privadas sem permissão

---

## 🚀 Como Contribuir

### 1. Fork o Repositório

```bash
# Clone seu fork
git clone https://github.com/seu-usuario/neuroone.git
cd neuroone

# Adicione o repositório original como upstream
git remote add upstream https://github.com/original-org/neuroone.git
```

### 2. Crie uma Branch

```bash
# Atualize sua branch main
git checkout main
git pull upstream main

# Crie uma nova branch para sua feature
git checkout -b feature/nome-da-feature

# Ou para correção de bug
git checkout -b fix/nome-do-bug
```

### 3. Faça suas Mudanças

- Siga os [Padrões de Código](#padrões-de-código)
- Escreva testes para novas funcionalidades
- Atualize a documentação se necessário
- Certifique-se de que todos os testes passam

### 4. Commit suas Mudanças

```bash
# Adicione os arquivos modificados
git add .

# Faça commit seguindo Conventional Commits
git commit -m "feat: adiciona exportação de relatórios em CSV"
```

Ver seção [Commits](#commits) para detalhes.

### 5. Push e Crie Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-feature
```

Então abra um Pull Request no GitHub.

---

## 💻 Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- PostgreSQL 17+ ou conta Supabase
- Git

### Setup do Backend

```bash
cd neuroone-backend
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Rodar testes
npm test

# Rodar em modo desenvolvimento
npm run dev
```

### Setup do Frontend

```bash
cd neuroone-frontend
npm install

# Configure variáveis de ambiente
cp .env.example .env

# Rodar em modo desenvolvimento
npm run dev
```

### Rodando Testes

```bash
# Backend
cd neuroone-backend
npm test                    # Todos os testes
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Frontend
cd neuroone-frontend
npm test
```

---

## 📝 Padrões de Código

### JavaScript/React

- **ES Modules**: Sempre use `import`/`export` (nunca `require`)
- **Functional Components**: Prefira functional components com hooks
- **PropTypes**: Documente props com JSDoc ou TypeScript
- **Naming**:
  - Components: PascalCase (`StudentDashboard.jsx`)
  - Functions: camelCase (`loadSessionData`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

### ESLint e Prettier

```bash
# Rodar linter
npm run lint

# Auto-fix
npm run lint:fix

# Formatar código
npm run format
```

### Estrutura de Arquivos

```
neuroone-frontend/src/
├── pages/              # Páginas por módulo
│   ├── admin/
│   ├── teacher/
│   └── student/
├── components/         # Componentes reutilizáveis
│   ├── atoms/          # Componentes atômicos
│   ├── molecules/      # Componentes compostos
│   └── organisms/      # Seções complexas
├── services/           # API clients
├── contexts/           # React contexts
└── utils/              # Funções utilitárias
```

---

## 💬 Commits

Usamos **Conventional Commits** para mensagens de commit claras e consistentes.

### Formato

```
<tipo>(<escopo>): <descrição curta>

<corpo opcional>

<footer opcional>
```

### Tipos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação, ponto e vírgula, etc (sem mudança de código)
- `refactor`: Refatoração de código
- `test`: Adicionar ou corrigir testes
- `chore`: Mudanças em build, CI/CD, etc

### Exemplos

```bash
# Feature
git commit -m "feat(student): adiciona página de histórico de sessões"

# Bug fix
git commit -m "fix(websocket): corrige desconexão inesperada"

# Documentação
git commit -m "docs: atualiza guia de deploy para Railway"

# Refactor
git commit -m "refactor(api): simplifica lógica de autenticação JWT"

# Breaking change
git commit -m "feat(auth)!: muda estrutura de tokens JWT

BREAKING CHANGE: estrutura do token JWT foi alterada.
Tokens antigos não funcionarão mais."
```

---

## 🔀 Pull Requests

### Checklist Antes de Abrir PR

- [ ] Código segue os padrões do projeto
- [ ] Todos os testes passam (`npm test`)
- [ ] Novos testes foram adicionados (se aplicável)
- [ ] Documentação foi atualizada (se aplicável)
- [ ] Commit messages seguem Conventional Commits
- [ ] Branch está atualizada com `main`

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um issue)
- [ ] Nova feature (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação

## Como Testar
Passos para testar as mudanças:
1. ...
2. ...

## Screenshots (se aplicável)
...

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Revisei meu próprio código
- [ ] Comentei código complexo
- [ ] Atualizei a documentação
- [ ] Minhas mudanças não geram warnings
- [ ] Adicionei testes que provam que meu fix funciona
- [ ] Testes novos e existentes passam localmente
```

### Processo de Review

1. **Automated Checks**: CI/CD roda testes automaticamente
2. **Code Review**: Maintainers revisam o código
3. **Requested Changes**: Faça as mudanças solicitadas
4. **Approval**: PR é aprovado
5. **Merge**: Maintainer faz merge do PR

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. **Procure issues existentes** para evitar duplicatas
2. **Verifique a documentação** - talvez não seja um bug
3. **Teste na última versão** - o bug pode já estar corrigido

### Como Reportar

Use o template de issue do GitHub e forneça:

- **Título claro**: Resumo do problema
- **Descrição**: O que aconteceu vs o que era esperado
- **Passos para reproduzir**: Lista detalhada
- **Ambiente**:
  - OS: Windows/Mac/Linux
  - Node.js version: `node -v`
  - Browser: Chrome/Firefox/Safari
- **Screenshots**: Se aplicável
- **Logs de erro**: Console logs, stack traces

**Exemplo:**

```markdown
# Bug: Sessão não inicia com headset TGAM conectado

## Descrição
Ao clicar em "Iniciar Sessão" com headset TGAM conectado via Bluetooth,
a sessão não inicia e aparece erro "Device not ready".

## Passos para Reproduzir
1. Conectar headset TGAM via Web Bluetooth
2. Entrar em sessão ativa
3. Clicar em "Iniciar Sessão"
4. Erro aparece no console

## Ambiente
- OS: Windows 11
- Browser: Chrome 120
- Node.js: v18.17.0

## Logs
```
Error: Device not ready
  at BluetoothService.connect (bluetooth.js:42)
```
```

---

## 💡 Sugerir Features

### Antes de Sugerir

1. **Verifique se já existe** issue ou PR relacionado
2. **Considere o escopo** - feature alinha com objetivos do projeto?
3. **Pense na implementação** - é tecnicamente viável?

### Como Sugerir

Use o template de feature request:

- **Título claro**: "Feature: ..."
- **Problema**: Qual problema resolve?
- **Solução proposta**: Como deve funcionar?
- **Alternativas consideradas**: Outras opções?
- **Contexto adicional**: Screenshots, mockups, etc

**Exemplo:**

```markdown
# Feature: Exportação de relatórios em Excel

## Problema
Atualmente, relatórios só podem ser exportados em PDF. Professores
precisam manipular dados em planilhas para análises customizadas.

## Solução Proposta
Adicionar botão "Exportar XLSX" nas páginas de relatório.

### Funcionalidade
- Export de sessões individuais
- Export de múltiplas sessões
- Colunas: Data, Aluno, Turma, Atenção, Relaxamento, Duração

## Alternativas Consideradas
- Export CSV (mais simples, mas menos formatação)
- API endpoint para dados raw (mais flexível, mas requer código)

## Contexto
Similar ao sistema de PDF atual, mas usando biblioteca xlsx.
```

---

## 🏷️ Labels de Issues

- `bug`: Algo não funciona
- `feature`: Nova funcionalidade
- `documentation`: Melhoria na documentação
- `enhancement`: Melhoria em feature existente
- `good first issue`: Boa para iniciantes
- `help wanted`: Precisa de ajuda da comunidade
- `question`: Pergunta sobre o projeto
- `wontfix`: Não será trabalhado

---

## 🎯 Áreas de Contribuição

### Código

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React, Material-UI, Vite
- **Database**: PostgreSQL, Supabase, RLS policies
- **Testes**: Jest, Supertest, React Testing Library

### Documentação

- Guias de setup
- Tutoriais
- API reference
- Tradução para outros idiomas

### Design

- Mockups UI/UX
- Ícones e assets
- Temas de cores
- Acessibilidade

### Testes

- Testes unitários
- Testes de integração
- Testes end-to-end
- Performance testing

---

## 📞 Dúvidas?

- **Issues**: Pergunte criando uma issue com label `question`
- **Discussions**: Use GitHub Discussions para discussões gerais
- **Email**: contato@neuroone.edu.br

---

## 🙏 Agradecimentos

Obrigado por contribuir com NeuroOne! Cada contribuição, por menor que seja, faz diferença.

**Principais Contribuidores:**
- Ver [CONTRIBUTORS.md](CONTRIBUTORS.md)

---

**Desenvolvido com ❤️ pela comunidade NeuroOne**
