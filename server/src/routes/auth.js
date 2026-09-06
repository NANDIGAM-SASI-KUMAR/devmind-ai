import express from 'express';
import {
  signup,
  verifySignupOtp,
  login,
  verifyLoginOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  me,
  updateMe,
  changePassword,
  deleteAccount
} from '../controllers/authController.js';
import { getSecurity } from '../controllers/securityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.route('/me').get(protect, me).put(protect, updateMe).delete(protect, deleteAccount);
router.put('/change-password', protect, changePassword);
router.get('/security', protect, getSecurity);

export default router;
