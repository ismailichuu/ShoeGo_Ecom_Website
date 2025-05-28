import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    balance: {
      type: Number,
      default: 0
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ['credit', 'debit'],
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        reason: {
          type: String,
          enum: ['order_return', 'order_cancel', 'manual_topup', 'gift_card', 'purchase'],
          required: true
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
          default: null
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;