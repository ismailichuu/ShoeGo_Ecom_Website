import express from 'express';
import adminRouter from './routers/adminRoutes.js';
import userRouter from './routers/userRoutes.js';
import url from 'url';
import path from 'path';
import session from 'express-session';
import mongoConnect from './configuration/db.js';

const app = express();
const port = process.env.PORT || 8080;

//session
app.use(session({
    secret: 'superman',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false
    }
}))

//path setting
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//ejs
app.set('view engine', 'ejs');

//Static folder setting
app.use(express.static(path.join(__dirname, 'public')));

//routes
app.use('/', userRouter);
app.use('/admin', adminRouter);
console.log(Math.round(100 + Math.random() * 9000))
//listen
mongoConnect().then(() => app.listen(port, () => console.log('server is running at PORT ' + port)));
