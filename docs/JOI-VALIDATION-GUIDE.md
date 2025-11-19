# 🛡️ Joi Validation Implementation Guide

**Project:** NeuroOne Educacional
**Created:** 19/11/2025
**Purpose:** Guide for implementing Joi validation in API routes

---

## 📋 Overview

Joi validation has been implemented to enhance API security and data integrity. The validation infrastructure is ready - this guide shows how to apply it to routes.

## 📦 Installation

✅ **Already installed:** `joi@17.13.3`

```bash
cd neuroone-backend
npm list joi
# └── joi@17.13.3
```

## 🏗️ Architecture

```
neuroone-backend/src/
├── validation/
│   └── schemas.js          # All validation schemas
├── middleware/
│   └── validate.js         # Validation middleware functions
└── routes/
    ├── users.js           # Apply validation here
    ├── sessions.js        # Apply validation here
    ├── classes.js         # Apply validation here
    └── metrics.js         # Apply validation here
```

## 📚 Available Schemas

### User Schemas (`userSchemas`)

- `userSchemas.create` - Create new user
  - email (email, required)
  - password (min 6 chars, required)
  - name (2-100 chars, required)
  - user_role ('direction' | 'professor' | 'student', required)

- `userSchemas.update` - Update existing user
  - name (2-100 chars, optional)
  - email (email, optional)
  - user_role ('direction' | 'professor' | 'student', optional)
  - active (boolean, optional)
  - At least one field required

### Session Schemas (`sessionSchemas`)

- `sessionSchemas.create` - Create session
  - title (3-100 chars, required)
  - class_id (UUID, required)
  - scheduled_at (ISO date, required)
  - duration_minutes (5-180, default 45)
  - description (max 500 chars, optional)
  - game_type ('memory' | 'attention' | 'relaxation' | 'custom', optional)

- `sessionSchemas.update` - Update session
  - title (3-100 chars, optional)
  - scheduled_at (ISO date, optional)
  - duration_minutes (5-180, optional)
  - description (max 500 chars, optional)
  - status ('scheduled' | 'active' | 'paused' | 'completed' | 'cancelled', optional)
  - notes (max 2000 chars, optional)

- `sessionSchemas.finalize` - Finalize session
  - notes (max 2000 chars, optional)

### Class Schemas (`classSchemas`)

- `classSchemas.create` - Create class
  - name (2-100 chars, required)
  - grade_level (max 50 chars, optional)
  - school_year (2020-2100, optional)
  - professor_id (UUID, required)

- `classSchemas.update` - Update class
  - name (2-100 chars, optional)
  - grade_level (max 50 chars, optional)
  - school_year (2020-2100, optional)
  - professor_id (UUID, optional)

- `classSchemas.addStudent` - Add student to class
  - student_id (UUID, required)

### Metrics Schemas (`metricsSchemas`)

- `metricsSchemas.sessionMetrics` - Session metrics
  - session_id (UUID, required)
  - avg_attention (0-100, required)
  - avg_meditation (0-100, required)
  - total_students (integer >= 0, required)
  - active_students (integer >= 0, required)

- `metricsSchemas.studentMetrics` - Student metrics
  - session_id (UUID, required)
  - student_id (UUID, required)
  - avg_attention (0-100, required)
  - avg_meditation (0-100, required)
  - min_attention (0-100, optional)
  - max_attention (0-100, optional)
  - connection_quality ('excellent' | 'good' | 'fair' | 'poor', optional)

---

## 🔧 How to Apply Validation

### Step 1: Import in Route File

```javascript
// At the top of your route file (e.g., users.js)
import { validateBody } from '../middleware/validate.js';
import { userSchemas } from '../validation/schemas.js';
```

### Step 2: Apply to Route

**BEFORE (without validation):**
```javascript
router.post('/create', async (req, res) => {
  try {
    const { email, name, user_role, password } = req.body;

    // Manual validation
    if (!email || !name || !user_role || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Process request...
  } catch (error) {
    // Error handling...
  }
});
```

**AFTER (with Joi validation):**
```javascript
router.post('/create', validateBody(userSchemas.create), async (req, res) => {
  try {
    // Data is already validated and sanitized
    const { email, name, user_role, password } = req.body;

    // Process request directly - no need for manual validation!
  } catch (error) {
    // Error handling...
  }
});
```

### Step 3: Error Response Format

When validation fails, client receives:

