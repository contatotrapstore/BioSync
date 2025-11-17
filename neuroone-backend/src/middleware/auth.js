import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create Supabase client for JWT verification
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_KEY not configured. JWT authentication will fail.');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Verify JWT token from Supabase
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User object or null
 */
export async function verifyToken(token) {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('JWT verification error:', error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('JWT verification exception:', error);
    return null;
  }
}

/**
 * Middleware to verify JWT in Socket.io connection
 * @param {Object} socket - Socket.io socket
 * @param {Function} next - Next middleware function
 */
export async function socketAuthMiddleware(socket, next) {
  try {
    // Get token from auth handshake or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify token
    const user = await verifyToken(token);

    if (!user) {
      return next(new Error('Invalid or expired token'));
    }

    // Attach user to socket
    socket.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'aluno',
      name: user.user_metadata?.name || user.email,
    };

    console.log(`✅ Authenticated: ${socket.user.email} (${socket.user.role})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}

/**
 * Verify user has required role
 * @param {Object} socket - Socket.io socket
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export function hasRole(socket, allowedRoles) {
  if (!socket.user) {
    return false;
  }

  return allowedRoles.includes(socket.user.role);
}

/**
 * Verify student is enrolled in class
 * @param {string} studentId - Student user ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>}
 */
export async function isStudentInClass(studentId, classId) {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  try {
    const { data, error } = await supabase
      .from('class_students')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking class enrollment:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking class enrollment:', error);
    return false;
  }
}

export default {
  verifyToken,
  socketAuthMiddleware,
  hasRole,
  isStudentInClass,
};
