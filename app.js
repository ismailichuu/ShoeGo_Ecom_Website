import express from 'express';
import adminRouter from './routers/adminRoutes.js';
import userRouter from './routers/userRoutes.js';
import url from 'url';
import path from 'path';
import session from 'express-session';
import mongoConnect from './config/db.js';
import expressLayout from 'express-ejs-layouts';
import cookieParser from 'cookie-parser';
import process from 'process';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config({ path: path.resolve('.env.global') });
const app = express();
const port = process.env.PORT || 8080;

//cors
app.use(cors());

//rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many request from this IP, Try again later!',
});
app.use(limiter);

//cookie-parser
app.use(cookieParser());

//session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

//path setting
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//json and url data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//ejs
app.set('view engine', 'ejs');
app.use(expressLayout);
app.set('layout', false);

//Static folder setting
app.use(express.static(path.join(__dirname, 'public')));

//debugging middleware
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

//no-cache
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

//routers
app.use('/', userRouter);
app.use('/admin', adminRouter);

mongoConnect().then(() =>
  app.listen(port, '0.0.0.0', () =>
    console.log('✅ Server is running at PORT ' + port)
  )
);
