-- =====================================================
-- NEUROONE DATABASE - PERFORMANCE INDEXES
-- =====================================================
-- Created: 2025-01-17
-- Description: Add additional indexes for query optimization
-- Author: Claude Code
-- Version: 1.0.0
-- Dependencies: 001_initial_schema.sql
-- =====================================================

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Sessions: Filter by teacher + status
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_status
  ON sessions(teacher_id, status);

-- Sessions: Filter by class + status
CREATE INDEX IF NOT EXISTS idx_sessions_class_status
  ON sessions(class_id, status);

-- Sessions: Time-based queries with status
CREATE INDEX IF NOT EXISTS idx_sessions_status_start_time
  ON sessions(status, start_time DESC);

-- EEG Data: Session + Student + Time (common query pattern)
CREATE INDEX IF NOT EXISTS idx_eeg_data_session_student_time
  ON eeg_data(session_id, student_id, timestamp DESC);

-- Class Students: Student + Class lookup
CREATE INDEX IF NOT EXISTS idx_class_students_student_class
  ON class_students(student_id, class_id);

-- =====================================================
-- PARTIAL INDEXES (Only for active records)
-- =====================================================

-- Active users only
CREATE INDEX IF NOT EXISTS idx_users_active_only
  ON users(user_role) WHERE active = true;

-- Active classes only
CREATE INDEX IF NOT EXISTS idx_classes_active_only
  ON classes(created_by) WHERE active = true;

-- Active sessions only (scheduled or in progress)
CREATE INDEX IF NOT EXISTS idx_sessions_active_only
  ON sessions(start_time DESC)
  WHERE status IN ('scheduled', 'active');

-- =====================================================
-- TEXT SEARCH INDEXES (For name/description searches)
-- =====================================================

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users name search
CREATE INDEX IF NOT EXISTS idx_users_name_trgm
  ON users USING gin (name gin_trgm_ops);

-- Classes name search
CREATE INDEX IF NOT EXISTS idx_classes_name_trgm
  ON classes USING gin (name gin_trgm_ops);

-- Sessions title search
CREATE INDEX IF NOT EXISTS idx_sessions_title_trgm
  ON sessions USING gin (title gin_trgm_ops);

-- =====================================================
-- JSONB INDEXES (For structured data queries)
-- =================================================================================

-- Session metrics attention timeline (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_session_metrics_timeline
  ON session_metrics USING gin (attention_timeline);

-- EEG raw data (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_eeg_data_raw
  ON eeg_data USING gin (raw_data);

-- System settings value (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_system_settings_value
  ON system_settings USING gin (value);

-- =====================================================
-- COVERING INDEXES (Include additional columns)
-- =====================================================

-- Sessions with essential data (avoid table lookups)
CREATE INDEX IF NOT EXISTS idx_sessions_list_covering
  ON sessions(teacher_id, start_time DESC)
  INCLUDE (title, status, class_id);

-- Users lookup with role
CREATE INDEX IF NOT EXISTS idx_users_email_covering
  ON users(email)
  INCLUDE (name, user_role, active);

-- =====================================================
-- STATISTICS UPDATES
-- =====================================================

-- Analyze all tables to update query planner statistics
ANALYZE users;
ANALYZE classes;
ANALYZE class_students;
ANALYZE sessions;
ANALYZE session_participants;
ANALYZE eeg_data;
ANALYZE session_metrics;
ANALYZE student_metrics;
ANALYZE launcher_sessions;
ANALYZE system_settings;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 002_performance_indexes.sql completed successfully!';
  RAISE NOTICE 'Added 18 performance indexes:';
  RAISE NOTICE '  - 6 composite indexes';
  RAISE NOTICE '  - 3 partial indexes';
  RAISE NOTICE '  - 3 text search indexes (GIN)';
  RAISE NOTICE '  - 3 JSONB indexes (GIN)';
  RAISE NOTICE '  - 2 covering indexes';
  RAISE NOTICE '  - 1 pg_trgm extension';
  RAISE NOTICE 'Statistics updated for all tables';
END $$;
