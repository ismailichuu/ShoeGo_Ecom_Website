
import mongoose from "mongoose";

//Mongo Schema
const signUpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    provider: {
        type: String,
        required: false
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: false,
    },

    isVerified: {
        type: Boolean,
        required: true,
        default: false,
    },

    isBlocked: {
        type: Boolean,
        required: true,
        default: false,
    },

    otp: {
        type: String,
        required: false,
    },

    otpExpiry: {
        type: Date,
        required: false,
    },

    admin: {
        type: Boolean,
        required: false,
    },

    profile: {
        type: String,
        required: false,
    },

    newsLetter: {
        type: Boolean,
        required: true,
        default: false,
    },

    mobileNumber: {
        type: String,
        maxlength: 10,
        required: false,
    },

    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: false,
    },

    referralCode: {
        type: String, 
        unique: true 
    },

    referrerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        default: null 
    },

    referralsCount: {
        type: Number,
        default: 0,
    },

    successfulReferrals: { 
        type: Number, 
        default: 0 
    },

}, {
    timestamps: true,
});

//create model
const User = mongoose.model('users', signUpSchema);

export default User;