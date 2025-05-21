import mongoose from "mongoose";

const orderSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },

    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', 
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

    returnReason: {
        type: String,
        required: false,
    },

    discount: {
        type: String,
        required: false,
    },

    orderDate: {
        type: Date,
        default: Date.now,
    },

    deliveryDate: {
        type: Date,
        required: false,
    }
}, {
    timestamps: true,

});

const Order = mongoose.model('Order', orderSchema);

export default Order;