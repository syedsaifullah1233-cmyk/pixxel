/**
 * api/send-email.js
 * ------------------------------------------------------------------
 * Vercel Serverless Function (Node.js runtime).
 * Handles POST requests from the Pixel Aura contact form:
 *   1. Validates the HTTP method.
 *   2. Applies a best-effort per-IP rate limit.
 *   3. Validates & sanitizes the submitted fields.
 *   4. Rejects spam via a honeypot field.
 *   5. Sends a notification email to the business + a confirmation
 *      email to the visitor, via Nodemailer/SMTP.
 *   6. Returns a clean JSON response for the frontend to render.
 *
 * This file deploys automatically as `/api/send-email` on Vercel —
 * no extra configuration is required beyond the environment
 * variables listed in .env.example.
 * ------------------------------------------------------------------
 */

const { validateContactPayload } = require('../lib/validate');
const { checkRateLimit, getClientIp } = require('../lib/rateLimit');
const { sendOwnerNotification, sendUserConfirmation } = require('../lib/mailer');

module.exports = async function handler(req, res) {
  // 1. Only allow POST — reject everything else explicitly.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    // 2. Best-effort rate limiting per client IP (see lib/rateLimit.js
    // for limitations of in-memory rate limiting on serverless).
    const clientIp = getClientIp(req);
    const { allowed, retryAfterSeconds } = checkRateLimit(clientIp);

    if (!allowed) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: `Too many submissions. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`
      });
    }

    // 3. Validate & sanitize the incoming payload.
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { valid, errors, data } = validateContactPayload(body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid submission.',
        errors
      });
    }

    // 4. Honeypot anti-spam check. Real visitors never see or fill
    // this field (hidden via CSS); bots that auto-fill every input
    // will trip it. We return a generic "success" so bots don't
    // learn the field is being checked, but we never send email.
    if (data.website) {
      return res.status(200).json({
        success: true,
        message: 'Thanks! Your message has been received.'
      });
    }

    // 5. Send both emails. If the owner notification fails, we treat
    // the whole submission as failed (that's the email that matters
    // most for the business). The confirmation email failing is
    // logged but does not fail the request, since the lead was
    // already captured.
    await sendOwnerNotification(data);

    try {
      await sendUserConfirmation(data);
    } catch (confirmationError) {
      console.error('Confirmation email failed to send:', confirmationError);
    }

    // 6. Success response for the frontend.
    return res.status(200).json({
      success: true,
      message: "Thanks! Your project details were sent — we'll be in touch shortly."
    });
  } catch (error) {
    console.error('Contact form submission failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while sending your message. Please try again shortly.'
    });
  }
};
