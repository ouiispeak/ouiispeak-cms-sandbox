/**
 * Centralized logging utility
 * 
 * Provides consistent logging across the application with:
 * - Development-only debug logs
 * - Production-safe error logging
 * - Consistent formatting
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Format log message with prefix
 */
function formatMessage(level: LogLevel, ...args: unknown[]): unknown[] {
  const prefix = `[${level.toUpperCase()}]`;
  return [prefix, ...args];
}

/**
 * Logger implementation
 * 
 * - debug: Only logs in development mode
 * - info: Only logs in development mode
 * - warn: Always logs (important warnings)
 * - error: Always logs (critical errors)
 */
export const logger: Logger = {
  /**
   * Debug logs - only in development
   * Use for detailed debugging information
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...formatMessage("debug", ...args));
    }
  },

  /**
   * Info logs - only in development
   * Use for general information
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...formatMessage("info", ...args));
    }
  },

  /**
   * Warning logs - always logged
   * Use for important warnings that should be visible in production
   */
  warn: (...args: unknown[]) => {
    console.warn(...formatMessage("warn", ...args));
  },

  /**
   * Error logs - always logged
   * Use for errors that need attention
   */
  error: (...args: unknown[]) => {
    console.error(...formatMessage("error", ...args));
  },
};


