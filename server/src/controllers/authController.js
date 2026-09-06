import User from '../models/User.js';
import Project from '../models/Project.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import StudyPlan from '../models/StudyPlan.js';
import LoginActivity from '../models/LoginActivity.js';
import Notification from '../models/Notification.js';
import ResultsInsight from '../models/ResultsInsight.js';
import { generateToken, generateResetToken, verifyResetToken } from '../middleware/auth.js';
import { issueOtp, verifyOtp } from '../utils/otp.js';
import { sendOtpEmail } from '../utils/email.js';
import { cascadeDeleteProjectData } from './projectController.js';
import { cascadeDeleteStudyPlanData } from './studyPlanController.js';
import { recordLoginActivity } from './securityController.js';

const authResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  token: generateToken(user._id)
});

// Temporary escape hatch: our Resend account is sandboxed to one address, so email delivery
// fails for everyone else. With this on, signup/login still generate + send an OTP (best effort)
// but don't require it to complete — flip off once a verified sending domain is in place.
// Read lazily (not at module load) since dotenv.config() in server.js runs after this module's
// imports are resolved, so a top-level read here would always see it as unset.
const isOtpBypassed = () => process.env.SKIP_OTP_VERIFICATION === 'true';

const sendOtp = async (email, purpose) => {
  const code = await issueOtp(email, purpose);
  try {
    await sendOtpEmail({ to: email, code, purpose });
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    if (!isOtpBypassed()) {
      throw new Error('We could not send the verification email right now. Please try again shortly.');
    }
  }
};

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    let user = await User.findOne({ email });
    if (user?.emailVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (user) {
      user.name = name;
      user.phone = phone || '';
      user.password = password;
      await user.save();
    } else {
      user = await User.create({ name, email, phone: phone || '', password });
    }

    await sendOtp(email, 'signup');

    if (isOtpBypassed()) {
      user.emailVerified = true;
      await user.save();
      await recordLoginActivity(user._id, req, 'signup');
      return res.status(201).json(authResponse(user));
    }

    res.status(200).json({ pending: true, email: user.email, message: 'Verification code sent to your email' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/verify-signup-otp
export const verifySignupOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const result = await verifyOtp(email, 'signup', code);
    if (!result.ok) return res.status(400).json({ message: result.message });

    const user = await User.findOneAndUpdate({ email }, { emailVerified: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    await recordLoginActivity(user._id, req, 'signup');
    res.status(201).json(authResponse(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email first', unverified: true, email: user.email });
    }

    await sendOtp(email, 'login');

    if (isOtpBypassed()) {
      await recordLoginActivity(user._id, req, 'login');
      return res.json(authResponse(user));
    }

    res.status(200).json({ pending: true, email: user.email, message: 'Sign-in code sent to your email' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/verify-login-otp
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const result = await verifyOtp(email, 'login', code);
    if (!result.ok) return res.status(400).json({ message: result.message });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    await recordLoginActivity(user._id, req, 'login');
    res.json(authResponse(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !['signup', 'login', 'reset'].includes(purpose)) {
      return res.status(400).json({ message: 'Valid email and purpose are required' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    await sendOtp(email, purpose);
    res.json({ pending: true, message: 'Code resent' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (user) {
      await sendOtp(email, 'reset');
    }
    // Always respond the same way, whether or not the account exists, to avoid leaking registration status.
    res.json({ pending: true, message: 'If an account exists for that email, a code has been sent' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/verify-reset-otp
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const result = await verifyOtp(email, 'reset', code);
    if (!result.ok) return res.status(400).json({ message: result.message });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    res.json({ resetToken: generateResetToken(user._id) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    let decoded;
    try {
      decoded = verifyResetToken(resetToken);
    } catch {
      return res.status(401).json({ message: 'Reset link expired. Please start again.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Account not found' });

    user.password = password;
    await user.save();

    res.json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/auth/me
export const me = async (req, res) => {
  const u = req.user;
  res.json({ _id: u._id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar });
};

// PUT /api/auth/me
export const updateMe = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (typeof name === 'string') {
      if (!name.trim()) return res.status(400).json({ message: 'Name cannot be empty' });
      updates.name = name.trim();
    }
    if (typeof phone === 'string') updates.phone = phone.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/auth/me
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password confirmation is required' });

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const projects = await Project.find({ user: user._id });
    for (const project of projects) {
      await cascadeDeleteProjectData(project._id);
    }
    await Project.deleteMany({ user: user._id });

    const studyPlans = await StudyPlan.find({ user: user._id });
    for (const plan of studyPlans) {
      await cascadeDeleteStudyPlanData(plan._id);
    }
    await StudyPlan.deleteMany({ user: user._id });

    // Catches messages/conversations not tied to a project (e.g. already-orphaned trash).
    await Message.deleteMany({ user: user._id });
    await Conversation.deleteMany({ user: user._id });
    await LoginActivity.deleteMany({ user: user._id });
    await Notification.deleteMany({ user: user._id });
    await ResultsInsight.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ message: 'Account permanently deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
