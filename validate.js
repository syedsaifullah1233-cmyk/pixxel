/**
 * lib/validate.js
 * ------------------------------------------------------------------
 * Small, dependency-free helpers for validating and sanitizing the
 * contact form payload before it is used to compose emails.
 * ------------------------------------------------------------------
 */

// RFC-5322-ish "good enough" email pattern (fast, no ReDoS risk).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Removes control characters and trims whitespace from a string.
 * Also caps the length as a defensive measure against payload abuse.
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {string}
 */
function sanitizeString(value, maxLength = 2000) {
  if (typeof value !== 'string') return '';
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // strip control chars (keep \n, \t)
    .trim()
    .slice(0, maxLength);
}

/**
 * Escapes HTML-significant characters so user input can be safely
 * interpolated into the HTML email body without allowing markup/HTML
 * injection into the message the business owner reads.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email);
}

/**
 * Validates and sanitizes the raw request body for the contact form.
 * Returns { valid, errors, data } where `data` contains the cleaned
 * fields, ready to be used for composing emails.
 * @param {object} body
 */
function validateContactPayload(body) {
  const errors = [];

  const name = sanitizeString(body?.name, 100);
  const email = sanitizeString(body?.email, 150);
  const phone = sanitizeString(body?.phone, 30);
  const projectType = sanitizeString(body?.projectType, 60);
  const budget = sanitizeString(body?.budget, 60);
  const subject = sanitizeString(body?.subject, 150);
  const details = sanitizeString(body?.details, 5000);
  const website = sanitizeString(body?.website, 200); // honeypot field

  if (!name) errors.push('Full name is required.');
  if (!email) {
    errors.push('Email is required.');
  } else if (!isValidEmail(email)) {
    errors.push('Please provide a valid email address.');
  }
  if (!details) errors.push('Project description is required.');
  if (details && details.length < 10) errors.push('Project description is too short.');

  return {
    valid: errors.length === 0,
    errors,
    data: { name, email, phone, projectType, budget, subject, details, website }
  };
}

module.exports = {
  sanitizeString,
  escapeHtml,
  isValidEmail,
  validateContactPayload
};
