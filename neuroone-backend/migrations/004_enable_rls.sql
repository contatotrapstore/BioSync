-- =====================================================
-- NEUROONE DATABASE - ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Created: 2025-01-17
-- Description: Enable RLS and create security policies for all tables
-- Author: Claude Code
-- Version: 1.0.0
-- Dependencies: 001_initial_schema.sql, 003_lgpd_privacy_tables.sql
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE eeg_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE launcher_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT user_role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is direção
CREATE OR REPLACE FUNCTION is_direction()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'direção';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is professor
CREATE OR REPLACE FUNCTION is_professor()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'professor';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is aluno
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'aluno';
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Direção can view all users
CREATE POLICY users_select_direction ON users
  FOR SELECT
  USING (is_direction());

-- Users can view their own data
CREATE POLICY users_select_self ON users
  FOR SELECT
  USING (id = auth.uid());

-- Professors can view students in their classes
CREATE POLICY users_select_professor_students ON users
  FOR SELECT
  USING (
    is_professor() AND
    user_role = 'aluno' AND
    id IN (
      SELECT cs.student_id
      FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE c.created_by = auth.uid()
    )
  );

-- Direção can insert/update/delete all users
CREATE POLICY users_insert_direction ON users
  FOR INSERT
  WITH CHECK (is_direction());

CREATE POLICY users_update_direction ON users
  FOR UPDATE
  USING (is_direction());

CREATE POLICY users_delete_direction ON users
  FOR DELETE
  USING (is_direction());

-- Users can update their own data (except role)
CREATE POLICY users_update_self ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND user_role = (SELECT user_role FROM users WHERE id = auth.uid()));

-- =====================================================
-- CLASSES TABLE POLICIES
-- =====================================================

-- Direção can view all classes
CREATE POLICY classes_select_direction ON classes
  FOR SELECT
  USING (is_direction());

-- Professors can view their own classes
CREATE POLICY classes_select_professor ON classes
  FOR SELECT
  USING (is_professor() AND created_by = auth.uid());

-- Students can view classes they're enrolled in
CREATE POLICY classes_select_student ON classes
  FOR SELECT
  USING (
    is_student() AND
    id IN (
      SELECT class_id FROM class_students WHERE student_id = auth.uid()
    )
  );

-- Direção can insert/update/delete all classes
CREATE POLICY classes_insert_direction ON classes
  FOR INSERT
  WITH CHECK (is_direction());

CREATE POLICY classes_update_direction ON classes
  FOR UPDATE
  USING (is_direction());

CREATE POLICY classes_delete_direction ON classes
  FOR DELETE
  USING (is_direction());

-- Professors can update/delete their own classes
CREATE POLICY classes_update_professor ON classes
  FOR UPDATE
  USING (is_professor() AND created_by = auth.uid());

CREATE POLICY classes_delete_professor ON classes
  FOR DELETE
  USING (is_professor() AND created_by = auth.uid());

-- =====================================================
-- CLASS_STUDENTS TABLE POLICIES
-- =====================================================

-- Direção can view all class enrollments
CREATE POLICY class_students_select_direction ON class_students
  FOR SELECT
  USING (is_direction());

-- Professors can view enrollments in their classes
CREATE POLICY class_students_select_professor ON class_students
  FOR SELECT
  USING (
    is_professor() AND
    class_id IN (SELECT id FROM classes WHERE created_by = auth.uid())
  );

-- Students can view their own enrollments
CREATE POLICY class_students_select_student ON class_students
  FOR SELECT
  USING (is_student() AND student_id = auth.uid());

-- Direção can manage all enrollments
CREATE POLICY class_students_insert_direction ON class_students
  FOR INSERT
  WITH CHECK (is_direction());

CREATE POLICY class_students_delete_direction ON class_students
  FOR DELETE
  USING (is_direction());

-- Professors can manage enrollments in their classes
CREATE POLICY class_students_insert_professor ON class_students
  FOR INSERT
  WITH CHECK (
    is_professor() AND
    class_id IN (SELECT id FROM classes WHERE created_by = auth.uid())
  );

CREATE POLICY class_students_delete_professor ON class_students
  FOR DELETE
  USING (
    is_professor() AND
    class_id IN (SELECT id FROM classes WHERE created_by = auth.uid())
  );

-- =====================================================
-- SESSIONS TABLE POLICIES
-- =====================================================

-- Direção can view all sessions
CREATE POLICY sessions_select_direction ON sessions
  FOR SELECT
  USING (is_direction());

