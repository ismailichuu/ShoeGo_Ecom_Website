import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['order', 'wallet'],
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: function () {
        return this.type === 'order';
      },
    },

    razorpayOrderId: {
      type: String,
      required: false,
    },

    razorpayPaymentId: {
      type: String,
      required: false,
    },

    razorpaySignature: {
      type: String,
      required: false,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: 'INR',
    },

    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'failed',
    },

    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod', 'wallet'],
      required: true,
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
