# 🔨 Fase 1: Fundação - NeuroOne ✅ CONCLUÍDA

**Duração:** 3 semanas (11/11/2025 - 01/12/2025)
**Objetivo:** Criar base sólida (Design System + Database + Roles)
**Status:** ✅ Implementação 100% completa

---

## 📋 Checklist

- [ ] **Semana 1:** Design System (5 dias)
- [ ] **Semana 2:** Banco de Dados (5 dias)
- [ ] **Semana 3:** Sistema de Roles (5 dias)

---

## Semana 1: Design System

### Dia 1 (Segunda): Setup do Projeto

**Tarefas:**
```bash
# 1. Criar branch de desenvolvimento
cd biosync-admin
git checkout -b feature/design-system

# 2. Criar estrutura de pastas
mkdir -p src/theme
mkdir -p src/contexts
```

**Arquivos a criar:**
- [ ] `src/theme/lightTheme.js`
- [ ] `src/theme/darkTheme.js`
- [ ] `src/contexts/ThemeContext.jsx`

---

### Dia 2 (Terça): Implementar Temas

**1. Light Theme (`src/theme/lightTheme.js`):**

```javascript
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
    secondary: {
      main: '#6A5840',
      light: '#8B7A66',
      dark: '#4A3F2F',
    },
    background: {
      default: '#FAF8F3',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6A5840',
      disabled: '#A39585',
    },
    error: {
      main: '#D32F2F',
      light: '#FFEBEE',
    },
    success: {
      main: '#2E7D32',
      light: '#E6F4EA',
    },
    warning: {
      main: '#ED6C02',
      light: '#FFF7E6',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 800,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 700,
      textTransform: 'none',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 2px 8px rgba(26,26,26,0.04)',
    '0 4px 16px rgba(26,26,26,0.05)',
    '0 8px 30px rgba(26,26,26,0.06)',
    '0 12px 40px rgba(26,26,26,0.07)',
    '0 16px 48px rgba(26,26,26,0.08)',
    // ... adicionar 19 mais (Material-UI requer 25 shadows)
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 16px',
        },
        contained: {
          background: 'linear-gradient(90deg, #CDA434, #8B6C42)',
          color: '#111',
          '&:hover': {
            background: 'linear-gradient(90deg, #B8922D, #7A5E3A)',
            boxShadow: '0 6px 20px rgba(205,164,52,0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 8px 30px rgba(26,26,26,0.06)',
        },
      },
    },
  },
});
```

**2. Dark Theme (`src/theme/darkTheme.js`):**

```javascript
import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F6C84C',
      dark: '#B8872B',
      light: '#FFD86F',
      contrastText: '#111111',
    },
    secondary: {
      main: '#8B7A66',
      light: '#A39585',
      dark: '#615547',
    },
    background: {
      default: '#0B0B0B',
      paper: '#121212',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8B7A66',
      disabled: '#615547',
    },
    // ... resto igual ao light, ajustando valores
  },
  // ... typography, shape, etc igual
});
```

---

### Dia 3 (Quarta): ThemeContext

**`src/contexts/ThemeContext.jsx`:**

```javascript
import { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme } from '../theme/lightTheme';
import { darkTheme } from '../theme/darkTheme';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    // Ler do localStorage
    const saved = localStorage.getItem('neuroone-theme');
    return saved || 'light';
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
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
```

**Atualizar `src/App.jsx`:**

```javascript
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* resto do app */}
    </ThemeProvider>
  );
}
```

---

### Dia 4 (Quinta): Componente ThemeToggle

**`src/components/common/ThemeToggle.jsx`:**

```javascript
import { useContext } from 'react';
import { IconButton, Box, Typography } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { ThemeContext } from '../../contexts/ThemeContext';

function ThemeToggle() {
  const { mode, toggleTheme } = useContext(ThemeContext);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '6px 12px',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="caption" fontWeight={700}>
        {mode === 'light' ? 'Light' : 'Dark'}
      </Typography>
      <IconButton onClick={toggleTheme} size="small">
        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Box>
  );
}

export default ThemeToggle;
```

**Adicionar no Header:**

```javascript
// src/components/Header.jsx
import ThemeToggle from './common/ThemeToggle';

function Header() {
  return (
    <Box>
      {/* ... outros elementos */}
      <ThemeToggle />
    </Box>
  );
}
```

