
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

    createdAt:{
        type: Date,
        required: true,
    },

    modifiedAt:{
        type: Date,
        required: false,
    }
});

//create model
const User = mongoose.model('users', signUpSchema);

export default User;