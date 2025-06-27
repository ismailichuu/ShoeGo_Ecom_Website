import fs from 'fs';
import path from 'path';
import process from 'process';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local') });

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'error.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

export const logger = {
  error: (...args) => {
    const message = `[${new Date().toISOString()}] ERROR: ${args.join(' ')}\n`;

    // Write to file
    fs.appendFileSync(logFile, message, 'utf8');

    if (process.env.NODE_ENV !== 'production') {
      console.error(...args);
    }
  },

  info: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[INFO]', ...args);
    }
  },
};
