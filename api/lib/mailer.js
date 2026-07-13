/**
 * lib/mailer.js
 * ------------------------------------------------------------------
 * Builds a Nodemailer SMTP transport from environment variables, and
 * exposes helpers to send the two emails required by the contact
 * form: (1) the notification email to Pixel Aura, and (2) the
 * auto-reply confirmation email to the visitor.
 *
 * All credentials come from environment variables — nothing is ever
 * hardcoded. See .env.example for the full list of required vars.
 * ------------------------------------------------------------------
 */

const nodemailer = require('nodemailer');
const { escapeHtml } = require('./validate');

let cachedTransporter = null;

/**
 * Lazily creates (and caches, per warm instance) the SMTP transporter.
 * @returns {import('nodemailer').Transporter}
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP environment variables are not fully configured.');
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true', // true for port 465, false for 587/25 (STARTTLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return cachedTransporter;
}

/**
 * Builds the HTML + text body for the internal notification email
 * sent to the Pixel Aura team.
 */
function buildOwnerNotification(data) {
  const { name, email, phone, projectType, budget, subject, details } = data;

  const rows = [
    ['Full Name', name],
    ['Email', email],
    ['Phone', phone || '—'],
    ['Project Type', projectType || '—'],
    ['Budget', budget || '—'],
    ['Subject', subject || '—']
  ];

  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;color:#8a93a6;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;color:#0f1420;font-size:14px;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e6e9f2;">
      <div style="background:#0f1420;padding:20px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:.5px;">New Project Inquiry — Pixel Aura</span>
      </div>
      <div style="padding:20px 24px;">
        <table style="width:100%;border-collapse:collapse;">
          ${htmlRows}
        </table>
        <div style="margin-top:16px;">
          <p style="color:#8a93a6;font-size:13px;margin:0 0 6px;">Project Description</p>
          <p style="color:#0f1420;font-size:14px;white-space:pre-wrap;line-height:1.5;margin:0;">${escapeHtml(details)}</p>
        </div>
      </div>
      <div style="padding:14px 24px;background:#f4f6fb;color:#8a93a6;font-size:12px;">
        Sent automatically from the Pixel Aura website contact form.
      </div>
    </div>
  </div>`;

  const text = [
    'New Project Inquiry — Pixel Aura',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Project Description:',
    details
  ].join('\n');

  return { html, text };
}

/**
 * Builds the HTML + text body for the auto-reply confirmation email
 * sent back to the visitor who submitted the form.
 */
function buildUserConfirmation(data) {
  const { name } = data;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e6e9f2;">
      <div style="background:#0f1420;padding:20px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:.5px;">PIXEL<span style="color:#2e9bff;">AURA</span></span>
      </div>
      <div style="padding:24px;">
        <p style="color:#0f1420;font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
        <p style="color:#0f1420;font-size:15px;line-height:1.6;margin:0 0 12px;">
          Thanks for reaching out to Pixel Aura! We've received your project details and
          our team will review them and get back to you shortly.
        </p>
        <p style="color:#0f1420;font-size:15px;line-height:1.6;margin:0 0 12px;">
          If your inquiry is urgent, feel free to reply directly to this email.
        </p>
        <p style="color:#0f1420;font-size:15px;line-height:1.6;margin:24px 0 0;">
          — The Pixel Aura Team
        </p>
      </div>
      <div style="padding:14px 24px;background:#f4f6fb;color:#8a93a6;font-size:12px;">
        This is an automated confirmation. No further action is needed from you right now.
      </div>
    </div>
  </div>`;

  const text = [
    `Hi ${name},`,
    '',
    "Thanks for reaching out to Pixel Aura! We've received your project details and",
    'our team will review them and get back to you shortly.',
    '',
    'If your inquiry is urgent, feel free to reply directly to this email.',
    '',
    '— The Pixel Aura Team'
  ].join('\n');

  return { html, text };
}

/**
 * Sends the internal notification email to the business inbox.
 * @param {object} data - sanitized contact form data
 */
async function sendOwnerNotification(data) {
  const transporter = getTransporter();
  const { html, text } = buildOwnerNotification(data);
  const receiver = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"Pixel Aura Website" <${process.env.SMTP_USER}>`,
    to: receiver,
    replyTo: data.email,
    subject: `New Project Inquiry — ${data.name}${data.projectType ? ` (${data.projectType})` : ''}`,
    text,
    html
  });
}

/**
 * Sends the auto-reply confirmation email to the visitor.
 * @param {object} data - sanitized contact form data
 */
async function sendUserConfirmation(data) {
  const transporter = getTransporter();
  const { html, text } = buildUserConfirmation(data);

  await transporter.sendMail({
    from: `"Pixel Aura" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: 'Thanks for contacting Pixel Aura',
    text,
    html
  });
}

module.exports = { sendOwnerNotification, sendUserConfirmation };
