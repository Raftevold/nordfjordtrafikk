// E-postvarsling via SMTP.
// Innstillingane blir henta frå admin → Innstillingar → E-postvarsling (lagra i databasen),
// eller frå miljøvariablane SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_TO (env vinn).
// Utan oppsett blir alle innsendingar uansett lagra i admin-innboksane.

const nodemailer = require('nodemailer');
const db = require('./db');

async function getConfig() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      enabled: true,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      source: 'env'
    };
  }
  const cfg = await db.getDoc('mailcfg', null);
  if (cfg && cfg.enabled && cfg.host && cfg.user && cfg.pass) {
    return { ...cfg, port: Number(cfg.port || 587), to: cfg.to || cfg.user, source: 'admin' };
  }
  return null;
}

function transporterFor(cfg) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass }
  });
}

// Varsel til trafikkskulen
async function notify(subject, text, replyTo) {
  const cfg = await getConfig();
  if (!cfg) return false;
  try {
    await transporterFor(cfg).sendMail({
      from: `"Nettsida" <${cfg.user}>`,
      to: cfg.to,
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

// Stadfesting til innsendar (t.d. kurspåmelding)
async function confirmTo(email, subject, text) {
  const cfg = await getConfig();
  if (!cfg || !email) return false;
  try {
    await transporterFor(cfg).sendMail({
      from: `"Nordfjord Trafikk" <${cfg.user}>`,
      to: email, subject, text
    });
    return true;
  } catch (err) {
    console.error('Stadfestings-e-post feila:', err.message);
    return false;
  }
}

// Testmelding frå admin – kastar feil vidare så admin får sjå kva som er gale
async function sendTest() {
  const cfg = await getConfig();
  if (!cfg) throw new Error('E-postvarsling er ikkje aktivert eller manglar innstillingar.');
  await transporterFor(cfg).sendMail({
    from: `"Nettsida (test)" <${cfg.user}>`,
    to: cfg.to,
    subject: 'Testmelding frå nordfjordtrafikk-nettsida',
    text: 'Gratulerer! E-postvarslinga fungerer. Du får no e-post når nokon melder seg på kurs, bestiller opplæring/gåvekort eller sender melding via kontaktskjemaet.'
  });
  return cfg.to;
}

async function isEnabled() { return !!(await getConfig()); }

module.exports = { notify, confirmTo, sendTest, isEnabled };
