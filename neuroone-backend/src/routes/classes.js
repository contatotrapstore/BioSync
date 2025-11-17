import express from 'express';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || 'https://fsszpnbuabhhvrdmrtct.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3MTY0NCwiZXhwIjoyMDc4OTQ3NjQ0fQ.imC7bY7nj0ruaiqJMnvTPScBjImelVK-HdMp8M5Dnxk';

// Helper to query Supabase REST API directly (avoids client library hanging)
async function supabaseQuery(table, options = {}) {
  let url = `${supabaseUrl}/rest/v1/${table}`;

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
 * GET /api/classes
 * List all classes with student counts
 */
router.get('/', async (req, res) => {
  try {
    logger.info('[CLASSES API] GET /api/classes - Listing all classes');

    // Fetch all classes
    const classes = await supabaseQuery('classes', {
      select: 'id,name,school_year,description,created_by,active,created_at,updated_at',
      headers: {
        'Order': 'created_at.desc'
      }
    });

    // For each class, fetch student count
    const classesWithCounts = await Promise.all(
      classes.map(async (classItem) => {
        try {
          const students = await supabaseQuery(`class_students?class_id=eq.${classItem.id}`, {
            select: 'student_id',
            headers: {
              'Prefer': 'count=exact'
            }
          });

          return {
            ...classItem,
            student_count: students.length
          };
        } catch (err) {
          logger.error(`[CLASSES API] Error counting students for class ${classItem.id}:`, err);
          return {
            ...classItem,
            student_count: 0
          };
        }
      })
    );

    logger.success(`[CLASSES API] Found ${classesWithCounts.length} classes`);

    res.json({
      success: true,
      data: classesWithCounts,
      count: classesWithCounts.length
    });
  } catch (error) {
    logger.error('[CLASSES API] Error listing classes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list classes'
    });
  }
});

/**
 * GET /api/classes/:id
 * Get a single class by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[CLASSES API] GET /api/classes/${id} - Getting class`);

    const data = await supabaseQuery(`classes?id=eq.${id}`, {
      select: 'id,name,school_year,description,created_by,active,created_at,updated_at'
    });

    if (!data || data.length === 0) {
      logger.warn(`[CLASSES API] Class ${id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    logger.success(`[CLASSES API] Found class ${id}`);

    res.json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    logger.error('[CLASSES API] Error getting class:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get class'
    });
  }
});

/**
 * POST /api/classes/create
 * Create a new class
 */
router.post('/create', async (req, res) => {
  try {
    const { name, school_year, description, created_by, student_ids } = req.body;

    logger.info(`[CLASSES API] POST /api/classes/create - Creating class ${name}`);

    // Validate required fields
    if (!name || !created_by) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, created_by'
      });
    }

    // Create the class
    const classData = await supabaseQuery('classes', {
      method: 'POST',
      select: 'id,name,school_year,description,created_by,active,created_at,updated_at',
      body: {
        name: name.trim(),
        school_year: school_year?.trim() || null,
        description: description?.trim() || null,
        created_by,
        active: true
      }
    });

    const newClass = Array.isArray(classData) ? classData[0] : classData;

    logger.success(`[CLASSES API] Class ${name} created with ID: ${newClass.id}`);

    // Add students if provided
    if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
      logger.info(`[CLASSES API] Adding ${student_ids.length} students to class ${newClass.id}`);

      const enrollments = student_ids.map(student_id => ({
        class_id: newClass.id,
        student_id
      }));

      await supabaseQuery('class_students', {
        method: 'POST',
        body: enrollments
      });

      logger.success(`[CLASSES API] Added ${student_ids.length} students to class ${newClass.id}`);
    }

    res.status(201).json({
      success: true,
      data: {
        ...newClass,
        student_count: student_ids?.length || 0
      }
    });
  } catch (error) {
    logger.error('[CLASSES API] Error creating class:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create class'
    });
  }
});

