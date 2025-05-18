import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import bcrypt from 'bcrypt';
import { google } from "../auth/google.js";
import User from "../models/userSchema.js";
import jwt from 'jsonwebtoken';
import { generateOtp, hashingPassword } from "../util/functions.js";
import sendOTPEmail from "../configuration/nodemailer.transporter.js";
import Product from "../models/productSchema.js";
import { decodeUserId, generateToken, verifyToken } from "../util/jwt.js";
import Category from "../models/categorySchema.js";
import Address from "../models/addressSchema.js";

//@route GET /login
export const getLogin = (req, res) => {
    const msg = req.session.err || null;
    res.render('user/login', { msg });
}

//@route POST /login
export const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        //userExist
        const user = await User.findOne({ email });
        if (!user) throw new Error('User not found');
        //userBlocked or not
        if (user.isBlocked) throw new Error('Account is blocked');
        //password comapre
        const checkPassword = bcrypt.compare(password, user.password);
        if (!checkPassword) throw new Error('Invalid credentials');
        const token = generateToken(user._id, '1d');
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        res.redirect('/');
    } catch (error) {
        console.log(error);
        req.session.err = error.toString();
        res.redirect('/login');
    }
}

//@route GET /forgotpassword
export const getForgotPassword = (req, res) => {
    const msg = req.session.err || null;
    req.session.err = null;
    res.render('user/forgot', { msg, admin: false });
}

//@route POST /forgotpassword
export const handleForgotpassword = async (req, res) => {
    try {
        const { email } = req.body;
        //checking for user
        const user = await User.findOne({ email });
        if (!user) throw ("User doesn't exist");
        //sending otp
        const otp = generateOtp();
        const otpExpiry = Date.now() + 4 * 60 * 1000;
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await sendOTPEmail(email, otp, 'Password Change', '4 minutes');
        await user.save();
        //jwt token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '20m' });
        res.redirect(`/verify?token=${token}`);
    } catch (error) {
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
        req.session.signup = null;
        const token = req.query.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) return res.redirect('/signup');
        const email = decoded.email;
        req.session.token = token;
        res.render('user/verify', { signup, email, msg, admin: false });
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

        return res.redirect('/');
    } catch (error) {
        console.log(error);
        req.session.err = error.toString();
        req.session.signup = true;
        res.redirect(`/verify?token=${req.session.token}`);
    }
}

//@route POST /verifyPassword
export const handleVerifyPassword = async (req, res) => {
    try {
        const { num1, num2, num3, num4 } = req.body;
        const otp = [num1, num2, num3, num4].join('');
        if (!req.session.token) {
            req.session.err = "Session expired";
            return res.redirect("/forgot");
        }
        const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
        const email = decoded.email;
        //userExist
        const user = await User.findOne({ email });
        if (!user) {
            req.session.err = 'User not found';
            return res.redirect('/signup');
        }

        if (user.otp !== otp) throw new Error('Invalid OTP');
        if (Date.now() > user.otpExpiry) throw new Error('Otp Expired!');

        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return res.redirect('/changePassword');
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
    res.render('user/signup', { msg: signupErr, admin: false });
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
        const hashPassword = await hashingPassword(password1);

        const otp = generateOtp();
        const otpExpiry = Date.now() + 2 * 60 * 60 * 1000;
        await sendOTPEmail(email, otp, 'signup', '2 hour');
        const newUser = new User({
            name,
            email,
            password: hashPassword,
            otp,
            otpExpiry,
            isVerified: false,
            createdAt: Date(),
        });

        const response = await newUser.save();
        const token = generateToken(response._id, '1d');
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        const tokenEmail = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '2h' });
        req.session.signup = true;
        res.redirect(`/verify?token=${tokenEmail}`);
    } catch (error) {
        console.log(error);
        req.session.err = error.toString();
        res.redirect('/signup');
    };
};

//@route GET /
export const getHome = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .limit(8)
            .populate('categoryId')
            .sort({ createdAt: -1 });
        res.render('user/home', { products });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

//@route GET /allProducts

