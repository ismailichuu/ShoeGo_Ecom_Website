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

function trimLogFileIfNeeded(maxLines = 40) {
  if (fs.existsSync(logFile)) {
    const logData = fs.readFileSync(logFile, 'utf8');
    const lines = logData.trim().split('\n');

    if (lines.length > maxLines) {
      const trimmed = lines.slice(lines.length - maxLines);
      fs.writeFileSync(logFile, trimmed.join('\n') + '\n', 'utf8');
    }
  }
}

export const logger = {
  error: (...args) => {
    const message = `[${new Date().toISOString()}] ERROR: ${args.join(' ')}\n`;

    // Write to file
    fs.appendFileSync(logFile, message, 'utf8');

    // Trim file to last 40 lines if needed
    trimLogFileIfNeeded(40);

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
