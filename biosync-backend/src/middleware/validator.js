const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validations
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  validate
];

const validateLogin = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body()
    .custom((_, { req }) => {
      if (!req.body.email && !req.body.username) {
        throw new Error('Email or username is required');
      }
      return true;
    }),
  validate
];

const validateUpdateUser = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  validate
];

// Game validations
const validateCreateGame = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Game name is required')
    .isLength({ max: 100 })
    .withMessage('Game name must not exceed 100 characters'),
  body('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim(),
  body('folderPath')
    .trim()
    .notEmpty()
    .withMessage('Folder path is required'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
  body('supportedPlatforms')
    .optional()
    .isArray()
    .withMessage('supportedPlatforms must be an array')
    .custom((value) => {
      const validPlatforms = ['pc', 'mobile', 'web'];
      if (!value || value.length === 0) {
        throw new Error('At least one platform must be selected');
      }
      const invalid = value.filter(p => !validPlatforms.includes(p));
      if (invalid.length > 0) {
        throw new Error(`Invalid platforms: ${invalid.join(', ')}. Valid options: ${validPlatforms.join(', ')}`);
      }
      return true;
    }),
  validate
];

const validateUpdateGame = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Game name must not exceed 100 characters'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim(),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('supportedPlatforms')
    .optional()
    .isArray()
    .withMessage('supportedPlatforms must be an array')
    .custom((value) => {
      const validPlatforms = ['pc', 'mobile', 'web'];
      if (value && value.length === 0) {
        throw new Error('At least one platform must be selected');
      }
      if (value) {
        const invalid = value.filter(p => !validPlatforms.includes(p));
        if (invalid.length > 0) {
          throw new Error(`Invalid platforms: ${invalid.join(', ')}. Valid options: ${validPlatforms.join(', ')}`);
        }
      }
      return true;
    }),
  validate
];

// Subscription Plan validations
const validateCreatePlan = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Plan name is required')
    .isLength({ max: 100 })
    .withMessage('Plan name must not exceed 100 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('durationDays')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day'),
  body('gameIds')
    .optional()
    .isArray()
    .withMessage('gameIds must be an array'),
  validate
];

// UUID validation
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  validate
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateCreateGame,
  validateUpdateGame,
  validateCreatePlan,
  validateUUID
};

