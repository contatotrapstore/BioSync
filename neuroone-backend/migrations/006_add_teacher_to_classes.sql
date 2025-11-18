-- =====================================================
-- ADD TEACHER TO CLASSES TABLE
-- =====================================================
-- Created: 2025-11-18
-- Description: Add teacher_id and subject fields to classes table
-- =====================================================

-- Add teacher_id column (professor responsável pela turma)
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add subject column (matéria/disciplina)
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create index on teacher_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

-- Update existing classes to have a teacher if created_by is a professor
UPDATE classes
SET teacher_id = created_by
WHERE created_by IN (
  SELECT id FROM users WHERE user_role = 'professor'
);

COMMENT ON COLUMN classes.teacher_id IS 'Professor responsável pela turma';
COMMENT ON COLUMN classes.subject IS 'Matéria ou disciplina da turma (ex: Matemática, Português)';
