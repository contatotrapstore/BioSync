/**
 * Simple logger utility with timestamps and colors
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function getTimestamp() {
  return new Date().toISOString();
}

export function info(message, ...args) {
  console.log(`${colors.cyan}[INFO]${colors.reset} ${getTimestamp()} -`, message, ...args);
}

export function success(message, ...args) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${getTimestamp()} -`, message, ...args);
}

export function warn(message, ...args) {
  console.warn(`${colors.yellow}[WARN]${colors.reset} ${getTimestamp()} -`, message, ...args);
}

export function error(message, ...args) {
  console.error(`${colors.red}[ERROR]${colors.reset} ${getTimestamp()} -`, message, ...args);
}

export function debug(message, ...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${colors.magenta}[DEBUG]${colors.reset} ${getTimestamp()} -`, message, ...args);
  }
}

export default {
  info,
  success,
  warn,
  error,
  debug,
};
