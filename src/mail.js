// Valfri e-postvarsling via SMTP. Aktiverast ved å setje miljøvariablane
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS og MAIL_TO (mottakar hos trafikkskulen).
// Utan SMTP-oppsett blir alle innsendingar uansett lagra i admin-innboksen.

const nodemailer = require('nodemailer');

const enabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (enabled) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function notify(subject, text, replyTo) {
  if (!enabled) return false;
  try {
    await transporter.sendMail({
      from: `"Nettsida" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      subject,
      text,
      ...(replyTo ? { replyTo } : {})
    });
    return true;
  } catch (err) {
    console.error('E-postvarsling feila:', err.message);
    return false;
  }
}

// Stadfesting til innsendar (t.d. kurspåmelding) – berre når SMTP er aktivt
async function confirmTo(email, subject, text) {
  if (!enabled || !email) return false;
  try {
    await transporter.sendMail({
      from: `"Nordfjord Trafikk" <${process.env.SMTP_USER}>`,
      to: email, subject, text
    });
    return true;
  } catch (err) {
    console.error('Stadfestings-e-post feila:', err.message);
    return false;
  }
}

module.exports = { enabled, notify, confirmTo };
