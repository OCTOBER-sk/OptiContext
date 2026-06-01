export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  agent_id?: string;
  tool?: string;
  latency_ms?: number;
  error?: string;
  timestamp: string;
  [key: string]: unknown; // Allow any extra metadata fields
}

const MAX_LOG_LENGTH = 2000;

function truncate(str: string, max: number = MAX_LOG_LENGTH): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const entry: LogEntry = {
    level,
    message: truncate(message),
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
  const details = meta ? ` ${JSON.stringify(meta)}` : "";

  switch (level) {
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}${details}`);
      break;
    case LogLevel.WARN:
      console.warn(`${prefix} ${message}${details}`);
      break;
    default:
      console.log(`${prefix} ${message}${details}`);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    log(LogLevel.DEBUG, msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) =>
    log(LogLevel.INFO, msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    log(LogLevel.WARN, msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    log(LogLevel.ERROR, msg, meta),
};
