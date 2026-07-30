/**
 * Prefer EMAIL_WEBHOOK_URL (Google Apps Script) on Railway — SMTP is often blocked.
 * Fallback: Gmail SMTP for local.
 */
const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');
const resolve4 = promisify(dns.resolve4);

async function sendViaWebhook({ to, subject, html }) {
  const url = process.env.EMAIL_WEBHOOK_URL;
  const secret = process.env.EMAIL_WEBHOOK_SECRET || '';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret, to, subject, html, fromName: 'House Design' }),
    redirect: 'follow'
  });

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) { /* ignore */ }

  if (!res.ok || data.error || data.ok === false) {
    throw new Error(data.error || `Webhook email failed (${res.status}): ${text.slice(0, 200)}`);
  }
  console.log('Email sent via webhook →', to);
  return data;
}

async function sendViaSmtp({ to, subject, html }) {
  const { EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Email is not configured. Set EMAIL_WEBHOOK_URL or EMAIL_USER/EMAIL_PASS.');
  }

  let host = 'smtp.gmail.com';
  try {
    const addresses = await resolve4('smtp.gmail.com');
    if (addresses?.[0]) host = addresses[0];
  } catch (_) { /* keep hostname */ }

  const transporter = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    tls: { servername: 'smtp.gmail.com', minVersion: 'TLSv1.2' },
    connectionTimeout: 15000,
    socketTimeout: 15000
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM || `House Design <${EMAIL_USER}>`,
    to,
    subject,
    html
  });
  console.log('Email sent via SMTP:', info.messageId, '→', to);
  return info;
}

module.exports = async function sendEmail({ to, subject, html }) {
  if (process.env.EMAIL_WEBHOOK_URL) {
    return sendViaWebhook({ to, subject, html });
  }
  return sendViaSmtp({ to, subject, html });
};