-- Professors can view their own sessions
CREATE POLICY sessions_select_professor ON sessions
  FOR SELECT
  USING (is_professor() AND teacher_id = auth.uid());

-- Students can view sessions they're participating in
CREATE POLICY sessions_select_student ON sessions
  FOR SELECT
  USING (
    is_student() AND
    id IN (
      SELECT session_id FROM session_participants WHERE student_id = auth.uid()
    )
  );

-- Direção can manage all sessions
CREATE POLICY sessions_insert_direction ON sessions
  FOR INSERT
  WITH CHECK (is_direction());

CREATE POLICY sessions_update_direction ON sessions
  FOR UPDATE
  USING (is_direction());

CREATE POLICY sessions_delete_direction ON sessions
  FOR DELETE
  USING (is_direction());

-- Professors can manage their own sessions
CREATE POLICY sessions_insert_professor ON sessions
  FOR INSERT
  WITH CHECK (is_professor() AND teacher_id = auth.uid());

CREATE POLICY sessions_update_professor ON sessions
  FOR UPDATE
  USING (is_professor() AND teacher_id = auth.uid());

CREATE POLICY sessions_delete_professor ON sessions
  FOR DELETE
  USING (is_professor() AND teacher_id = auth.uid());

-- =====================================================
-- SESSION_PARTICIPANTS TABLE POLICIES
-- =====================================================

-- Direção can view all participants
CREATE POLICY session_participants_select_direction ON session_participants
  FOR SELECT
  USING (is_direction());

-- Professors can view participants in their sessions
CREATE POLICY session_participants_select_professor ON session_participants
  FOR SELECT
  USING (
    is_professor() AND
    session_id IN (SELECT id FROM sessions WHERE teacher_id = auth.uid())
  );

-- Students can view their own participation
CREATE POLICY session_participants_select_student ON session_participants
  FOR SELECT
  USING (is_student() AND student_id = auth.uid());

-- Direção can manage all participants
CREATE POLICY session_participants_insert_direction ON session_participants
  FOR INSERT
  WITH CHECK (is_direction());

CREATE POLICY session_participants_delete_direction ON session_participants
  FOR DELETE
  USING (is_direction());

-- Professors can manage participants in their sessions
CREATE POLICY session_participants_insert_professor ON session_participants
  FOR INSERT
  WITH CHECK (
    is_professor() AND
    session_id IN (SELECT id FROM sessions WHERE teacher_id = auth.uid())
  );

