import bcrypt from 'bcrypt';

//generate OTP
export function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

//hashing Password
export async function hashingPassword(password) {
  const saltRounds = 10;
  const hashPassword = await bcrypt.hash(password, saltRounds);
  return hashPassword;
}
