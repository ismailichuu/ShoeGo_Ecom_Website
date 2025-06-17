import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    name: {
      type: String,
      required: false,
    },

    mobileNumber: {
      type: String,
      required: true,
    },

    pincode: {
      type: String,
      required: true,
    },

    locality: {
      type: String,
      required: true,
    },

    houseNo: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    landmark: {
      type: String,
    },

    alternatePhone: {
      type: String,
    },

    addressType: {
      type: String,
      enum: ['Home', 'Work'],
      required: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Address = mongoose.model('Address', addressSchema);

export default Address;
