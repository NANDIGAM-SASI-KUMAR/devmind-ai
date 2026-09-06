const RESEND_URL = 'https://api.resend.com/emails';

const SUBJECTS = {
  signup: 'Verify your email — DevMind',
  login: 'Your sign-in code — DevMind',
  reset: 'Reset your password — DevMind'
};

const HEADLINES = {
  signup: 'Confirm your email',
  login: 'Your sign-in code',
  reset: 'Reset your password'
};

const otpEmailHtml = (code, purpose) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0B0C10;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0C10;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background-color:#131620;border:1px solid #232733;border-radius:16px;">
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <div style="font-size:18px;font-weight:700;color:#F5F6FA;letter-spacing:-0.01em;">DevMind</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <div style="font-size:22px;font-weight:700;color:#F5F6FA;">${HEADLINES[purpose] || 'Your verification code'}</div>
              <div style="font-size:14px;line-height:1.6;color:#9CA3B0;margin-top:8px;">
                Use the code below to continue. It expires in 5 minutes.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <div style="background-color:#0B0C10;border:1px solid #232733;border-radius:12px;padding:20px;text-align:center;">
                <span style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#818CF8;font-family:'Courier New',monospace;">${code}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <div style="font-size:12px;line-height:1.6;color:#5C6270;">
                If you didn't request this, you can safely ignore this email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const contactEmailHtml = ({ name, email, message }) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0B0C10;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0C10;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background-color:#131620;border:1px solid #232733;border-radius:16px;">
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <div style="font-size:18px;font-weight:700;color:#F5F6FA;letter-spacing:-0.01em;">DevMind</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <div style="font-size:22px;font-weight:700;color:#F5F6FA;">New contact message</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;">
              <div style="font-size:13px;color:#9CA3B0;margin-bottom:4px;">From</div>
              <div style="font-size:14px;color:#F5F6FA;margin-bottom:16px;">${name} &lt;${email}&gt;</div>
              <div style="font-size:13px;color:#9CA3B0;margin-bottom:4px;">Message</div>
              <div style="font-size:14px;line-height:1.6;color:#F5F6FA;white-space:pre-wrap;background-color:#0B0C10;border:1px solid #232733;border-radius:12px;padding:16px;">${message}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const sendContactNotificationEmail = async ({ name, email, message }) => {
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_NOTIFY_EMAIL) {
    throw new Error('Contact notification email is not configured');
  }
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'DevMind <onboarding@resend.dev>',
      to: [process.env.CONTACT_NOTIFY_EMAIL],
      reply_to: email,
      subject: `New contact message from ${name}`,
      html: contactEmailHtml({ name, email, message })
    })
  });
  if (!res.ok) {
    throw new Error(`Resend API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
};

export const sendOtpEmail = async ({ to, code, purpose }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in .env');
  }
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'DevMind <onboarding@resend.dev>',
      to: [to],
      subject: SUBJECTS[purpose] || 'Your verification code',
      html: otpEmailHtml(code, purpose)
    })
  });
  if (!res.ok) {
    throw new Error(`Resend API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
};
