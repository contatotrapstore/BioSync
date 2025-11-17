# 🎨 Design System - NeuroOne

**Versão:** 1.0
**Data:** 2025-11-07
**Baseado em:** `ref em index/index.html` e `ref em index/login.html`

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Paleta de Cores](#paleta-de-cores)
- [Tipografia](#tipografia)
- [Espaçamentos](#espaçamentos)
- [Componentes Base](#componentes-base)
- [Ícones](#ícones)
- [Animações e Transições](#animações-e-transições)
- [Acessibilidade](#acessibilidade)
- [Implementação Material-UI](#implementação-material-ui)

---

## Visão Geral

O Design System do NeuroOne é baseado em **elegância minimalista** com **elementos dourados** que remetem a excelência e conquista. O sistema suporta **dois temas**:

- **Light Mode**: Fundo marfim com texto escuro
- **Dark Mode**: Fundo preto com texto claro

**Princípios de Design:**
- 🎯 **Clareza**: Informação hierarquizada e legível
- 🌗 **Contraste**: Alto contraste para acessibilidade
- ✨ **Elegância**: Gradientes dourados e sombras suaves
- 📱 **Responsividade**: Mobile-first approach
- ♿ **Acessibilidade**: WCAG 2.1 AA compliance

---

## Paleta de Cores

### Light Theme (Padrão)

```css
/* Cores Principais */
--primary-main: #CDA434;          /* Dourado */
--primary-dark: #8B6C42;          /* Marrom */
--primary-light: #E5C567;         /* Dourado claro */
--primary-ghost: rgba(205,164,52,0.08); /* Dourado transparente */

/* Background */
--bg-default: #FAF8F3;            /* Marfim */
--bg-paper: #FFFFFF;              /* Branco */
--bg-muted: #FBF7EE;              /* Bege claro */
--bg-glass: rgba(255,255,255,0.7); /* Vidro */

/* Text */
--text-primary: #1A1A1A;          /* Preto */
--text-secondary: #6A5840;        /* Marrom escuro */
--text-disabled: #A39585;         /* Marrom claro */

/* Borders */
--border-main: rgba(20,20,20,0.06);
--border-hover: rgba(20,20,20,0.12);

/* Shadows */
--shadow-sm: 0 2px 8px rgba(26,26,26,0.04);
--shadow-md: 0 8px 30px rgba(26,26,26,0.06);
--shadow-lg: 0 16px 48px rgba(26,26,26,0.08);

/* Status Colors */
--success-main: #2E7D32;
--success-light: #E6F4EA;
--warning-main: #ED6C02;
--warning-light: #FFF7E6;
--error-main: #D32F2F;
--error-light: #FFEBEE;
--info-main: #0288D1;
--info-light: #E3F2FD;
```

### Dark Theme

```css
/* Cores Principais */
--primary-main: #F6C84C;          /* Dourado metálico */
--primary-dark: #B8872B;          /* Dourado escuro */
--primary-light: #FFD86F;         /* Dourado claro */
--primary-ghost: rgba(246,200,76,0.06);

/* Background */
--bg-default: #0B0B0B;            /* Preto */
--bg-paper: #121212;              /* Cinza escuro */
--bg-muted: rgba(255,255,255,0.03); /* Cinza muito escuro */
--bg-glass: rgba(255,255,255,0.03);

/* Text */
--text-primary: #FFFFFF;          /* Branco */
--text-secondary: #8B7A66;        /* Marrom claro */
--text-disabled: #615547;         /* Marrom escuro */

/* Borders */
--border-main: rgba(255,255,255,0.04);
--border-hover: rgba(255,255,255,0.08);

/* Shadows */
--shadow-sm: 0 2px 8px rgba(0,0,0,0.4);
--shadow-md: 0 12px 40px rgba(0,0,0,0.6);
--shadow-lg: 0 24px 64px rgba(0,0,0,0.8);

/* Status Colors */
--success-main: #4CAF50;
--success-light: rgba(76,175,80,0.12);
--warning-main: #FF9800;
--warning-light: rgba(255,152,0,0.12);
--error-main: #F44336;
--error-light: rgba(244,67,54,0.12);
--info-main: #2196F3;
--info-light: rgba(33,150,243,0.12);
```

### Gradientes

```css
/* Gradientes Primários */
--gradient-primary: linear-gradient(90deg, #CDA434, #8B6C42);
--gradient-primary-vertical: linear-gradient(180deg, #CDA434, #8B6C42);
--gradient-primary-radial: radial-gradient(circle, #CDA434, #8B6C42);

/* Gradientes de Background */
--gradient-bg-light: linear-gradient(180deg, #FAF8F3, #FBF7EE);
--gradient-bg-dark: linear-gradient(180deg, #0B0B0B, #121212);

/* Gradientes de Status */
--gradient-success: linear-gradient(90deg, #6CC07E, #3AA56A);
--gradient-warning: linear-gradient(90deg, #FFB84D, #ED6C02);
--gradient-error: linear-gradient(90deg, #F26161, #D94848);
```

---

## Tipografia

### Fonte Principal

```css
font-family: 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Por quê Inter?**
- ✅ Altamente legível em qualquer tamanho
- ✅ Suporte completo a português (acentos)
- ✅ Excelente para interfaces modernas
- ✅ Gratuita e open-source

### Escala Tipográfica

| Elemento | Tamanho | Peso | Uso |
|----------|---------|------|-----|
| **H1** | 32px (2rem) | 800 (Extra Bold) | Títulos principais de página |
| **H2** | 24px (1.5rem) | 700 (Bold) | Títulos de seção |
| **H3** | 20px (1.25rem) | 700 (Bold) | Subtítulos |
| **H4** | 18px (1.125rem) | 600 (Semi Bold) | Cards e painéis |
| **H5** | 16px (1rem) | 600 (Semi Bold) | Subtítulos menores |
| **H6** | 14px (0.875rem) | 600 (Semi Bold) | Labels de seção |
| **Body 1** | 16px (1rem) | 400 (Regular) | Texto principal |
| **Body 2** | 14px (0.875rem) | 400 (Regular) | Texto secundário |
| **Caption** | 13px (0.8125rem) | 400 (Regular) | Legendas, hints |
| **Button** | 14px (0.875rem) | 700 (Bold) | Botões |

### Line Heights

```css
--line-height-tight: 1.2;   /* Títulos */
--line-height-normal: 1.5;  /* Corpo de texto */
--line-height-relaxed: 1.75; /* Parágrafos longos */
```

---

## Espaçamentos

### Sistema de Espaçamento (8px base)

```css
--spacing-0: 0;
--spacing-1: 4px;    /* 0.5 × 8 */
--spacing-2: 8px;    /* 1 × 8 */
--spacing-3: 12px;   /* 1.5 × 8 */
--spacing-4: 16px;   /* 2 × 8 */
--spacing-5: 20px;   /* 2.5 × 8 */
--spacing-6: 24px;   /* 3 × 8 */
--spacing-8: 32px;   /* 4 × 8 */
--spacing-10: 40px;  /* 5 × 8 */
--spacing-12: 48px;  /* 6 × 8 */
--spacing-16: 64px;  /* 8 × 8 */
```

### Border Radius

```css
--radius-sm: 8px;    /* Pequenos elementos */
--radius-md: 10px;   /* Botões, inputs */
--radius-lg: 14px;   /* Cards */
--radius-xl: 16px;   /* Painéis grandes */
--radius-round: 50%; /* Avatares, badges circulares */
```

---

## Componentes Base

### Button (Botão)

#### Variantes

**Primary (Padrão)**
```css
background: linear-gradient(90deg, var(--primary-main), var(--primary-dark));
color: #111111;
border-radius: var(--radius-md);
padding: 10px 16px;
font-weight: 700;
font-size: 14px;
border: none;
cursor: pointer;
transition: all 200ms ease;

:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(205,164,52,0.3);
}
```

**Secondary**
```css
background: transparent;
color: var(--text-primary);
border: 1px solid var(--border-main);
border-radius: var(--radius-md);
padding: 10px 16px;
font-weight: 600;

:hover {
  background: var(--primary-ghost);
  border-color: var(--primary-main);
  color: var(--primary-dark);
}
```

**Danger**
```css
background: linear-gradient(90deg, #F26161, #D94848);
color: white;
```

**Success**
```css
background: linear-gradient(90deg, #6CC07E, #3AA56A);
color: white;
```

#### Tamanhos

```css
/* Small */
padding: 6px 10px;
font-size: 13px;

/* Medium (default) */
padding: 10px 16px;
font-size: 14px;

/* Large */
padding: 12px 20px;
font-size: 16px;
```

---

### Card

```css
background: var(--bg-paper);
border-radius: var(--radius-lg);
padding: 16px;
box-shadow: var(--shadow-md);
border: 1px solid var(--border-main);
transition: all 200ms ease;

:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

---

### Input (Campo de Texto)

```css
width: 100%;
padding: 10px 14px;
border-radius: var(--radius-md);
border: 1px solid var(--border-main);
background: var(--bg-paper);
color: var(--text-primary);
font-size: 14px;
font-family: inherit;
transition: all 200ms ease;

:focus {
  outline: none;
  border-color: var(--primary-main);
  box-shadow: 0 0 0 3px var(--primary-ghost);
}

:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

::placeholder {
  color: var(--text-disabled);
}
```

---

### Gauge (Medidor Circular)

```css
.gauge-container {
  padding: 12px;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-main);
}

.gauge {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    var(--primary-main) 0deg,
    var(--primary-main) calc(var(--percentage) * 3.6deg),
    var(--bg-paper) calc(var(--percentage) * 3.6deg),
    var(--bg-paper) 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.gauge::before {
  content: '';
  width: 90px;
  height: 90px;
  background: var(--bg-paper);
  border-radius: 50%;
  position: absolute;
}

.gauge-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  z-index: 1;
}
```

---

### Table (Tabela)

```css
table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-main);
  font-size: 14px;
}

th {
  color: var(--text-secondary);
  font-weight: 700;
  background: var(--bg-muted);
}

tr:hover {
  background: var(--bg-muted);
}
```

---

### Badge/Status

```css
.status {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-active {
  background: linear-gradient(90deg, #E6F4EA, #BFF0C9);
  color: #115E2B;
}

.status-inactive {
  background: rgba(120,120,120,0.08);
  color: var(--text-secondary);
}

.status-warning {
  background: linear-gradient(90deg, #FFF7E6, #FFF0C6);
  color: #8B6C42;
}
```

---

### Modal

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 600px;
  max-width: calc(100% - 32px);
  background: var(--bg-paper);
  border-radius: var(--radius-lg);
  padding: 20px;
  border: 1px solid var(--border-main);
  box-shadow: var(--shadow-lg);
  animation: modalSlideIn 200ms ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### Toast (Notificação)

```css
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 18px;
  background: linear-gradient(90deg, var(--primary-main), var(--primary-dark));
  color: #111;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 14px;
  box-shadow: var(--shadow-lg);
  animation: toastSlideIn 300ms ease;
  z-index: 2000;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## Ícones

### Biblioteca Recomendada

**Material Icons** (já incluída no Material-UI)

```jsx
import {
  Dashboard,
  People,
  Assessment,
  Settings,
  PlayArrow,
  Stop,
  Bluetooth,
  SignalCellularAlt
} from '@mui/icons-material';
```

### Emojis como Ícones

Para maior leveza e personalidade, usar emojis:

```
📊 - Dashboard
👥 - Usuários
📈 - Relatórios
⚙️ - Configurações
🧠 - Neurociência
🎯 - Atenção
😌 - Relaxamento
📚 - Sessões
✅ - Sucesso
❌ - Erro
⚠️ - Aviso
```

---

## Animações e Transições

### Transições Padrão

```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
```

### Easing Functions

```css
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-sharp: cubic-bezier(0.4, 0.0, 0.6, 1);
```

### Animações Úteis

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse (para elementos de atenção) */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Spin (para loading) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## Acessibilidade

### Contraste de Cores

Todas as combinações de cores atendem **WCAG 2.1 Level AA**:

- **Texto normal:** Mínimo 4.5:1
- **Texto grande:** Mínimo 3:1
- **Componentes UI:** Mínimo 3:1

### Focus States

Todos elementos interativos devem ter estado de foco visível:

```css
:focus-visible {
  outline: 3px solid var(--primary-main);
  outline-offset: 2px;
}
```

### ARIA Labels

Sempre usar labels descritivos:

```jsx
<button aria-label="Iniciar sessão de monitoramento">
  ▶️ Iniciar Sessão
</button>

<input
  type="text"
  placeholder="Buscar..."
  aria-label="Campo de busca"
/>
```

### Navegação por Teclado

- **Tab**: Navegar entre elementos
- **Enter/Space**: Ativar botões
- **Esc**: Fechar modais
- **Arrow keys**: Navegação em listas

---

## Implementação Material-UI

### Theme Provider

```javascript
// theme/lightTheme.js
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#CDA434',
      dark: '#8B6C42',
      light: '#E5C567',
      contrastText: '#111111',
    },
    background: {
      default: '#FAF8F3',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6A5840',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 800,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 2px 8px rgba(26,26,26,0.04)',
    '0 8px 30px rgba(26,26,26,0.06)',
    '0 16px 48px rgba(26,26,26,0.08)',
    // ... mais shadows
  ],
});
```

```javascript
// theme/darkTheme.js
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F6C84C',
      dark: '#B8872B',
      light: '#FFD86F',
      contrastText: '#111111',
    },
    background: {
      default: '#0B0B0B',
      paper: '#121212',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8B7A66',
    },
  },
  // ... resto igual ao light
});
```

### Context de Tema

```javascript
// contexts/ThemeContext.jsx
import { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { lightTheme } from '../theme/lightTheme';
import { darkTheme } from '../theme/darkTheme';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('neuroone-theme') || 'light';
  });

  const theme = useMemo(
    () => (mode === 'light' ? lightTheme : darkTheme),
    [mode]
  );

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('neuroone-theme', newMode);
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
```

---

## Checklist de Implementação

- [ ] Criar arquivos de tema (lightTheme.js, darkTheme.js)
- [ ] Implementar ThemeContext
- [ ] Criar componente ThemeToggle
- [ ] Criar componentes base (Button, Card, Input)
- [ ] Implementar Gauge component
- [ ] Testar contraste de cores (WCAG)
- [ ] Adicionar focus states
- [ ] Testar navegação por teclado
- [ ] Documentar componentes no Storybook (opcional)
- [ ] Revisar responsividade

---

## Documentos Relacionados

- [03-ARQUITETURA.md](./03-ARQUITETURA.md) - Arquitetura
- [07-FASE-1-FUNDACAO.md](./07-FASE-1-FUNDACAO.md) - Implementação Fase 1

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
