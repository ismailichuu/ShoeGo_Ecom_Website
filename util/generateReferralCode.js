//generate Referal-Code
export function generateReferralCode(nameOrEmail) {
  const base = nameOrEmail.split('@')[0].toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${base}-${random}`;
}
