const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { supabase } = require('../config/supabase');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, jwtConfig.secret);

      // Fetch user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, is_admin, is_active, is_psychologist')
        .eq('id', decoded.userId)
        .single();

      if (error || !user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive.'
        });
      }

      // Attach user to request object
      req.user = {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin,
        isPsychologist: user.is_psychologist || false
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }
      throw error;
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authorization denied.'
    });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
