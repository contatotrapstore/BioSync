-- =====================================================
-- NEUROONE DATABASE SCHEMA - INITIAL MIGRATION
-- =====================================================
-- Created: 2025-01-17
-- Description: Create all core tables for NeuroOne system
-- Author: Claude Code
-- Version: 1.0.0
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('direção', 'professor', 'aluno')),
  password_hash TEXT, -- NULL for Supabase Auth users
  phone TEXT,
  birth_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- =====================================================
-- CLASSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  school_year TEXT,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_created_by ON classes(created_by);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(active);

-- =====================================================
-- CLASS_STUDENTS TABLE (Junction)
-- =====================================================
CREATE TABLE IF NOT EXISTS class_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

-- =====================================================
-- SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT DEFAULT 'monitoramento' CHECK (session_type IN ('monitoramento', 'neurogame', 'avaliacao')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  attention_threshold_low INTEGER DEFAULT 40,
  attention_threshold_high INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);

-- =====================================================
-- SESSION_PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_student ON session_participants(student_id);

-- =====================================================
-- EEG_DATA TABLE (Time-series data)
-- =====================================================
CREATE TABLE IF NOT EXISTS eeg_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- NeuroSky metrics (0-100)
  attention INTEGER CHECK (attention >= 0 AND attention <= 100),
  relaxation INTEGER CHECK (relaxation >= 0 AND relaxation <= 100),

  -- Signal quality (0 = good, 200 = poor)
  signal_quality INTEGER CHECK (signal_quality >= 0 AND signal_quality <= 200),

  -- EEG frequency bands (raw values)
  delta BIGINT,
  theta BIGINT,
  low_alpha BIGINT,
  high_alpha BIGINT,
  low_beta BIGINT,
  high_beta BIGINT,
  low_gamma BIGINT,
  mid_gamma BIGINT,

  -- Additional metadata
  device_id TEXT,
  raw_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for EEG data queries
CREATE INDEX IF NOT EXISTS idx_eeg_data_session ON eeg_data(session_id);
CREATE INDEX IF NOT EXISTS idx_eeg_data_student ON eeg_data(student_id);
CREATE INDEX IF NOT EXISTS idx_eeg_data_timestamp ON eeg_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eeg_data_session_student ON eeg_data(session_id, student_id);
CREATE INDEX IF NOT EXISTS idx_eeg_data_session_timestamp ON eeg_data(session_id, timestamp);

-- =====================================================
-- SESSION_METRICS TABLE (Aggregated metrics per session)
-- =====================================================
CREATE TABLE IF NOT EXISTS session_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  -- Overall session stats
  total_participants INTEGER DEFAULT 0,
  avg_attention DECIMAL(5,2),
  avg_relaxation DECIMAL(5,2),
  avg_signal_quality DECIMAL(5,2),

  -- Distribution counts
  low_attention_count INTEGER DEFAULT 0,
  medium_attention_count INTEGER DEFAULT 0,
  high_attention_count INTEGER DEFAULT 0,

  -- Time-series data for charts (JSONB array)
  attention_timeline JSONB, -- [{timestamp, avg, min, max}]

  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_metrics_session ON session_metrics(session_id);

-- =====================================================
-- STUDENT_METRICS TABLE (Per-student aggregated metrics)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Student-specific stats
  avg_attention DECIMAL(5,2),
  avg_relaxation DECIMAL(5,2),
  max_attention INTEGER,
  min_attention INTEGER,
  duration_minutes INTEGER,

  -- Engagement score (calculated)
  engagement_score DECIMAL(5,2),

  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_metrics_session ON student_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_student_metrics_student ON student_metrics(student_id);

-- =====================================================
-- LAUNCHER_SESSIONS TABLE (Desktop launcher tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS launcher_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

  machine_id TEXT, -- Unique machine identifier
  os_info TEXT,
  launcher_version TEXT,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launcher_sessions_student ON launcher_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_launcher_sessions_session ON launcher_sessions(session_id);

-- =====================================================
-- SYSTEM_SETTINGS TABLE (Global configurations)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- =====================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_metrics_updated_at BEFORE UPDATE ON session_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_metrics_updated_at BEFORE UPDATE ON student_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL SYSTEM SETTINGS
-- =====================================================
INSERT INTO system_settings (key, value, description) VALUES
('attention_thresholds', '{"low": 40, "high": 70}'::JSONB, 'Default attention thresholds for sessions'),
('session_defaults', '{"duration_minutes": 45, "auto_save_interval": 30}'::JSONB, 'Default session configurations'),
('eeg_sampling_rate', '{"hz": 512}'::JSONB, 'EEG device sampling rate'),
('data_retention_days', '{"eeg_raw": 90, "sessions": 365, "metrics": 730}'::JSONB, 'Data retention policy in days')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_initial_schema.sql completed successfully!';
  RAISE NOTICE 'Created tables: users, classes, class_students, sessions, session_participants, eeg_data, session_metrics, student_metrics, launcher_sessions, system_settings';
  RAISE NOTICE 'Total tables: 10';
END $$;