---

### Dia 5 (Sexta): Testar e Ajustar

**Testes:**
- [ ] Alternar entre light e dark
- [ ] Verificar persistência no localStorage
- [ ] Testar em todas as páginas existentes
- [ ] Verificar contraste (WCAG AA)
- [ ] Ajustar cores se necessário

---

## Semana 2: Banco de Dados

### Dia 1 (Segunda): Atualizar Tabela Users

**Acessar Supabase SQL Editor:**

```sql
-- 1. Adicionar coluna user_role
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) NOT NULL DEFAULT 'aluno';

-- 2. Adicionar avatar_url
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Adicionar active
ALTER TABLE users
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 4. Adicionar updated_at
ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- 6. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### Dia 2 (Terça): Criar Tabelas de Turmas

```sql
-- 1. Criar classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  school_year VARCHAR(20),
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_created_by ON classes(created_by);
CREATE INDEX idx_classes_active ON classes(active);

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Criar class_students
CREATE TABLE IF NOT EXISTS class_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_class_students_class ON class_students(class_id);
CREATE INDEX idx_class_students_student ON class_students(student_id);
```

---

### Dia 3 (Quarta): Criar Tabelas de Sessões

```sql
-- Ver 04-DATABASE-SCHEMA.md para SQL completo

CREATE TABLE sessions (
  -- ... (copiar do documento 04)
);

CREATE TABLE session_participants (
  -- ... (copiar do documento 04)
);
```

---

### Dia 4 (Quinta): Criar Tabelas de EEG

```sql
CREATE TABLE eeg_data (
  -- ... (copiar do documento 04)
);

CREATE TABLE session_metrics (
  -- ... (copiar do documento 04)
);

CREATE TABLE student_metrics (
  -- ... (copiar do documento 04)
);
```

---

### Dia 5 (Sexta): RLS e Seeds

**RLS:**
```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- ... (demais tabelas)

-- Criar policies
-- Ver 04-DATABASE-SCHEMA.md para policies completas
```

**Seeds:**
```sql
-- Criar usuário admin
INSERT INTO users (email, password_hash, name, user_role)
VALUES ('admin@neuroone.com', '$2a$10$...', 'Admin', 'direcao');
```

---

## Semana 3: Sistema de Roles

### Dia 1 (Segunda): Middleware de Roles

**`backend/src/middleware/roleAuth.js`:**

```javascript
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.user_role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      });
    }

    next();
  };
};

module.exports = { checkRole };
```

---

### Dia 2 (Terça): Atualizar AuthContext

**`frontend/src/contexts/AuthContext.jsx`:**

```javascript
// Adicionar user_role ao contexto
const [user, setUser] = useState({
  id: null,
  email: null,
  name: null,
  role: null // NOVO
});

// Ao fazer login, salvar role
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { accessToken, user: userData } = response.data;

  setUser({
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.user_role // NOVO
  });

  localStorage.setItem('accessToken', accessToken);
};
```

---

### Dia 3 (Quarta): Proteger Rotas

**`frontend/src/components/ProtectedRoute.jsx`:**

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" />;
  }

  return children;
}

export default ProtectedRoute;
```

**Uso:**

```javascript
// App.jsx
<Route
  path="/direction/*"
  element={
    <ProtectedRoute allowedRoles={['direcao']}>
      <DirectionDashboard />
    </ProtectedRoute>
  }
/>
```

---

### Dia 4 (Quinta): Testes

- [ ] Testar login como Direção
- [ ] Testar login como Professor
- [ ] Testar login como Aluno
- [ ] Verificar redirecionamentos
- [ ] Verificar 403 Forbidden

---

### Dia 5 (Sexta): Revisão e Ajustes

- [ ] Code review
- [ ] Ajustes finais
- [ ] Documentar mudanças
- [ ] Merge para develop

---

## Entregáveis da Fase 1

✅ **Design System completo** (light + dark)
✅ **Banco de dados** (9 tabelas + RLS)
✅ **Sistema de roles** (Direção, Professor, Aluno)
✅ **Código testado** e revisado

---

## Próximos Passos

Após conclusão da Fase 1, iniciar [08-FASE-2-DIRECAO.md](./08-FASE-2-DIRECAO.md)

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
