import LoginActivity from '../models/LoginActivity.js';

// Best-effort — a logging failure should never block an actual login/signup.
export const recordLoginActivity = async (userId, req, purpose) => {
  try {
    await LoginActivity.create({
      user: userId,
      purpose,
      ip: req.ip || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || ''
    });
  } catch (err) {
    console.error('Failed to record login activity:', err.message);
  }
};

// GET /api/auth/security
export const getSecurity = async (req, res) => {
  const twoFactorEnabled = process.env.SKIP_OTP_VERIFICATION !== 'true';
  const recentActivity = await LoginActivity.find({ user: req.user._id }).sort('-createdAt').limit(10);
  res.json({
    twoFactorEnabled,
    recentActivity: recentActivity.map((a) => ({
      _id: a._id,
      purpose: a.purpose,
      ip: a.ip,
      userAgent: a.userAgent,
      createdAt: a.createdAt
    }))
  });
};
