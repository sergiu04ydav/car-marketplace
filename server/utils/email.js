const nodemailer = require('nodemailer');

const APP_NAME = process.env.APP_NAME || 'MyApp';
const ACCENT_COLOR = process.env.EMAIL_ACCENT_COLOR || '#6366f1'; // indigo default

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send a generic email.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || APP_NAME}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  });

  console.log(`Email sent to ${to} — Message ID: ${info.messageId}`);
  return info;
};

/* ── Email templates ───────────────────────────────────────── */

const baseEmailWrapper = (title, bodyContent) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
      .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: ${ACCENT_COLOR}; padding: 32px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
      .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
      .body { padding: 32px; }
      .body p { color: #555; line-height: 1.7; font-size: 15px; margin: 0 0 14px; }
      .btn { display: inline-block; background: ${ACCENT_COLOR}; color: #fff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 0 20px; }
      .note { font-size: 12.5px; color: #999; border-top: 1px solid #eee; padding-top: 18px; margin-top: 4px; }
      .footer { text-align: center; padding: 16px 32px; font-size: 12px; color: #bbb; background: #fafafa; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>${APP_NAME}</h1>
        <p>${title}</p>
      </div>
      <div class="body">${bodyContent}</div>
      <div class="footer">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</div>
    </div>
  </body>
  </html>
`;

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = baseEmailWrapper('Password Reset Request', `
    <p>Hi <strong>${user.username}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to set a new one:</p>
    <div style="text-align:center">
      <a class="btn" href="${resetURL}">Reset My Password</a>
    </div>
    <p>This link is valid for <strong>10 minutes</strong>. If you didn't request this, you can safely ignore it.</p>
    <p class="note">
      If the button doesn't work, copy and paste this URL into your browser:<br />
      <a href="${resetURL}" style="color:${ACCENT_COLOR};word-break:break-all">${resetURL}</a>
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `Reset your ${APP_NAME} password (valid 10 min)`,
    html,
  });
};

const sendEmailVerificationEmail = async (user, verificationToken) => {
  const verifyURL = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  const html = baseEmailWrapper('Verify your email address', `
    <p>Hi <strong>${user.username}</strong>, welcome to ${APP_NAME}! 🎉</p>
    <p>Please verify your email address to activate your account:</p>
    <div style="text-align:center">
      <a class="btn" href="${verifyURL}">Verify Email Address</a>
    </div>
    <p>This link is valid for <strong>24 hours</strong>.</p>
    <p class="note">
      If the button doesn't work, copy and paste:<br />
      <a href="${verifyURL}" style="color:${ACCENT_COLOR};word-break:break-all">${verifyURL}</a>
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: `Verify your ${APP_NAME} email address`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
};
