// logger.js
const LOG_LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

const shouldLog = (level) => LOG_LEVELS[level] <= CURRENT_LEVEL;

const write = (level, consoleFn, message, meta = {}) => {
  if (!shouldLog(level)) return;

  consoleFn(
    JSON.stringify({
      level,
      message,
      ...meta,
      timestamp: new Date().toISOString(),
    })
  );
};

export const logger = {
  error: (message, meta = {}) => write("error", console.error, message, meta),
  warn:  (message, meta = {}) => write("warn",  console.warn,  message, meta),
  info:  (message, meta = {}) => write("info",  console.log,   message, meta),
  http:  (message, meta = {}) => write("http",  console.log,   message, meta),
  debug: (message, meta = {}) => write("debug", console.log,   message, meta),
};