export const getAllProducts = async (req, res) => {
    try {
        const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search || '';
        const sort = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort || '';
        const page = parseInt(Array.isArray(req.query.page) ? req.query.page[0] : req.query.page || '1', 10);

        const minPrice = parseInt(req.query.minPrice || '0', 10);
        const maxPrice = parseInt(req.query.maxPrice || '0', 10); // 0 = no max limit

        const limit = 8;
        const skip = (page - 1) * limit;

        let query = { isActive: true };

        // Search filter
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Category filter (dropdown)
        let categoryFilter = req.query.category;
        let selectedCategory = '';

        if (categoryFilter) {
            selectedCategory = Array.isArray(categoryFilter) ? categoryFilter[0] : categoryFilter;
            query.categoryId = selectedCategory;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.discountPrice = {};
            if (minPrice) query.discountPrice.$gte = minPrice;
            if (maxPrice) query.discountPrice.$lte = maxPrice;
        }

        // Sorting
        let sortQuery = {};
        if (sort === 'discountPrice-asc') sortQuery.discountPrice = 1;
        else if (sort === 'discountPrice-desc') sortQuery.discountPrice = -1;
        else if (sort === 'az') sortQuery.name = 1;
        else if (sort === 'za') sortQuery.name = -1;

        // Count and retrieve products
        const totalProducts = await Product.countDocuments(query);

        const products = await Product.find(query)
            .populate('categoryId')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        // Get all categories
        const categories = await Category.find();

        res.render('user/shop', {
            products,
            search,
            sort,
            category: selectedCategory,
            categories,
            minPrice,
            maxPrice,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
            },
        });
    } catch (error) {
        console.error('Error in getAllProducts:', error);
        res.status(500).send('Internal Server Error');
    }
};



//@route GET /product:id
export const getProductDetails = async (req, res) => {
    try {
        const reviews = {
            username: "John Doe",
            rating: 4,
            comment: "Very comfortable shoes!",
            date: "2025-05-12"
        }
        const id = req.params.id;
        const product = await Product.findById(id).populate('categoryId');
        const categoryId = product.categoryId;
        const related = await Product.find({
            categoryId, isActive: true,
            _id: { $ne: product._id }
        })
            .limit(4)
            .populate('categoryId');
        if (!product.isActive) return res.redirect('/');
        res.render('user/productDetails', { product, reviews, related });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error during Google login.');
    }
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
        const profile = claims.picture;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                isVerified: true,
                provider: "google",
                profile
            });
        }
        const token = generateToken(user._id, '1d');
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.redirect("/");
    } catch (error) {
        console.error("Error during Google OAuth callback:", error);
        res.status(500).send("Google authentication failed.");
    }
};

//@route GET /changePassword
export const getChangePassword = (req, res) => {
    const msg = req.session.err || null;
    req.session.err = null;
    res.render('user/changePassword', { msg, admin: false });
}

//@route POST /changePassword
export const handleChangePassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        if (password !== confirmPassword) throw ('Password is not match');
        if (!req.session.token) {
            req.session.err = 'Session Expired! Enter email again'
            return res.redirect('/forgot');
        }
        //jwt verify
        const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
        const email = decoded.email;
        //fetching from database 
        const user = await User.findOne({ email });
        user.password = await hashingPassword(password);
        await user.save();
        const token = generateToken(user._id, '1d');
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })
        res.redirect('/');
    } catch (error) {
        req.session.err = error.toString();
        res.redirect('/changePassword');
    }
};

//@route POST /resendOtp
export const resendOtp = async (req, res) => {

    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            req.session.err = 'User not found Signup again';
            return res.redirect('/signup');
        }

        const otp = generateOtp();
        const otpExpiry = Date.now() + 2 * 60 * 60 * 1000;

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendOTPEmail(email, otp,);

        res.json({ success: true, message: "OTP sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to resend OTP" });
    }
};

