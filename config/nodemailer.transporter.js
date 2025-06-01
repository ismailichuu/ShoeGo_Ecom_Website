import nodemailer from 'nodemailer';
import process from 'process';

var transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAIL_TRAP_USER,
    pass: process.env.MAIL_TRAP_SECRET
  }
});

const sendOTPEmail = async (email, otp, message, time) => {
  await transporter.sendMail({
    from: '"ShoeGo 👟" <shoego@gmail.com>',
    to: email,
    subject: 'Your OTP Verification Code',
    html: `
      <div style="max-width:600px; margin:0 auto; padding:20px; font-family:sans-serif; background:#f9f9f9; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align:center;">
          <img src="http://127.0.0.1:8080/images/logo.png" alt="ShoeGo Logo" style="height:60px; margin-bottom:20px;" />
          <h2 style="color:#333;">Verify Your Email</h2>
          <p style="color:#555;">Use the OTP below to complete your ${message}. It expires in <strong>${time}</strong>.</p>
          <div style="margin:30px 0;">
            <span style="display:inline-block; background:#6b46c1; color:#fff; padding:15px 25px; font-size:24px; letter-spacing:5px; border-radius:6px;">
              ${otp}
            </span>
          </div>
          <p style="font-size:13px; color:#888;">If you didn't request this, you can safely ignore it.</p>
        </div>
      </div>
    `,
  });
};


export default sendOTPEmail;