/**
 * PUT /api/classes/:id
 * Update an existing class
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, school_year, description, active } = req.body;

    logger.info(`[CLASSES API] PUT /api/classes/${id} - Updating class`);

    // Build update body
    const updateBody = {};

    if (name !== undefined) {
      updateBody.name = name.trim();
    }
    if (school_year !== undefined) {
      updateBody.school_year = school_year?.trim() || null;
    }
    if (description !== undefined) {
      updateBody.description = description?.trim() || null;
    }
    if (active !== undefined) {
      updateBody.active = active;
    }

    if (Object.keys(updateBody).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Always update updated_at
    updateBody.updated_at = new Date().toISOString();

    const data = await supabaseQuery(`classes?id=eq.${id}`, {
      method: 'PATCH',
      select: 'id,name,school_year,description,created_by,active,created_at,updated_at',
      body: updateBody
    });

    if (!data || data.length === 0) {
      logger.warn(`[CLASSES API] Class ${id} not found for update`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    logger.success(`[CLASSES API] Updated class ${id}`);

    res.json({
      success: true,
      data: Array.isArray(data) ? data[0] : data
    });
  } catch (error) {
    logger.error('[CLASSES API] Error updating class:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update class'
    });
  }
});

/**
 * DELETE /api/classes/:id
 * Delete a class (soft delete - sets active = false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    logger.info(`[CLASSES API] DELETE /api/classes/${id} - ${hard ? 'Hard' : 'Soft'} delete`);

    let data;

    if (hard === 'true') {
      // Hard delete - remove from database
      data = await supabaseQuery(`classes?id=eq.${id}`, {
        method: 'DELETE',
        select: 'id,name'
      });
    } else {
      // Soft delete - just set active = false
      data = await supabaseQuery(`classes?id=eq.${id}`, {
        method: 'PATCH',
        select: 'id,name,school_year,description,active,created_at,updated_at',
        body: {
          active: false,
          updated_at: new Date().toISOString()
        }
      });
    }

    if (!data || data.length === 0) {
      logger.warn(`[CLASSES API] Class ${id} not found for delete`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    logger.success(`[CLASSES API] Deleted class ${id}`);

    res.json({
      success: true,
      data: Array.isArray(data) ? data[0] : data,
      deleted: hard === 'true' ? 'hard' : 'soft'
    });
  } catch (error) {
    logger.error('[CLASSES API] Error deleting class:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete class'
    });
  }
});

/**
 * GET /api/classes/:id/students
 * Get all students in a class
 */
router.get('/:id/students', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[CLASSES API] GET /api/classes/${id}/students - Getting class students`);

    // Get class_students relations
    const enrollments = await supabaseQuery(`class_students?class_id=eq.${id}`, {
      select: 'student_id'
    });

    if (enrollments.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    // Get full student details for each student_id
    const studentIds = enrollments.map(e => e.student_id);
    const studentsData = await Promise.all(
      studentIds.map(async (studentId) => {
        const students = await supabaseQuery(`users?id=eq.${studentId}`, {
          select: 'id,name,email,user_role,active'
        });
        return students[0];
      })
    );

    logger.success(`[CLASSES API] Found ${studentsData.length} students in class ${id}`);

    res.json({
      success: true,
      data: studentsData.filter(s => s !== undefined),
      count: studentsData.length
    });
  } catch (error) {
    logger.error('[CLASSES API] Error getting class students:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get class students'
    });
  }
});

/**
 * POST /api/classes/:id/students
 * Update students in a class (replaces all current students)
 */
router.post('/:id/students', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_ids } = req.body;

    logger.info(`[CLASSES API] POST /api/classes/${id}/students - Updating class students`);

    if (!Array.isArray(student_ids)) {
      return res.status(400).json({
        success: false,
        error: 'student_ids must be an array'
      });
    }

    // Step 1: Remove all current students
    await supabaseQuery(`class_students?class_id=eq.${id}`, {
      method: 'DELETE'
    });

    logger.info(`[CLASSES API] Removed all students from class ${id}`);

    // Step 2: Add new students
    if (student_ids.length > 0) {
      const enrollments = student_ids.map(student_id => ({
        class_id: id,
        student_id
      }));

      await supabaseQuery('class_students', {
        method: 'POST',
        body: enrollments
      });

      logger.success(`[CLASSES API] Added ${student_ids.length} students to class ${id}`);
    }

    res.json({
      success: true,
      message: `Updated students for class ${id}`,
      student_count: student_ids.length
    });
  } catch (error) {
    logger.error('[CLASSES API] Error updating class students:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update class students'
    });
  }
});

export default router;
