/**
 * Joi Validation Schemas for NeuroOne Backend
 * Defines data validation rules for all API endpoints
 */

import Joi from 'joi';

// ============================================================================
// USER VALIDATION SCHEMAS
// ============================================================================

export const userSchemas = {
  // Create new user
  create: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email inválido',
        'any.required': 'Email é obrigatório'
      }),

    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Senha deve ter no mínimo 6 caracteres',
        'any.required': 'Senha é obrigatória'
      }),

    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Nome deve ter no mínimo 2 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
        'any.required': 'Nome é obrigatório'
      }),

    user_role: Joi.string()
      .valid('direction', 'professor', 'student')
      .required()
      .messages({
        'any.only': 'Tipo de usuário inválido. Deve ser: direction, professor ou student',
        'any.required': 'Tipo de usuário é obrigatório'
      })
  }),

  // Update user
  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),

    email: Joi.string()
      .email()
      .optional(),

    user_role: Joi.string()
      .valid('direction', 'professor', 'student')
      .optional(),

    active: Joi.boolean()
      .optional()
  }).min(1) // At least one field must be present
};

// ============================================================================
// SESSION VALIDATION SCHEMAS
// ============================================================================

export const sessionSchemas = {
  // Create session
  create: Joi.object({
    title: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Título deve ter no mínimo 3 caracteres',
        'string.max': 'Título deve ter no máximo 100 caracteres',
        'any.required': 'Título é obrigatório'
      }),

    class_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'ID da turma inválido',
        'any.required': 'ID da turma é obrigatório'
      }),

    scheduled_at: Joi.date()
      .iso()
      .required()
      .messages({
        'date.base': 'Data inválida',
        'date.format': 'Data deve estar no formato ISO 8601',
        'any.required': 'Data agendada é obrigatória'
      }),

    duration_minutes: Joi.number()
      .integer()
      .min(5)
      .max(180)
      .default(45)
      .messages({
        'number.min': 'Duração mínima é 5 minutos',
        'number.max': 'Duração máxima é 180 minutos'
      }),

    description: Joi.string()
      .max(500)
      .optional()
      .allow('', null),

    game_type: Joi.string()
      .valid('memory', 'attention', 'relaxation', 'custom')
      .optional()
      .allow(null)
  }),

  // Update session
  update: Joi.object({
    title: Joi.string()
      .min(3)
      .max(100)
      .optional(),

    scheduled_at: Joi.date()
      .iso()
      .optional(),

    duration_minutes: Joi.number()
      .integer()
      .min(5)
      .max(180)
      .optional(),

    description: Joi.string()
      .max(500)
      .optional()
      .allow('', null),

    status: Joi.string()
      .valid('scheduled', 'active', 'paused', 'completed', 'cancelled')
      .optional(),

    notes: Joi.string()
      .max(2000)
      .optional()
      .allow('', null)
  }).min(1),

  // Finalize session
  finalize: Joi.object({
    notes: Joi.string()
      .max(2000)
      .optional()
      .allow('', null)
  })
};

// ============================================================================
// CLASS VALIDATION SCHEMAS
// ============================================================================

export const classSchemas = {
  // Create class
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Nome da turma deve ter no mínimo 2 caracteres',
        'string.max': 'Nome da turma deve ter no máximo 100 caracteres',
        'any.required': 'Nome da turma é obrigatório'
      }),

    grade_level: Joi.string()
      .max(50)
      .optional()
      .allow('', null),

    school_year: Joi.number()
      .integer()
      .min(2020)
      .max(2100)
      .optional()
      .allow(null),

    professor_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'ID do professor inválido',
        'any.required': 'ID do professor é obrigatório'
      })
  }),

  // Update class
  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),

    grade_level: Joi.string()
      .max(50)
      .optional()
      .allow('', null),

    school_year: Joi.number()
      .integer()
      .min(2020)
      .max(2100)
      .optional()
      .allow(null),

    professor_id: Joi.string()
      .uuid()
      .optional()
  }).min(1),

  // Add student to class
  addStudent: Joi.object({
    student_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'ID do aluno inválido',
        'any.required': 'ID do aluno é obrigatório'
      })
  })
};

// ============================================================================
// METRICS VALIDATION SCHEMAS
// ============================================================================

export const metricsSchemas = {
  // Record session metrics
  sessionMetrics: Joi.object({
    session_id: Joi.string()
      .uuid()
      .required(),

    avg_attention: Joi.number()
      .min(0)
      .max(100)
      .required(),

    avg_meditation: Joi.number()
      .min(0)
      .max(100)
      .required(),

    total_students: Joi.number()
      .integer()
      .min(0)
      .required(),

    active_students: Joi.number()
      .integer()
      .min(0)
      .required()
  }),

  // Record student metrics
  studentMetrics: Joi.object({
    session_id: Joi.string()
      .uuid()
      .required(),

    student_id: Joi.string()
      .uuid()
      .required(),

    avg_attention: Joi.number()
      .min(0)
      .max(100)
      .required(),

    avg_meditation: Joi.number()
      .min(0)
      .max(100)
      .required(),

    min_attention: Joi.number()
      .min(0)
      .max(100)
      .optional(),

    max_attention: Joi.number()
      .min(0)
      .max(100)
      .optional(),

    connection_quality: Joi.string()
      .valid('excellent', 'good', 'fair', 'poor')
      .optional()
  })
};
