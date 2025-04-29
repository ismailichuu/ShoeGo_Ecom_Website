import express from 'express';
import { getLogin, handleLogin, getHome, handleGoogle, handleGoogleCallback, getSignup, handleSignup, getVerify} from '../controllers/userControllers.js';

const router = express.Router();

router.get('/login', getLogin);

router.post('/login',handleLogin);

router.get('/', getHome);

router.get('/auth/google', handleGoogle);

router.get("/auth/google/callback", handleGoogleCallback);

router.get('/signup', getSignup);

router.post('/signup', handleSignup);

router.get('/verify', getVerify);


export default router;