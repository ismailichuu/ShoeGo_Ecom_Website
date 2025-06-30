import Razorpay from 'razorpay';
import process from 'process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.global') });

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export default razorpayInstance;
