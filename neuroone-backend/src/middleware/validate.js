/**
 * Joi Validation Middleware
 * Validates request data against Joi schemas before processing
 */

/**
 * Creates a validation middleware for a given Joi schema
 * @param {Object} schema - Joi schema to validate against
 * @param {String} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[property];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errorMessages
      });
    }

    req[property] = value;
    next();
  };
}

export function validateBody(schema) {
  return validate(schema, 'body');
}

export function validateQuery(schema) {
  return validate(schema, 'query');
}

export function validateParams(schema) {
  return validate(schema, 'params');
}
