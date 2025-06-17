import Razorpay from 'razorpay';
import process from 'process';

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export default razorpayInstance;