```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    },
    {
      "field": "password",
      "message": "Senha deve ter no mínimo 6 caracteres"
    }
  ]
}
```

---

## 📝 Implementation Examples

### Example 1: User Creation (users.js)

```javascript
import { validateBody } from '../middleware/validate.js';
import { userSchemas } from '../validation/schemas.js';

// Apply validation middleware
router.post('/create', validateBody(userSchemas.create), async (req, res) => {
  try {
    // req.body is now validated and sanitized
    const { email, name, user_role, password } = req.body;

    // Proceed with user creation...
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, user_role }
    });

    // Rest of the logic...
  } catch (error) {
    logger.error('[USERS API] Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Example 2: Session Creation (sessions.js)

```javascript
import { validateBody } from '../middleware/validate.js';
import { sessionSchemas } from '../validation/schemas.js';

router.post('/', validateBody(sessionSchemas.create), async (req, res) => {
  try {
    const { title, class_id, scheduled_at, duration_minutes, description, game_type } = req.body;

    // Create session...
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        title,
        class_id,
        scheduled_at,
        duration_minutes,
        description,
        game_type,
        status: 'scheduled'
      });

    // Rest of the logic...
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Example 3: Update with Partial Data (users.js)

```javascript
router.put('/:id', validateBody(userSchemas.update), async (req, res) => {
  try {
    const { id } = req.params;
    // Only provided fields will be in req.body (thanks to stripUnknown)
    const updates = req.body;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);

    // Rest of the logic...
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Example 4: Query Parameters Validation

```javascript
import { validateQuery } from '../middleware/validate.js';
import Joi from 'joi';

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('asc', 'desc').default('desc')
});

router.get('/sessions', validateQuery(paginationSchema), async (req, res) => {
  const { page, limit, sort } = req.query;
  // Query params are validated and have default values
});
```

---

## ✅ Routes to Update

### Priority 1: Critical Routes (Apply First)

1. **[users.js](../neuroone-backend/src/routes/users.js)**
   - `POST /create` → use `userSchemas.create`
   - `PUT /:id` → use `userSchemas.update`

2. **[sessions.js](../neuroone-backend/src/routes/sessions.js)**
   - `POST /` → use `sessionSchemas.create`
   - `PUT /:id` → use `sessionSchemas.update`
   - `POST /:id/finalize` → use `sessionSchemas.finalize`

3. **[classes.js](../neuroone-backend/src/routes/classes.js)**
   - `POST /` → use `classSchemas.create`
   - `PUT /:id` → use `classSchemas.update`
   - `POST /:id/students` → use `classSchemas.addStudent`

### Priority 2: Metrics Routes

4. **[metrics.js](../neuroone-backend/src/routes/metrics.js)**
   - `POST /session` → use `metricsSchemas.sessionMetrics`
   - `POST /student` → use `metricsSchemas.studentMetrics`

---

## 🧪 Testing Validation

### Test Valid Request

```bash
curl -X POST http://localhost:3001/api/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "user_role": "student"
  }'
```

**Expected:** 200 OK, user created

### Test Invalid Email

```bash
curl -X POST http://localhost:3001/api/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Test123!",
    "name": "Test User",
    "user_role": "student"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

### Test Short Password

```bash
curl -X POST http://localhost:3001/api/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123",
    "name": "Test User",
    "user_role": "student"
  }'
```

**Expected:** 400 Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "password",
      "message": "Senha deve ter no mínimo 6 caracteres"
    }
  ]
}
```

---

## 🔒 Security Benefits

1. **SQL Injection Prevention**: Type coercion and unknown field stripping
2. **XSS Prevention**: String length limits and character validation
3. **Data Integrity**: Ensures all required fields are present and valid
4. **Type Safety**: Automatic type conversion (strings to numbers, etc.)
5. **Consistent Errors**: Standardized error responses for frontend handling

---

## 📊 Current Status

- ✅ Joi installed (v17.13.3)
- ✅ Validation schemas created (4 schema groups)
- ✅ Validation middleware created
- ⏳ **TODO**: Apply to routes (see Priority 1 list above)

---

## 🚀 Next Steps

1. Apply validation to `users.js` (3 routes)
2. Apply validation to `sessions.js` (3 routes)
3. Apply validation to `classes.js` (3 routes)
4. Apply validation to `metrics.js` (2 routes)
5. Test all routes with invalid data
6. Update API documentation with validation rules

---

**Created:** 19/11/2025
**Last Updated:** 19/11/2025
**Author:** NeuroOne Development Team
