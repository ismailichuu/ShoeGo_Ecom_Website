import { Google } from 'arctic';
import process from 'process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.global') });
dotenv.config({ path: path.resolve('.env.local') });

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URL
);
