import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
    },

    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },

    discount: {
        type: Number,
        required: true,
    },

    minAmount: {
        type: Number,
        required: true,
    },

    activeFrom: {
        type: Date,
        required: true,
    },

    activeTo: {
        type: Date,
        required: true,
    },

    limit: {
        type: Number,
        required: true,
        min: 1,
    },

    used: {
        type: Number,
        default: 0,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    usedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        }
    ],

}, {
    timestamps: true
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
