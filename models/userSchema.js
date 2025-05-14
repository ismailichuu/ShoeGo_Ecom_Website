
import mongoose from "mongoose";

//Mongo Schema
const signUpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim : true,
    },

    provider: {
        type: String,
        required: false
    },

    email: {
        type: String,
        required: true,
        unique : true,
        lowercase : true,
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

    otpExpiry:{
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
    }
}, {
    timestamps: true,
});

//create model
const User = mongoose.model('users', signUpSchema);

export default User;