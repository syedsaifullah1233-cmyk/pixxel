# Pixel Aura — Website + Serverless Contact Form Backend

This project pairs the existing Pixel Aura frontend (unchanged design,
animations, and layout) with a production-ready backend built entirely
as **Vercel Serverless Functions** — no Express server, no long-running
process.

## Folder structure

```
.
├── api/
│   └── send-email.js       # Serverless Function: POST /api/send-email
├── lib/
│   ├── validate.js          # Input validation + sanitization
│   ├── rateLimit.js         # Best-effort in-memory rate limiting
│   └── mailer.js            # Nodemailer transport + email templates
├── index.html                # Frontend (form updated with full field set)
├── style.css                 # Unchanged design, small additive rules only
├── script.js                 # Contact form now submits via fetch()
├── package.json
├── vercel.json                # Function config + API security headers
├── .env.example
└── .gitignore
```

## 1. Install dependencies

```bash
npm install
```

This installs the only runtime dependency: `nodemailer`.

## 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Fill in your real SMTP credentials in `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username@example.com
SMTP_PASS=your-smtp-app-password
CONTACT_RECEIVER_EMAIL=aurapixeltech@gmail.com
```

**If using Gmail SMTP:** you must enable 2-Step Verification on the
Google account, then generate an **App Password** at
https://myaccount.google.com/apppasswords and use that as `SMTP_PASS`
(your normal Gmail password will not work with SMTP).

**Never commit `.env`** — it's already excluded via `.gitignore`.

## 3. Run locally

The Vercel CLI runs both the static frontend and the serverless
function together, exactly as they'll run in production:

```bash
npm install -g vercel   # one-time global install
vercel dev
```

This starts a local server (typically `http://localhost:3000`) where
the same `index.html` calls `/api/send-email` — no separate backend
process to manage.

## 4. Deploy to Vercel

### Option A — Vercel CLI
```bash
vercel        # first deploy, follow the prompts
vercel --prod # promote to production
```

### Option B — Git integration
1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. Import the repo in the [Vercel dashboard](https://vercel.com/new).
3. Vercel auto-detects `api/send-email.js` as a Serverless Function —
   no build configuration needed.

### Set environment variables on Vercel
In your Vercel Project → **Settings → Environment Variables**, add the
same keys from `.env.example` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
`SMTP_USER`, `SMTP_PASS`, `CONTACT_RECEIVER_EMAIL`) for the
**Production** (and Preview/Development, if desired) environments,
then redeploy.

## How the contact form works

1. Visitor fills in the form (`index.html`) — required: Full Name,
   Email, Project Description. Optional: Phone, Project Type, Budget,
   Subject.
2. `script.js` validates required fields + email format client-side,
   disables the submit button, shows a "Sending…" state, and POSTs
   JSON to `/api/send-email`.
3. `api/send-email.js`:
   - Rejects non-POST requests.
   - Applies a per-IP rate limit (5 submissions / 15 min, best-effort
     — see the note in `lib/rateLimit.js` about serverless statelessness).
   - Re-validates and sanitizes every field server-side (never trusts
     the client).
   - Checks a hidden honeypot field (`website`) — if filled, the
     request is silently treated as spam and no email is sent.
   - Sends a formatted notification email to `CONTACT_RECEIVER_EMAIL`.
   - Sends an auto-reply confirmation email to the visitor.
   - Returns `{ success: true/false, message }` as JSON.
4. `script.js` reads the JSON response and shows a success or error
   message inline in the form (`#formStatus`) — no page reload.

## Security notes & production hardening

- **Rate limiting**: the built-in limiter is in-memory and best-effort
  because Vercel Functions are stateless across cold starts and
  concurrent instances. For strict, globally consistent limits, wire
  in [Upstash Redis](https://vercel.com/integrations/upstash) (has a
  one-click Vercel integration) or Vercel KV, and swap the
  implementation in `lib/rateLimit.js`.
- **Spam protection**: a hidden honeypot field catches basic bots. For
  stronger protection, consider adding Cloudflare Turnstile or Google
  reCAPTCHA v3 on the frontend and verifying the token server-side in
  `api/send-email.js`.
- **Sanitization**: all fields are trimmed, control-characters are
  stripped, length-capped, and HTML-escaped before being interpolated
  into email HTML — this prevents HTML/markup injection into the
  emails you receive.
- **Secrets**: all credentials come from environment variables only;
  nothing is hardcoded in source.
