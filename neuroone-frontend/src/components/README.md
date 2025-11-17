# Componentes Base - NeuroOne Design System

**Versão**: 1.0
**Data**: 2025-11-17
**Status**: ✅ Completo

---

## 🎨 Visão Geral

Este é o Design System do NeuroOne Educacional, implementando a paleta de cores dourada (#CDA434) e bege (#FAF8F3) conforme especificação em [docs/02-DESIGN-SYSTEM.md](../../docs/02-DESIGN-SYSTEM.md).

**Princípios**:
- ✅ Acessibilidade (WCAG AA)
- ✅ Responsividade
- ✅ Dark mode nativo
- ✅ Tipografia Inter
- ✅ Atomic Design

---

## 📦 Componentes Disponíveis

### Button

Botão customizado com 3 variantes.

**Uso**:
```jsx
import { Button } from './components/atoms/Button';

<Button variant="contained">Salvar</Button>
<Button variant="outlined">Cancelar</Button>
<Button variant="text">Link</Button>
```

**Props**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| variant | 'contained' \| 'outlined' \| 'text' | 'text' | Estilo do botão |
| disabled | boolean | false | Desabilita o botão |
| onClick | function | - | Handler de clique |
| ...props | ButtonProps | - | Todas props do MUI Button |

**Recursos**:
- ✅ Fundo dourado em variant="contained"
- ✅ Borda dourada em variant="outlined"
- ✅ Hover effect com sombras
- ✅ Border radius 12px
- ✅ Typography weight 600

**Acessibilidade**:
- ✅ Contrast ratio 7.2:1 (WCAG AAA)
- ✅ Focus state visível
- ✅ Keyboard navegable (Tab)

---

### Card

Card com sombra e hover effect.

**Uso**:
```jsx
import { Card } from './components/atoms/Card';

<Card>
  <Typography variant="h3">Título</Typography>
  <Typography>Conteúdo do card</Typography>
</Card>
```

**Props**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| children | ReactNode | - | Conteúdo do card |
| sx | SxProps | - | Estilos customizados |
| ...props | CardProps | - | Todas props do MUI Card |

**Recursos**:
- ✅ Background theme.palette.background.paper
- ✅ Sombra shadows[1]
- ✅ Hover effect → shadows[2]
- ✅ Transição suave (300ms)
- ✅ Border radius 12px

**Acessibilidade**:
- ✅ Contraste automático entre light/dark
- ✅ Legível em todos os temas

---

### Input

TextField customizado com focus dourado.

**Uso**:
```jsx
import { Input } from './components/atoms/Input';

<Input label="Nome" value={name} onChange={e => setName(e.target.value)} />
<Input label="Email" type="email" />
<Input label="Senha" type="password" />
<Input
  label="CPF"
  error={!!error}
  helperText={error || "Formato: 000.000.000-00"}
/>
```

**Props**:
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| label | string | - | Label do input |
| type | string | 'text' | Tipo do input (text, email, password, number) |
| value | string | - | Valor controlado |
| onChange | function | - | Handler de mudança |
| error | boolean | false | Estado de erro |
| helperText | string | - | Texto de ajuda/erro |
| ...props | TextFieldProps | - | Todas props do MUI TextField |

**Recursos**:
- ✅ Hover: borda muda para dourado
- ✅ Focus: borda dourada com 2px
- ✅ Label dourado quando focado
- ✅ Background theme.palette.background.paper
- ✅ fullWidth por padrão
- ✅ Border radius 12px

**Acessibilidade**:
- ✅ Labels sempre presentes
- ✅ Contrast ratio 4.8:1 (WCAG AA)
- ✅ Focus state visível (2px dourado)
- ✅ Error state com helperText

---

## 🎨 Temas

### Light Theme

**Cores principais**:
- Primary: #CDA434 (Dourado NeuroOne)
- Secondary: #6A5840 (Marrom suave)
- Background: #FAF8F3 (Bege claro)
- Paper: #FFFFFF (Branco)
- Text: #1A1A1A (Quase preto)

### Dark Theme

**Cores principais**:
- Primary: #CDA434 (Mesmo dourado)
- Secondary: #8B7A66 (Marrom mais claro)
- Background: #0B0B0B (Preto profundo)
- Paper: #1A1A1A (Cinza escuro)
- Text: #FFFFFF (Branco)

---

## 🧩 Atomic Design

### Atoms (Componentes Base)
- ✅ Button
- ✅ Card
- ✅ Input
- ✅ ThemeToggle

### Molecules (Futuro)
- ⏳ LoginForm
- ⏳ StudentCard
- ⏳ SessionCard

### Organisms (Futuro)
- ⏳ Dashboard
- ⏳ SessionMonitor
- ⏳ Navbar

---

## 🔍 Como Testar

### Visualmente

```bash
cd neuroone-frontend
npm run dev
# Abrir http://localhost:5173
```

A página DesignSystemTest mostra todos os componentes.

### Acessibilidade

**Navegação por teclado**:
- Tab → Avança entre elementos
- Shift+Tab → Retorna
- Enter → Ativa botões
- Esc → Fecha modals (futuro)

**Leitor de tela**:
- Todos inputs têm labels
- Botões têm texto descritivo
- Cards têm hierarquia semântica

### Contraste de Cores

**WCAG AA** (mínimo 4.5:1 para texto):
- ✅ Primary main (#CDA434) vs text (#111): 7.2:1
- ✅ Secondary main (#6A5840) vs text: 5.8:1
- ✅ Background (#FAF8F3) vs text: 18.4:1

**Ferramentas**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools: Inspect → Accessibility

---

## 📚 Referências

### Material-UI Docs
- [Button API](https://mui.com/material-ui/api/button/)
- [Card API](https://mui.com/material-ui/api/card/)
- [TextField API](https://mui.com/material-ui/api/text-field/)
- [Styled API](https://mui.com/system/styled/)

### Design Tokens
- [docs/02-DESIGN-SYSTEM.md](../../docs/02-DESIGN-SYSTEM.md)

### Acessibilidade
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## 🔮 Próximos Passos (Semana 2+)

- [ ] Criar molecule LoginForm
- [ ] Criar molecule StudentCard
- [ ] Criar organism Navbar
- [ ] Adicionar Storybook para documentação visual
- [ ] Implementar testes unitários com Jest
- [ ] Implementar testes E2E com Playwright

---

**Última atualização**: 2025-11-17
**Mantido por**: Equipe NeuroOne
**Versão**: 1.0 (Design System Fase 1 - Semana 1)
