import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },

    orderId: {
        type: String,
        unique: true,
        required: true,
        default: () => `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    },

    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            priceAtPurchase: {
                type: Number,
                required: true
            },
            size: {
                type: String,
                required: true
            },
            image: {
                type: String,
                required: true,
            },

            productStatus: {
                type: String,
                required: true,
                default: 'failed',
            },

            refundRequest: {
                type: Boolean,
                default: false,
            },

            returnReason: {
                type: String,
                required: false,
            },

            returnRequest: {
                type: String,
                required: false,
            },

            cancelReason: {
                type: String,
                required: false,
            }
        }
    ],

    shippingAddress: {
        houseNo: String,
        street: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String,
        mobileNumber: String,
        addressType: String,
        alternatePhone: String,
    },

    totalPrice: {
        type: Number,
        required: true,
    },

    orderStatus: {
        type: String,
        required: true,
        default: 'failed',
    },

    paymentMethod: {
        type: String,
        required: true,
        default: 'not decided',
    },

    paymentStatus: {
        type: String,
        required: true,
        default: 'not completed',
    },

    discount: {
        type: Number,
        required: false,
    },

    orderDate: {
        type: Date,
        default: Date.now,
    },

    deliveryDate: {
        type: Date,
        required: false,
    },

    couponApplied: {
        type: Boolean,
        default: false,
    },

    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: false,
    },

    grandTotal: {
        type: Number,
        required: true,
    }

}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
