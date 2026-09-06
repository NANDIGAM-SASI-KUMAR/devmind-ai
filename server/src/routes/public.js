import express from 'express';
import { submitContact, freeAudit } from '../controllers/publicController.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// No auth — these are the landing page's public-facing endpoints.
router.post('/contact', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), submitContact);
router.post('/audit', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), freeAudit);

export default router;
