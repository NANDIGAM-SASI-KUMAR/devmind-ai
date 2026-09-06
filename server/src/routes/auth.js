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
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/signup', asyncHandler(signup));
router.post('/verify-signup-otp', asyncHandler(verifySignupOtp));
router.post('/login', asyncHandler(login));
router.post('/verify-login-otp', asyncHandler(verifyLoginOtp));
router.post('/resend-otp', asyncHandler(resendOtp));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/verify-reset-otp', asyncHandler(verifyResetOtp));
router.post('/reset-password', asyncHandler(resetPassword));
router.route('/me').get(protect, asyncHandler(me)).put(protect, asyncHandler(updateMe)).delete(protect, asyncHandler(deleteAccount));
router.put('/change-password', protect, asyncHandler(changePassword));
router.get('/security', protect, asyncHandler(getSecurity));

export default router;
