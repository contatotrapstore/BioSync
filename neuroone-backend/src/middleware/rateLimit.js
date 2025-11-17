import logger from '../utils/logger.js';

/**
 * Rate limiter for Socket.io events
 * Prevents spam and abuse
 */

class RateLimiter {
  constructor() {
    // Store: { socketId: { eventName: { count, resetTime } } }
    this.store = new Map();

    // Cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if event is allowed
   * @param {string} socketId - Socket ID
   * @param {string} eventName - Event name
   * @param {Object} limits - { maxRequests, windowMs }
   * @returns {boolean}
   */
  isAllowed(socketId, eventName, limits = { maxRequests: 100, windowMs: 60000 }) {
    const now = Date.now();

    if (!this.store.has(socketId)) {
      this.store.set(socketId, new Map());
    }

    const socketLimits = this.store.get(socketId);

    if (!socketLimits.has(eventName)) {
      socketLimits.set(eventName, {
        count: 1,
        resetTime: now + limits.windowMs,
      });
      return true;
    }

    const eventLimit = socketLimits.get(eventName);

    // Reset if window expired
    if (now > eventLimit.resetTime) {
      socketLimits.set(eventName, {
        count: 1,
        resetTime: now + limits.windowMs,
      });
      return true;
    }

    // Increment counter
    eventLimit.count++;

    // Check if exceeded
    if (eventLimit.count > limits.maxRequests) {
      logger.warn(`Rate limit exceeded for socket ${socketId} on event ${eventName} (${eventLimit.count}/${limits.maxRequests})`);
      return false;
    }

    return true;
  }

  /**
   * Get remaining requests
   * @param {string} socketId - Socket ID
   * @param {string} eventName - Event name
   * @param {number} maxRequests - Max requests
   * @returns {number}
   */
  getRemaining(socketId, eventName, maxRequests = 100) {
    if (!this.store.has(socketId)) {
      return maxRequests;
    }

    const socketLimits = this.store.get(socketId);

    if (!socketLimits.has(eventName)) {
      return maxRequests;
    }

    const eventLimit = socketLimits.get(eventName);
    return Math.max(0, maxRequests - eventLimit.count);
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [socketId, socketLimits] of this.store.entries()) {
      for (const [eventName, eventLimit] of socketLimits.entries()) {
        if (now > eventLimit.resetTime) {
          socketLimits.delete(eventName);
          cleaned++;
        }
      }

      if (socketLimits.size === 0) {
        this.store.delete(socketId);
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Clear all limits for a socket
   * @param {string} socketId - Socket ID
   */
  clear(socketId) {
    this.store.delete(socketId);
  }

  /**
   * Remove socket (alias for clear - for testing compatibility)
   * @param {string} socketId - Socket ID
   */
  removeSocket(socketId) {
    this.clear(socketId);
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    let totalSockets = this.store.size;
    let totalEvents = 0;

    for (const socketLimits of this.store.values()) {
      totalEvents += socketLimits.size;
    }

    return {
      totalSockets,
      totalEvents,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Export class for testing
export { RateLimiter };

/**
 * Middleware to apply rate limiting to Socket.io events
 * @param {Object} limits - Rate limit configuration per event
 */
export function createRateLimitMiddleware(limits = {}) {
  // Default limits
  const defaultLimits = {
    'eeg:data': { maxRequests: 300, windowMs: 60000 }, // 5 Hz for 1 minute = 300 requests
    'student:join': { maxRequests: 5, windowMs: 60000 },
    'teacher:join': { maxRequests: 5, windowMs: 60000 },
    'student:leave': { maxRequests: 10, windowMs: 60000 },
    'teacher:leave': { maxRequests: 10, windowMs: 60000 },
    'teacher:get-students': { maxRequests: 30, windowMs: 60000 },
    default: { maxRequests: 100, windowMs: 60000 },
  };

  const finalLimits = { ...defaultLimits, ...limits };

  return function rateLimitMiddleware(eventName, handler) {
    return function rateLimitedHandler(socket, data, ...args) {
      const limit = finalLimits[eventName] || finalLimits.default;

      if (!rateLimiter.isAllowed(socket.id, eventName, limit)) {
        const remaining = rateLimiter.getRemaining(socket.id, eventName, limit.maxRequests);

        socket.emit('error', {
          message: `Rate limit exceeded for event "${eventName}". Try again later.`,
          event: eventName,
          limit: limit.maxRequests,
          remaining: 0,
          resetTime: Date.now() + limit.windowMs,
        });

        logger.warn(`Rate limit blocked: ${socket.user?.email || socket.id} - ${eventName}`);
        return;
      }

      // Call original handler
      return handler(socket, data, ...args);
    };
  };
}

/**
 * Clear rate limits on disconnect
 * @param {Object} socket - Socket.io socket
 */
export function clearSocketLimits(socket) {
  rateLimiter.clear(socket.id);
}

/**
 * Get rate limiter stats
 * @returns {Object}
 */
export function getRateLimiterStats() {
  return rateLimiter.getStats();
}

export default {
  createRateLimitMiddleware,
  clearSocketLimits,
  getRateLimiterStats,
};
