/**
 * Logger utility for consistent logging across the application
 * In production, only errors are logged. In development, all logs are shown.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export const logger: Logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Always log errors, but could be sent to a monitoring service
    console.error('[ERROR]', ...args);
  },
};

// Export for use in API routes
export default logger;