//@route GET /profile
export const getProfile = async (req, res) => {
    try {
        //token checking
        const token = req.cookies?.token;
        if (!token) res.redirect('/');
        const decoded = verifyToken(token);
        const userId = decoded.userId;
        //fetching user
        const user = await User.findById(userId);
        const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const address = await Address.findOne({userId, isDefault: true});
        res.render('user/profile', { layout: 'profile-layout', user, joinedDate, address });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

//@route GET /profile/edit
export const getEditProfile = async (req, res) => {
    try {
        const token = req.cookies?.token;
        if (!token) return redirect('/');
        const decoded = verifyToken(token);
        const userId = decoded.userId;
        const user = await User.findById(userId);
        res.render('user/editProfile', { layout: 'profile-layout', user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

//@route POST /profile/edit
export const handleEditProfile = async (req, res) => {
    try {
        const { name, mobileNumber, gender, dob, newsLetter } = req.body;
        const updateData = {
            name,
            mobileNumber,
            gender,
            newsLetter: newsLetter === 'on',
        };

        const token = req.cookies?.token;
        if (!token) {
            req.session.err = 'session expired';
            return res.redirect('/login');
        }
        const decoded = verifyToken(token);
        const userId = decoded.userId;

        // Handle uploaded profile pic
        if (req.file) {
            updateData.profile = '/uploads/profiles/' + req.file.filename;
        }

        await User.updateOne({ _id: userId }, updateData);
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating profile.");
    }
};

//@route POST /send-otp-email
export const handleSendOtpEmail = async (req, res) => {
    try {
        //fetching user details
        const token = req.cookies?.token;
        if (!token) {
            req.session.err = 'Session out!! Please login again';
            return res.redirect('/login');
        }
        const { email } = req.body;
        //checking for email
        const decoded = verifyToken(token);
        const userId = decoded.userId;
        const user = await User.findById(userId);

        if (user.email === email) {
            return res.status(400).json({ message: 'This email is already verified by this account.' });
        }
        // Check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'This email is already registered with another account.' });
        }

        // Proceed to generate and send OTP
        const otp = generateOtp();
        // Send the OTP to newEmail
        await sendOTPEmail(email, otp, 'Change Email', '10 min');
        user.otp = otp
        user.otpExpiry = Date.now() + 10 * 60 * 1000; // 5 minutes
        await user.save();

        res.status(200).json({ message: 'OTP sent successfully to your new email.' });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

//@route POST /verify-otp-email
export const handleVerifyOtpEmail = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const token = req.cookies?.token;
        if (!token) {
            req.session.err = 'Session out!! Please login again';
            return res.redirect('/login');
        }
        const { email } = req.body;
        //checking for email
        const decoded = verifyToken(token);
        const userId = decoded.userId;
        const user = await User.findById(userId);

        if (!user || !user.otp || !user.otpExpiry) {
            return res.status(400).json({ message: 'OTP not found. Please request again.' });
        }

        // Check if OTP is correct
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Check if OTP is expired
        if (Date.now() > user.otpExpiresAt) {
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        // If valid
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        user.email = email;
        await user.save();

        return res.status(200).json({ message: 'OTP verified successfully!' });
    } catch (err) {
        return res.status(500).json({ message: 'Something went wrong.' });
    }
};

//@router POST /profile/change-password
export const handleProfileChangePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }

        const decoded = verifyToken(token);
        const userId = decoded.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.provider === 'google') return res.status(400).json({ error: 'Sorry! Your account is created by Google' })

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        user.password = await hashingPassword(newPassword);
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error("Password change error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

//@route GET /addresses
export const getAddresses = async (req, res) => {
    const userId = decodeUserId(req.cookies?.token);
    const addresses = await Address.find({ userId });
    res.render('user/addresses', { layout: 'profile-layout', addresses });
}

//@route GET /add-address
export const getAddAddress = (req, res) => {
    try {
        const msg = req.session.err || null;
        res.render('user/addAddress', { layout: 'profile-layout', msg });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
}

//@route POST /add-address
export const handleAddAddress = async (req, res) => {
    try {
        const {
            phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            type,
            isDefault
        } = req.body;
        if (!phone || !pincode || !locality || !houseNo || !city || !state || !type) {
            req.session.err = 'Please fill all required fields.';
            return res.redirect('/add-address');
        }
        const token = req.cookies?.token;
        const userId = decodeUserId(token);
        if (isDefault) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = new Address({
            userId,
            mobileNumber: phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            addressType: type,
            isDefault: isDefault || false
        });

        await newAddress.save();
        res.redirect('/addresses');
    } catch (error) {
        console.error('Error adding address:', error);
        req.session.err = error.toString();
        res.redirect('/add-address');
    }
};

//@route GET /edit-address/:id
export const getEditAddress = async (req, res) => {
    try {
        const msg = req.session.err || null;
        const addressId = req.params.id;
        const address = await Address.findById(addressId);
        res.render('user/editAddress', { layout: 'profile-layout', msg, address })
    } catch (error) {
        console.log(error);
    }
};

//@route POST /edit-address/:id
export const handleEditAddress = async (req, res) => {
    const addressId = req.params.id;
    try {
        const {
            phone,
            pincode,
            locality,
            houseNo,
            city,
            state,
            landmark,
            alternatePhone,
            type,
            isDefault
        } = req.body;
        if (!phone || !pincode || !locality || !houseNo || !city || !state || !type) {
            req.session.err = 'Please fill all required fields.';
            return res.redirect(`/edit-address/${addressId}`);
        }
        const token = req.cookies?.token;
        const userId = decodeUserId(token);
        if (isDefault) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
        }

        const address = await Address.findById(addressId);

        address.mobileNumber = phone,
        address.pincode = pincode;
        address.locality = locality;
        address.houseNo = houseNo;
        address.city = city;
        address.state = state;
        address.landmark = landmark;
        address.alternatePhone = alternatePhone;
        address.addressType = type;
        address.isDefault = isDefault || false;

        await address.save();
        res.redirect('/addresses');
    } catch (error) {
        console.error('Error adding address:', error);
        req.session.err = error.toString();
        res.redirect(`/edit-address/${addressId}`);
    }
};

//@route DELETE /edit-address/:id
export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        const deleted = await Address.deleteOne({ _id: addressId });

        if (deleted.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        res.json({ success: true, message: 'Address deleted successfully' });

    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

//@route GET /logout
export const handleLogout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};
