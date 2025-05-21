import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        size: {
          type: String,
          required: true,
        }
      }
    ]
  },
  { timestamps: true } 
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;