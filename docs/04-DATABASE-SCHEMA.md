# 🗄️ Database Schema - NeuroOne

**Versão:** 1.0
**Data:** 2025-11-07
**Database:** Supabase PostgreSQL 17
**Projeto:** BioSync (id: uszmhhukjohjarplnlmp)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Diagrama ER](#diagrama-er)
- [Tabelas](#tabelas)
- [Relacionamentos](#relacionamentos)
- [Índices](#índices)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Migrations](#migrations)
- [Seeds](#seeds)

---

## Visão Geral

O banco de dados foi projetado para suportar:
- ✅ 3 tipos de usuários (Direção, Professor, Aluno)
- ✅ Gestão de turmas e alunos
- ✅ Sessões de aula com monitoramento EEG
- ✅ Armazenamento de dados EEG em tempo real
- ✅ Métricas agregadas por sessão e aluno
- ✅ Histórico completo para relatórios

**Total de Tabelas:** 9 principais

---

## Diagrama ER

```
┌──────────────┐
│    users     │
│──────────────│
│ id (PK)      │◄────┐
│ email        │     │
│ name         │     │
│ user_role    │     │
│ created_at   │     │
└──────────────┘     │
      │              │
      │              │
      ▼              │
┌──────────────┐     │
│   classes    │     │
│──────────────│     │
│ id (PK)      │     │
│ name         │     │
│ school_year  │     │
│ created_by───┼─────┘
└──────────────┘
      │
      │
      ▼
┌────────────────────┐
│  class_students    │
│────────────────────│
│ id (PK)            │
│ class_id (FK)      │
│ student_id (FK)────┼─────┐
└────────────────────┘     │
                           │
┌──────────────┐           │
│   sessions   │           │
│──────────────│           │
│ id (PK)      │           │
│ title        │           │
│ teacher_id───┼───────────┤
│ class_id─────┘           │
│ status       │           │
│ start_time   │           │
└──────────────┘           │
      │                    │
      │                    │
      ▼                    │
┌───────────────────────┐  │
│ session_participants  │  │
│───────────────────────│  │
│ id (PK)               │  │
│ session_id (FK)       │  │
│ student_id (FK)───────┼──┘
│ connection_status     │
└───────────────────────┘
      │
      │
      ▼
┌──────────────┐
│   eeg_data   │
│──────────────│
│ id (PK)      │
│ session_id   │
│ student_id   │
│ timestamp    │
│ attention    │
│ relaxation   │
│ delta        │
│ theta        │
│ alpha        │
│ beta         │
│ gamma        │
└──────────────┘
      │
      │
      ▼
┌──────────────────┐
│ session_metrics  │
│──────────────────│
│ id (PK)          │
│ session_id (FK)  │
│ avg_attention    │
│ avg_relaxation   │
│ peak_attention   │
│ correlation_data │
└──────────────────┘

┌──────────────────┐
│ student_metrics  │
│──────────────────│
│ id (PK)          │
│ session_id (FK)  │
│ student_id (FK)  │
│ avg_attention    │
│ wave_distribution│
└──────────────────┘
```

---

## Tabelas

### 1. users (Usuários do Sistema)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  username VARCHAR(100) UNIQUE,
  user_role VARCHAR(20) NOT NULL DEFAULT 'aluno',
    -- Valores: 'direcao', 'professor', 'aluno'
  avatar_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(user_role);
CREATE INDEX idx_users_active ON users(active);

-- Trigger para updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Campos:**
- `id`: UUID único do usuário
- `email`: Email único (login)
- `password_hash`: Senha hash (bcrypt)
- `name`: Nome completo
- `username`: Nome de usuário (opcional)
- `user_role`: Tipo de usuário
  - `direcao`: Administrador/Direção
  - `professor`: Professor
  - `aluno`: Aluno
- `avatar_url`: URL do avatar (opcional)
- `active`: Se o usuário está ativo
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

---

### 2. classes (Turmas)

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  school_year VARCHAR(20),
    -- Ex: "2025", "8º Ano A"
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_classes_created_by ON classes(created_by);
CREATE INDEX idx_classes_active ON classes(active);

-- Trigger
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Campos:**
- `id`: UUID único da turma
- `name`: Nome da turma (ex: "Matemática 8ºA")
- `school_year`: Ano letivo
- `description`: Descrição opcional
- `created_by`: Quem criou (geralmente Direção)
- `active`: Se a turma está ativa
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

---

### 3. class_students (Alunos por Turma)

```sql
CREATE TABLE class_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Índices
CREATE INDEX idx_class_students_class ON class_students(class_id);
CREATE INDEX idx_class_students_student ON class_students(student_id);
```

**Campos:**
- `id`: UUID único
- `class_id`: Referência à turma
- `student_id`: Referência ao aluno (user_role = 'aluno')
- `enrolled_at`: Data de matrícula
- **UNIQUE constraint:** Um aluno não pode estar duplicado na mesma turma

---

### 4. sessions (Sessões de Aula)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  session_type VARCHAR(50) NOT NULL DEFAULT 'monitoramento',
    -- Valores: 'monitoramento', 'treinamento', 'competitivo', 'colaborativo'
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'scheduled',
    -- Valores: 'scheduled', 'active', 'completed', 'cancelled'
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX idx_sessions_class ON sessions(class_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);

-- Trigger
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Campos:**
- `id`: UUID único da sessão
- `title`: Título (ex: "Matemática - Equações Lineares")
- `description`: Descrição detalhada
- `session_type`: Tipo de sessão
  - `monitoramento`: Aula normal com observação
  - `treinamento`: Atividades com jogos/meditação
  - `competitivo`: Competição entre alunos
  - `colaborativo`: Trabalho em grupo
- `teacher_id`: Professor responsável
- `class_id`: Turma participante
- `status`: Estado atual
  - `scheduled`: Agendada
  - `active`: Em andamento
  - `completed`: Concluída
  - `cancelled`: Cancelada
- `start_time`: Hora de início
- `end_time`: Hora de término
- `duration_minutes`: Duração calculada
- `notes`: Observações do professor

---

### 5. session_participants (Participantes da Sessão)

```sql
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_status VARCHAR(20) DEFAULT 'offline',
    -- Valores: 'online', 'offline', 'disconnected'
  device_name VARCHAR(100),
    -- Ex: "NeuroHeadset Pro"
  signal_quality VARCHAR(20),
    -- Valores: 'excellent', 'good', 'fair', 'poor'
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  UNIQUE(session_id, student_id)
);

-- Índices
CREATE INDEX idx_participants_session ON session_participants(session_id);
CREATE INDEX idx_participants_student ON session_participants(student_id);
CREATE INDEX idx_participants_status ON session_participants(connection_status);
```

**Campos:**
- `id`: UUID único
- `session_id`: Referência à sessão
- `student_id`: Referência ao aluno
- `connection_status`: Status de conexão atual
- `device_name`: Nome do dispositivo EEG
- `signal_quality`: Qualidade do sinal
- `joined_at`: Quando entrou
- `left_at`: Quando saiu

---

### 6. eeg_data (Dados EEG)

```sql
CREATE TABLE eeg_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,

  -- Métricas principais
  attention INTEGER CHECK (attention >= 0 AND attention <= 100),
  relaxation INTEGER CHECK (relaxation >= 0 AND relaxation <= 100),

  -- Ondas cerebrais (power spectrum)
  delta DECIMAL(10,4),    -- 0.5-4 Hz
  theta DECIMAL(10,4),    -- 4-8 Hz
  alpha DECIMAL(10,4),    -- 8-13 Hz
  beta DECIMAL(10,4),     -- 13-30 Hz
  gamma DECIMAL(10,4),    -- 30-100 Hz

  -- Qualidade
  signal_quality VARCHAR(20),
    -- Valores: 'excellent', 'good', 'fair', 'poor'

  -- Dados brutos (opcional)
  raw_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices (CRÍTICO PARA PERFORMANCE)
CREATE INDEX idx_eeg_session ON eeg_data(session_id);
CREATE INDEX idx_eeg_student ON eeg_data(student_id);
CREATE INDEX idx_eeg_timestamp ON eeg_data(timestamp);
CREATE INDEX idx_eeg_session_student_time
  ON eeg_data(session_id, student_id, timestamp);

-- Particionamento por data (opcional, para alto volume)
-- CREATE TABLE eeg_data_2025_11 PARTITION OF eeg_data
--   FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

**Campos:**
- `id`: UUID único
- `session_id`: Referência à sessão
- `student_id`: Referência ao aluno
- `timestamp`: Momento exato da leitura
- `attention`: Nível de atenção (0-100)
- `relaxation`: Nível de relaxamento (0-100)
- `delta, theta, alpha, beta, gamma`: Power spectrum de cada banda
- `signal_quality`: Qualidade do sinal EEG
- `raw_data`: Dados brutos opcionais (JSON)
- `created_at`: Quando foi inserido no banco

**⚠️ Atenção:**
- Esta tabela pode crescer MUITO rápido (256Hz = 256 registros/segundo)
- Considerar particionamento por data
- Implementar data retention policy (ex: 6 meses)

---

### 7. session_metrics (Métricas Agregadas por Sessão)

```sql
CREATE TABLE session_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  -- Métricas globais da turma
  total_participants INTEGER,
  avg_attention DECIMAL(5,2),
  avg_relaxation DECIMAL(5,2),
  peak_attention DECIMAL(5,2),
  peak_relaxation DECIMAL(5,2),

  -- Média móvel (últimos 30 pontos)
  moving_avg_attention JSONB,
    -- Array de {timestamp, value}
  moving_avg_relaxation JSONB,

  -- Distribuição de ondas cerebrais (média da turma)
  avg_delta DECIMAL(10,4),
  avg_theta DECIMAL(10,4),
  avg_alpha DECIMAL(10,4),
  avg_beta DECIMAL(10,4),
  avg_gamma DECIMAL(10,4),

  -- Matriz de correlação
  correlation_data JSONB,
    -- { "beta_attention": 0.85, "alpha_relaxation": 0.62, ... }

  -- Insights automatizados
  insights JSONB,
    -- Array de strings com insights

  duration_minutes INTEGER,
  data_points_collected INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_session_metrics_session ON session_metrics(session_id);

-- Trigger
CREATE TRIGGER update_session_metrics_updated_at
  BEFORE UPDATE ON session_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Campos:**
- `id`: UUID único
- `session_id`: Referência à sessão (UNIQUE)
- `total_participants`: Total de alunos conectados
- `avg_attention`: Atenção média da turma
- `avg_relaxation`: Relaxamento médio
- `peak_attention`: Pico de atenção
- `peak_relaxation`: Pico de relaxamento
- `moving_avg_*`: Média móvel (30 pontos) em JSON
- `avg_*`: Médias de ondas cerebrais
- `correlation_data`: Correlações Pearson em JSON
- `insights`: Insights gerados automaticamente
- `duration_minutes`: Duração efetiva
- `data_points_collected`: Total de pontos coletados

---

### 8. student_metrics (Métricas por Aluno)

```sql
CREATE TABLE student_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Métricas individuais
  avg_attention DECIMAL(5,2),
  avg_relaxation DECIMAL(5,2),
  peak_attention DECIMAL(5,2),
  peak_relaxation DECIMAL(5,2),

  -- Tendências
  attention_trend VARCHAR(10),
    -- Valores: 'up', 'down', 'stable'
  relaxation_trend VARCHAR(10),

  -- Distribuição de ondas cerebrais
  wave_distribution JSONB,
    -- { "delta": 0.15, "theta": 0.20, "alpha": 0.65, ... }

  -- Insights pessoais
  strengths JSONB,
    -- Array: ["Manutenção da atenção", ...]
  opportunities JSONB,
    -- Array: ["Transição entre estados", ...]

  data_points_collected INTEGER,
  connection_stability DECIMAL(5,2),
    -- Porcentagem de tempo com sinal bom

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, student_id)
);

-- Índices
CREATE INDEX idx_student_metrics_session ON student_metrics(session_id);
CREATE INDEX idx_student_metrics_student ON student_metrics(student_id);

-- Trigger
CREATE TRIGGER update_student_metrics_updated_at
  BEFORE UPDATE ON student_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Campos:**
- `id`: UUID único
- `session_id`: Referência à sessão
- `student_id`: Referência ao aluno
- `avg_attention`: Atenção média individual
- `avg_relaxation`: Relaxamento médio
- `peak_attention`: Pico de atenção
- `peak_relaxation`: Pico de relaxamento
- `attention_trend`: Tendência de atenção
- `relaxation_trend`: Tendência de relaxamento
- `wave_distribution`: Distribuição de ondas em JSON
- `strengths`: Pontos fortes identificados
- `opportunities`: Áreas de melhoria
- `data_points_collected`: Total de pontos
- `connection_stability`: Estabilidade da conexão (%)

---

### 9. launcher_sessions (Sessões de Launcher - MANTER)

```sql
-- Já existe, manter para compatibilidade
CREATE TABLE launcher_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_launcher_sessions_user ON launcher_sessions(user_id);
CREATE INDEX idx_launcher_sessions_token ON launcher_sessions(session_token);
```

---

## Relacionamentos

```
users (1) ──────────────── (N) classes [created_by]
users (1) ──────────────── (N) class_students [student_id]
classes (1) ────────────── (N) class_students [class_id]

users (1) ──────────────── (N) sessions [teacher_id]
classes (1) ────────────── (N) sessions [class_id]

sessions (1) ───────────── (N) session_participants [session_id]
users (1) ──────────────── (N) session_participants [student_id]

sessions (1) ───────────── (N) eeg_data [session_id]
users (1) ──────────────── (N) eeg_data [student_id]

sessions (1) ───────────── (1) session_metrics [session_id]

sessions (1) ───────────── (N) student_metrics [session_id]
users (1) ──────────────── (N) student_metrics [student_id]
```

---

## Índices

### Índices Críticos para Performance

```sql
-- eeg_data (tabela mais pesada)
CREATE INDEX idx_eeg_session_student_time
  ON eeg_data(session_id, student_id, timestamp);

-- Busca rápida de sessões por professor e status
CREATE INDEX idx_sessions_teacher_status
  ON sessions(teacher_id, status);

-- Busca rápida de alunos por turma
CREATE INDEX idx_class_students_class_student
  ON class_students(class_id, student_id);

-- Busca de participantes online
CREATE INDEX idx_participants_session_status
  ON session_participants(session_id, connection_status);
```

---

## Row Level Security (RLS)

### Habilitar RLS em todas as tabelas

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE eeg_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_metrics ENABLE ROW LEVEL SECURITY;
```

### Policies

#### users

```sql
-- Direção pode ver todos
CREATE POLICY "direcao_view_all_users" ON users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.user_role = 'direcao'
  ));

-- Professor pode ver alunos de suas turmas
CREATE POLICY "professor_view_students" ON users
  FOR SELECT
  USING (
    user_role = 'aluno'
    AND id IN (
      SELECT cs.student_id
      FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE c.created_by = auth.uid()
    )
  );

-- Aluno pode ver apenas a si mesmo
CREATE POLICY "aluno_view_self" ON users
  FOR SELECT
  USING (id = auth.uid() AND user_role = 'aluno');
```

#### sessions

```sql
-- Direção pode ver todas as sessões
CREATE POLICY "direcao_view_all_sessions" ON sessions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND user_role = 'direcao'
  ));

-- Professor pode ver suas sessões
CREATE POLICY "professor_view_own_sessions" ON sessions
  FOR SELECT
  USING (teacher_id = auth.uid());

-- Aluno pode ver sessões em que participa
CREATE POLICY "aluno_view_participating_sessions" ON sessions
  FOR SELECT
  USING (id IN (
    SELECT session_id
    FROM session_participants
    WHERE student_id = auth.uid()
  ));
```

#### eeg_data

```sql
-- Direção pode ver todos os dados
CREATE POLICY "direcao_view_all_eeg" ON eeg_data
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND user_role = 'direcao'
  ));

-- Professor pode ver dados de suas sessões
CREATE POLICY "professor_view_session_eeg" ON eeg_data
  FOR SELECT
  USING (session_id IN (
    SELECT id FROM sessions
    WHERE teacher_id = auth.uid()
  ));

-- Aluno pode ver apenas seus dados
CREATE POLICY "aluno_view_own_eeg" ON eeg_data
  FOR SELECT
  USING (student_id = auth.uid());

-- Aluno pode inserir seus dados
CREATE POLICY "aluno_insert_own_eeg" ON eeg_data
  FOR INSERT
  WITH CHECK (student_id = auth.uid());
```

---

## Migrations

### Migration 001: Base Structure

```sql
-- 001_create_base_tables.sql

-- 1. Atualizar tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) NOT NULL DEFAULT 'aluno';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- 2. Criar classes
CREATE TABLE IF NOT EXISTS classes (
  -- ... (ver definição completa acima)
);

-- 3. Criar class_students
CREATE TABLE IF NOT EXISTS class_students (
  -- ... (ver definição completa acima)
);

-- 4-8. Criar demais tabelas...
```

### Migration 002: Add Indexes

```sql
-- 002_add_performance_indexes.sql

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_eeg_session_student_time
  ON eeg_data(session_id, student_id, timestamp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_teacher_status
  ON sessions(teacher_id, status);

-- ... outros índices
```

### Migration 003: Enable RLS

```sql
-- 003_enable_rls.sql

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- ... outras tabelas

-- Criar policies...
```

---

## Seeds

### Seed 001: Admin User

```sql
-- seed_001_admin.sql

INSERT INTO users (id, email, password_hash, name, user_role)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'admin@neuroone.com',
  '$2a$10$...',  -- bcrypt hash de "Admin123"
  'Administrador',
  'direcao'
);
```

### Seed 002: Test Data

```sql
-- seed_002_test_data.sql

-- Criar professores
INSERT INTO users (email, password_hash, name, user_role)
VALUES
  ('prof1@escola.com', '$2a$10$...', 'Maria Silva', 'professor'),
  ('prof2@escola.com', '$2a$10$...', 'João Santos', 'professor');

-- Criar alunos
INSERT INTO users (email, password_hash, name, user_role)
VALUES
  ('aluno1@escola.com', '$2a$10$...', 'Pedro Costa', 'aluno'),
  ('aluno2@escola.com', '$2a$10$...', 'Ana Lima', 'aluno');

-- Criar turma
INSERT INTO classes (name, school_year, created_by)
VALUES ('Matemática 8ºA', '2025', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
```

---

## Documentos Relacionados

- [03-ARQUITETURA.md](./03-ARQUITETURA.md) - Arquitetura do sistema
- [07-FASE-1-FUNDACAO.md](./07-FASE-1-FUNDACAO.md) - Implementação Fase 1
- [16-METRICAS-CALCULOS.md](./16-METRICAS-CALCULOS.md) - Cálculos de métricas

---

**Última atualização:** 2025-11-07
**Versão:** 1.0
