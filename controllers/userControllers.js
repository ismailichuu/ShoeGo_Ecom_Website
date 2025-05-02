import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { google } from "../auth/google.js";
import User from "../models/userSchema.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateOtp } from "../utility/functions.js";
import sendOTPEmail from "../configuration/nodemailer.transporter.js";

//@route GET /login
export const getLogin = (req, res) => {
    res.render('user/login');
}

//@route POST /login
export const handleLogin = (req, res) => {

}

//@route GET /forgotpassword
export const getForgotPassword = (req, res) => {
    const msg = req.session.err || null;
    req.session.err = null;
    res.render('user/forgot', {msg});
}

//@route POST /forgotpassword
export const handleForgotpassword = async (req, res) => {
    try{
        const {email} = req.body;
        //checking for user
        const user = await User.findOne({ email });
        if(!user) throw ("User doesn't exist");
        //sending otp
        const otp = generateOtp();
        const otpExpiry = Date.now() + 4 * 60 * 1000;
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await sendOTPEmail(email, otp, 'signup', '4 minutes');
        await user.save();
        //jwt token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '4m' });
        res.redirect(`/verify?token=${token}`);
    }catch(error){
        req.session.err = error.toString();
        res.redirect('/forgot');
    }
}

//@route GET /verify
export const getVerify = (req, res) => {
    try {
        const msg = req.session.err || null;
        const signup = req.session.signup || null;
        req.session.err = null;
        const token = req.query.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) return res.redirect('/signup');
        const email = decoded.email;
        req.session.token = token;
        res.render('user/verify', { signup, email, msg });
    } catch (err) {
        req.session.err = 'Session Expired Signup Again';
        return res.redirect('/signup');
    }
}

//@route POST /verify
export const handleVerify = async (req, res) => {
    try {
        if (!req.session.token) {
            req.session.err = "Session expired. Please sign up again.";
            return res.redirect("/signup");
        }
        const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
        const email = decoded.email;
        const { num1, num2, num3, num4 } = req.body;
        const otp = [num1, num2, num3, num4].join('');
        //userExist
        const user = await User.findOne({ email });
        if (!user) {
            req.session.err = 'User not found Signup again';
            return res.redirect('/signup');
        }

        if (user.otp !== otp) throw new Error('Invalid OTP');
        if (Date.now() > user.otpExpiry) throw new Error('Otp Expired! Resend it');

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.redirect('/');
    } catch (error) {
        console.log(error);
        req.session.err = error.toString();
        res.redirect(`/verify?token=${req.session.token}`);
    }
}

//@route GET /signup
export const getSignup = (req, res) => {
    const signupErr = req.session.err || null;
    req.session.err = null;
    res.render('user/signup', { msg: signupErr });
}

//@route POST /signup
export const handleSignup = async (req, res) => {

    try {

        const { name, email, password1, password2 } = req.body;
        if (password1 !== password2) throw new Error('Password not Match');

        if (password1.length < 6) throw new Error('Password Must be 6 Characters');

        //Checking user exist or not
        const userExist = await User.findOne({ email });
        if (userExist && !userExist.isVerified) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '2h' });
            req.session.signup = true;
            const otp = generateOtp();
            const otpExpiry = Date.now() + 2 * 60 * 60 * 1000;
            userExist.otp = otp;
            userExist.otpExpiry = otpExpiry;
            userExist.save();
            await sendOTPEmail(email, otp, 'signup', '2 hour');
            return res.redirect(`/verify?token=${token}`);
        }

        if (userExist) throw ('User is already registered');

        //password hashing
        const saltRounds = 10;
        const hashPassword = await bcrypt.hash(password1, saltRounds);

        //otp
        const otp = generateOtp();
        const otpExpiry = Date.now() + 2 * 60 * 60 * 1000;

        const newUser = new User({
            name,
            email,
            password: hashPassword,
            otp,
            otpExpiry,
            isVerified: false,
            createdAt: Date(),
        });

        await newUser.save();

        await sendOTPEmail(email, otp, 'signup', '2 hour');

        console.log('signup successful');
        req.session.user = name;

        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '2h' });
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

//@route GET /changePassword
export const getChangePassword = (req, res) => {
    res.render('user/changePassword');
}

//@route POST /changePassword
export const handleChangePassword = (req, res) => {
    try{
        const {password, confirmPassword} = req.body;
        
    }catch(error){

    }
}
// export const resendOtp = async (req, res) => {

//     try {
//         const { email } = req.body;
//         const user = await User.findOne({ email });

//         if (!user) {
//             req.session.err = 'User not found Signup again';
//             return res.redirect('/signup');
//         }

//         const otp = generateOtp();
//         const otpExpiry = Date.now() + 2 * 60 * 60 * 1000;

//         user.otp = otp;
//         user.otpExpiry = otpExpiry;
//         await user.save();

//         await sendOTPEmail(email, otp);

//         res.json({ success: true, message: "OTP sent successfully" });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: "Failed to resend OTP" });
//     }
// }





