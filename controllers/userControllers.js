import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { google } from "../auth/google.js";
import User from "../models/userSchema.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//@route GET /login
export const getLogin = (req, res) => {
    res.render('user/login');
}

//@route POST /login
export const handleLogin = (req, res) => {

}

//@route GET /forgotpassword
export const getForgotPassword = (req, res) => {

}

//@route POST /forgotpassword
export const handleForgotpassword = (req, res) => {

}

//@route GET /verify
export const getVerify = (req, res) => {
    const signup = req.session.signup || null;
    const token = req.query.token;
    if(!token) return res.redirect('/signup');

    try{
        const decoded = jwt.verify(token, 'user_email');
        const email = decoded.email;
        res.render('user/verify', {signup, email});
    }catch(err){
        return res.status(401).send('Invalid or expired token');
    }
}

//@route POST /verify
export const handleVerify = (req, res) => {

}

//@route GET /signup
export const getSignup = (req, res) => {
    const signupErr = req.session.err || null;
    res.render('user/signup', {msg: signupErr});
}

//@route POST /signup
export const handleSignup = async (req, res) => {

    try {

        const { name, email, password1, password2 } = req.body;
        if (password1 !== password2) throw new Error('Password not Match');

        if(password1.length < 6) throw new Error('Password Must be 6 Characters');

        //Checking user exist or not
        const userExist = await User.findOne({ email });
        if(userExist && !userExist.isVerified){
            const token = jwt.sign({email}, 'user_email', {expiresIn: '10m'});
            req.session.signup = true;
            return res.redirect(`/verify?token=${token}`);
        }

        if (userExist) throw ('User is already registered');
        
        //password hashing
        const saltRounds = 10;
        const hashPassword = await bcrypt.hash(password1, saltRounds);

        const newUser = new User({
            name,
            email,
            password: hashPassword,
        });

        await newUser.save();
        console.log('signup successful');
        req.session.user = name;
        const token = jwt.sign({email}, 'user_email', {expiresIn: '10m'});
        req.session.signup = true;
        res.redirect(`/verify?token=${token}`);
    } catch (error) {
        console.log(error);
        req.session.err = error.toString();
        res.redirect('/signup');
    };
};

//@route GET /privacy_policy
export const getPrivacyPolicy = (req, res) => {

}

//@route GET /terms_and_conditions
export const getTermsConditions = (req, res) => {

}

//@route GET /
export const getHome = (req, res) => {
    res.render('user/home.ejs');
}

//@route GET /auth/google 
export const handleGoogle = (req, res) => {
    try {
        const state = generateState(); 
        const codeVerifier = generateCodeVerifier();
        const scope = ['openid', 'profile', 'email'];

        req.session.oauth_state = state;
        req.session.code_verifier = codeVerifier; 

        const url = google.createAuthorizationURL(state, codeVerifier, scope);

        res.redirect(url.toString());
    } catch (error) {
        console.error('Error during Google OAuth redirect:', error);
        res.status(500).send('Error during Google login.');
    }
};

//@route GET /auth/google/callback
export const handleGoogleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const storedState = req.session.oauth_state;
        const codeVerifier = req.session.code_verifier;

        if (!code || state !== storedState || !codeVerifier) {
            return res.status(400).send("Invalid request.");
        }

        const tokens = await google.validateAuthorizationCode(code, codeVerifier);
        const idToken = tokens.idToken();
        const claims = decodeIdToken(idToken);

        const email = claims.email;
        const name = claims.name;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                isVerified: true,
                provider: "google",
            });
        }

        req.session.user = user._id;

        res.redirect("/");
    } catch (error) {
        console.error("Error during Google OAuth callback:", error);
        res.status(500).send("Google authentication failed.");
    }
};





