import ContactMessage from '../models/ContactMessage.js';
import { sendContactNotificationEmail } from '../utils/email.js';
import { callLLM } from '../utils/llm.js';

// POST /api/public/contact  { name, email, message }
export const submitContact = async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const message = (req.body.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are all required' });
  }
  if (message.length > 4000) {
    return res.status(400).json({ message: 'Message is too long' });
  }

  const doc = await ContactMessage.create({ name, email, message });

  try {
    await sendContactNotificationEmail({ name, email, message });
    doc.emailedOwner = true;
    await doc.save();
  } catch (err) {
    // The message is already safely stored — email delivery is a best-effort convenience,
    // not the source of truth, so a delivery failure here must never fail the request.
    console.error('Contact notification email failed:', err.message);
  }

  res.status(201).json({ message: "Thanks — we'll get back to you soon." });
};

const AUDIT_SYSTEM_PROMPT = `You are DevMind's public "Free Audit" tool — a quick, honest first look at a piece of code for people who haven't signed up yet.

Rules:
- Review the code for real issues: bugs, security problems, bad patterns, missing validation, obvious performance problems.
- Structure: 1-2 sentence overall assessment, then up to 4 concrete findings (what's wrong, why it matters), then one line on what's done well if anything is.
- Be specific and reference actual names from the code. Do not invent issues that aren't there — if the code is genuinely fine, say so.
- This is a teaser, not a full review: keep it tight, and end with one line inviting them to sign up for the full Reviewer agent with project-aware context.
- If no real code was provided (e.g. gibberish or empty), say so plainly instead of guessing.`;

// POST /api/public/audit  { code, language }
// Unauthenticated, rate-limited teaser of the real Reviewer agent, used as a lead-in from
// the landing page's "Free Audit" CTA. Genuinely calls the LLM — no canned/fake output.
export const freeAudit = async (req, res) => {
  const code = (req.body.code || '').trim();
  const language = (req.body.language || '').trim();

  if (!code) return res.status(400).json({ message: 'Paste some code to audit' });
  if (code.length > 6000) return res.status(400).json({ message: 'Please paste 6,000 characters or fewer for the free audit' });

  try {
    const review = await callLLM({
      system: AUDIT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: language ? `Language: ${language}\n\n${code}` : code }],
      maxTokens: 700
    });
    res.json({ review });
  } catch (err) {
    console.error('Free audit failed:', err);
    res.status(500).json({ message: 'Could not run the audit right now. Please try again shortly.' });
  }
};
