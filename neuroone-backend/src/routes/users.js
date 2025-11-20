import express from 'express';
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import { validateBody } from '../middleware/validate.js';
import { userSchemas } from '../validation/schemas.js';

dotenv.config();

const router = express.Router();

// Initialize Supabase Admin client for both auth AND database operations
const supabaseUrl = process.env.SUPABASE_URL || 'https://fsszpnbuabhhvrdmrtct.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3MTY0NCwiZXhwIjoyMDc4OTQ3NjQ0fQ.imC7bY7nj0ruaiqJMnvTPScBjImelVK-HdMp8M5Dnxk';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Helper to query Supabase REST API directly (avoids client library hanging)
async function supabaseQuery(table, options = {}) {
  // Build URL with proper query parameter handling
  let url = `${supabaseUrl}/rest/v1/${table}`;

  // If select is provided, append it as a query parameter
  if (options.select) {
    const separator = table.includes('?') ? '&' : '?';
    url += `${separator}select=${options.select}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get('/', async (req, res) => {
  try {
    logger.info('[USERS API] GET /api/users - Listing all users');

    const data = await supabaseQuery('users', {
      select: 'id,email,name,user_role,active,created_at,updated_at',
      headers: {
        'Order': 'created_at.desc'
      }
    });

    logger.success(`[USERS API] Found ${data.length} users`);

    res.json({
      success: true,
      data: data,
      count: data.length,
    });
  } catch (error) {
    logger.error('[USERS API] Error listing users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list users',
    });
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[USERS API] GET /api/users/${id} - Getting user`);

    const result = await supabaseQuery(`users?id=eq.${id}`, {
      select: 'id,email,name,user_role,active,created_at,updated_at'
    });

    if (!result || result.length === 0) {
      logger.warn(`[USERS API] User ${id} not found`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.success(`[USERS API] Found user ${id}`);

    res.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    logger.error('[USERS API] Error getting user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user',
    });
  }
});

/**
 * POST /api/users/create
 * Create a new user (handles BOTH auth.users and public.users)
 * This is the complete user creation flow
 */
router.post('/create', validateBody(userSchemas.create), async (req, res) => {
  try {
    const { email, name, user_role, password } = req.body;

    logger.info(`[USERS API] POST /api/users/create - Creating user ${email}`);

    // Step 1: Create auth user using Supabase Admin API
    logger.info(`[USERS API] Creating auth user for ${email}...`);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: user_role,
      }
    });

    if (authError) {
      logger.error('[USERS API] Auth creation failed:', authError);
      return res.status(500).json({
        success: false,
        error: `Failed to create auth user: ${authError.message}`,
      });
    }

    logger.success(`[USERS API] Auth user created: ${authData.user.id}`);

    // Step 2: Create database record using Supabase REST API
    logger.info(`[USERS API] Creating database record for ${email}...`);

    const data = await supabaseQuery('users', {
      method: 'POST',
      select: 'id,email,name,user_role,active,created_at,updated_at',
      body: {
        id: authData.user.id,
        email,
        name,
        user_role,
        active: true
      }
    });

    logger.success(`[USERS API] User ${email} created successfully!`);

    res.status(201).json({
      success: true,
      data: Array.isArray(data) ? data[0] : data,
    });
  } catch (error) {
    logger.error('[USERS API] Error creating user:', error);

    // Handle duplicate key error
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
    });
  }
});

/**
 * PUT /api/users/:id
 * Update an existing user
 */
router.put('/:id', validateBody(userSchemas.update), async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`[USERS API] PUT /api/users/${id} - Updating user`);

    // Joi already validated and stripped unknown fields
    const updateBody = {
      ...req.body,
      updated_at: new Date().toISOString()};

    // Use Supabase REST API with PATCH and id filter
    const data = await supabaseQuery(`users?id=eq.${id}`, {
      method: 'PATCH',
      select: 'id,email,name,user_role,active,created_at,updated_at',
      body: updateBody
    });

    if (!data || data.length === 0) {
      logger.warn(`[USERS API] User ${id} not found for update`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.success(`[USERS API] Updated user ${id}`);

    res.json({
      success: true,
      data: Array.isArray(data) ? data[0] : data,
    });
  } catch (error) {
    logger.error('[USERS API] Error updating user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user',
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (soft delete - sets active = false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query; // ?hard=true for hard delete

    logger.info(`[USERS API] DELETE /api/users/${id} - ${hard ? 'Hard' : 'Soft'} delete`);

    let data;

    if (hard === 'true') {
      // Hard delete - actually remove from database using Supabase REST API
      data = await supabaseQuery(`users?id=eq.${id}`, {
        method: 'DELETE',
        select: 'id,email,name'
      });
    } else {
      // Soft delete - just set active = false using Supabase REST API
      data = await supabaseQuery(`users?id=eq.${id}`, {
        method: 'PATCH',
        select: 'id,email,name,user_role,active,created_at,updated_at',
        body: {
          active: false,
          updated_at: new Date().toISOString()
        }
      });
    }

    if (!data || data.length === 0) {
      logger.warn(`[USERS API] User ${id} not found for delete`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.success(`[USERS API] Deleted user ${id}`);

    res.json({
      success: true,
      data: Array.isArray(data) ? data[0] : data,
      deleted: hard === 'true' ? 'hard' : 'soft',
    });
  } catch (error) {
    logger.error('[USERS API] Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user',
    });
  }
});

export default router;
