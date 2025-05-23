import express from 'express';
import adminRouter from './routers/adminRoutes.js';
import userRouter from './routers/userRoutes.js';
import url from 'url';
import path from 'path';
import session from 'express-session';
import mongoConnect from './configuration/db.js';
import expressLayout from 'express-ejs-layouts';
import cookieParser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 8080;

//cookie-parser
app.use(cookieParser());

//session
app.use(session({
    secret: 'superman',
    resave: false,
    saveUninitialized: true,
}))

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

//routers
app.use('/', userRouter);
app.use('/admin', adminRouter);


//listen
mongoConnect().then(() => app.listen(port, () => console.log('server is running at PORT ' + port)));
