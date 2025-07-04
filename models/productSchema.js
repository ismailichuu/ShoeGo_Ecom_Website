import mongoose from 'mongoose';

//schema
const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    categoryId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
      },
    ],

    description: {
      type: String,
      required: true,
      trim: true,
    },

    images: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    basePrice: {
      type: Number,
      required: true,
    },

    brand: {
      type: String,
      required: true,
    },

    discount: {
      type: String,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
    },

    reservedCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },

    availableSizes: [
      {
        type: Number,
        enum: [6, 7, 8, 9, 10, 11, 12],
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

//model
const Product = mongoose.model('product', productSchema);

export default Product;
