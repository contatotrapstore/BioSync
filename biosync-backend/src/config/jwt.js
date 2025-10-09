require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};
