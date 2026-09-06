import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const issueOtp = async (email, purpose) => {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  await Otp.deleteMany({ email, purpose });
  await Otp.create({
    email,
    purpose,
    codeHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS)
  });
  return code;
};

export const verifyOtp = async (email, purpose, code) => {
  const record = await Otp.findOne({ email, purpose });
  if (!record) return { ok: false, message: 'Code expired or not found. Request a new one.' };

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    return { ok: false, message: 'Too many incorrect attempts. Request a new code.' };
  }

  const matches = await record.matchCode(code);
  if (!matches) {
    record.attempts += 1;
    await record.save();
    return { ok: false, message: 'Incorrect code. Please try again.' };
  }

  await record.deleteOne();
  return { ok: true };
};