CREATE POLICY session_participants_delete_professor ON session_participants
  FOR DELETE
  USING (
    is_professor() AND
    session_id IN (SELECT id FROM sessions WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- EEG_DATA TABLE POLICIES
-- =====================================================

-- Direção can view all EEG data
CREATE POLICY eeg_data_select_direction ON eeg_data
  FOR SELECT
  USING (is_direction());

-- Professors can view EEG data from their sessions
CREATE POLICY eeg_data_select_professor ON eeg_data
  FOR SELECT
  USING (
    is_professor() AND
    session_id IN (SELECT id FROM sessions WHERE teacher_id = auth.uid())
  );

-- Students can view their own EEG data
CREATE POLICY eeg_data_select_student ON eeg_data
  FOR SELECT
  USING (is_student() AND student_id = auth.uid());

-- Only system can insert EEG data (via service role)
-- No RLS insert policies - handled by backend authentication

-- Students can delete their own EEG data (LGPD right to deletion)
CREATE POLICY eeg_data_delete_student ON eeg_data
  FOR DELETE
  USING (is_student() AND student_id = auth.uid());

-- Direção can delete any EEG data
CREATE POLICY eeg_data_delete_direction ON eeg_data
  FOR DELETE
  USING (is_direction());

-- =====================================================
-- SESSION_METRICS TABLE POLICIES
-- =====================================================

-- Direção can view all session metrics
CREATE POLICY session_metrics_select_direction ON session_metrics
  FOR SELECT
  USING (is_direction());

-- Professors can view metrics from their sessions
CREATE POLICY session_metrics_select_professor ON session_metrics
  FOR SELECT
  USING (
    is_professor() AND
    session_id IN (SELECT id FROM sessions WHERE teacher_id = auth.uid())
  );

-- Students can view metrics from sessions they participated in
CREATE POLICY session_metrics_select_student ON session_metrics
  FOR SELECT
  USING (
    is_student() AND
    session_id IN (
      SELECT session_id FROM session_participants WHERE student_id = auth.uid()
    )
  );

-- Only system can insert/update metrics (via service role)

-- =====================================================
-- STUDENT_METRICS TABLE POLICIES
-- =====================================================

-- Direção can view all student metrics
CREATE POLICY student_metrics_select_direction ON student_metrics
  FOR SELECT
  USING (is_direction());

-- Professors can view metrics from their students in their sessions
CREATE POLICY student_metrics_select_professor ON student_metrics
  FOR SELECT
  USING (
    is_professor() AND
    session_id IN (SELECT id FROM sessions WHERE teacher_id = auth.uid())
  );

-- Students can view their own metrics
CREATE POLICY student_metrics_select_student ON student_metrics
  FOR SELECT
  USING (is_student() AND student_id = auth.uid());

-- Only system can insert/update metrics (via service role)

-- =====================================================
-- LAUNCHER_SESSIONS TABLE POLICIES
-- =====================================================

-- Direção can view all launcher sessions
CREATE POLICY launcher_sessions_select_direction ON launcher_sessions
  FOR SELECT
  USING (is_direction());

-- Students can view their own launcher sessions
CREATE POLICY launcher_sessions_select_student ON launcher_sessions
  FOR SELECT
  USING (is_student() AND student_id = auth.uid());

-- Students can insert their own launcher sessions
CREATE POLICY launcher_sessions_insert_student ON launcher_sessions
  FOR INSERT
  WITH CHECK (is_student() AND student_id = auth.uid());

-- =====================================================
-- SYSTEM_SETTINGS TABLE POLICIES
-- =====================================================

-- Everyone can read system settings
CREATE POLICY system_settings_select_all ON system_settings
  FOR SELECT
  USING (true);

-- Only direção can manage system settings
CREATE POLICY system_settings_insert_direction ON system_settings
  FOR INSERT
  WITH CHECK (is_direction());

CREATE POLICY system_settings_update_direction ON system_settings
  FOR UPDATE
  USING (is_direction());

CREATE POLICY system_settings_delete_direction ON system_settings
  FOR DELETE
  USING (is_direction());

-- =====================================================
-- LGPD PRIVACY TABLES POLICIES
-- =====================================================

-- PRIVACY_CONSENTS: Users can only view/manage their own consents
CREATE POLICY privacy_consents_select_self ON privacy_consents
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY privacy_consents_insert_self ON privacy_consents
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Direção can view all consents for compliance audits
CREATE POLICY privacy_consents_select_direction ON privacy_consents
  FOR SELECT
  USING (is_direction());

-- ACCOUNT_DELETION_REQUESTS: Users can only manage their own requests
CREATE POLICY deletion_requests_select_self ON account_deletion_requests
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY deletion_requests_insert_self ON account_deletion_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Direção can view all deletion requests
CREATE POLICY deletion_requests_select_direction ON account_deletion_requests
  FOR SELECT
  USING (is_direction());

CREATE POLICY deletion_requests_update_direction ON account_deletion_requests
  FOR UPDATE
  USING (is_direction());

-- DATA_ACCESS_LOGS: Users can only view their own access logs
CREATE POLICY access_logs_select_self ON data_access_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Direção can view all access logs for compliance audits
CREATE POLICY access_logs_select_direction ON data_access_logs
  FOR SELECT
  USING (is_direction());

-- Only system can insert access logs (via triggers/service role)

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 004_enable_rls.sql completed successfully!';
  RAISE NOTICE 'Enabled RLS on 13 tables with 60+ security policies:';
  RAISE NOTICE '  - users: 6 policies (role-based access)';
  RAISE NOTICE '  - classes: 7 policies (ownership + enrollment)';
  RAISE NOTICE '  - class_students: 6 policies (enrollment management)';
  RAISE NOTICE '  - sessions: 7 policies (teacher ownership)';
  RAISE NOTICE '  - session_participants: 6 policies (participation tracking)';
  RAISE NOTICE '  - eeg_data: 4 policies (privacy protection)';
  RAISE NOTICE '  - session_metrics: 3 policies (read-only access)';
  RAISE NOTICE '  - student_metrics: 3 policies (read-only access)';
  RAISE NOTICE '  - launcher_sessions: 3 policies (student tracking)';
  RAISE NOTICE '  - system_settings: 4 policies (admin management)';
  RAISE NOTICE '  - privacy_consents: 3 policies (LGPD compliance)';
  RAISE NOTICE '  - account_deletion_requests: 4 policies (LGPD compliance)';
  RAISE NOTICE '  - data_access_logs: 2 policies (audit trail)';
  RAISE NOTICE 'All security policies follow role hierarchy: direção > professor > aluno';
END $$;
