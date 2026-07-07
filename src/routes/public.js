const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const mail = require('../mail');
const seedContent = require('../seed-content');

const router = express.Router();

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'For mange innsendingar. Prøv igjen om litt.' }
});

// Felles side-data
async function base(pageKey) {
  const [settings, seo, pages] = await Promise.all([
    db.getDoc('settings', seedContent.settings),
    db.getDoc('seo', seedContent.seo),
    db.getDoc('pages', seedContent.pages)
  ]);
  return { settings, seo: seo[pageKey] || { title: settings.siteName, description: '' }, pages };
}

const clean = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const isSpam = (req) => !!clean(req.body.website); // honningfelle-felt

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('nn-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      ' kl. ' + d.toLocaleTimeString('nn-NO', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

// ---------- Sider ----------

router.get('/', async (req, res) => {
  const data = await base('home');
  const [team, courses] = await Promise.all([db.getDoc('team', seedContent.team), db.listCourses()]);
  const withCounts = await Promise.all(courses.slice(0, 3).map(async (c) => ({ ...c, taken: await db.countSignups(c.id) })));
  res.render('home', { ...data, team, courses: withCounts, fmtDate, path: '/' });
});

router.get('/om-oss', async (req, res) => {
  const data = await base('om');
  const team = await db.getDoc('team', seedContent.team);
  res.render('om', { ...data, team, path: '/om-oss' });
});

router.get('/trafikkopplaringa', async (req, res) => {
  const data = await base('opplaring');
  res.render('opplaring', { ...data, path: '/trafikkopplaringa' });
});

router.get('/prisar', async (req, res) => {
  const data = await base('prisar');
  const prices = await db.getDoc('prices', seedContent.prices);
  res.render('prisar', { ...data, prices, path: '/prisar' });
});

router.get('/kurs', async (req, res) => {
  const data = await base('kurs');
  const courses = await db.listCourses();
  const withCounts = await Promise.all(courses.map(async (c) => ({ ...c, taken: await db.countSignups(c.id) })));
  res.render('kurs', { ...data, courses: withCounts, fmtDate, valgt: clean(req.query.avdeling, 40), path: '/kurs' });
});

router.get('/kurs/:id(\\d+)', async (req, res, next) => {
  const course = await db.getCourse(Number(req.params.id));
  if (!course || !course.visible) return next();
  const data = await base('kurs');
  const taken = await db.countSignups(course.id);
  res.render('kurs-detalj', {
    ...data,
    seo: { title: `${course.title} (${course.location}) – Nordfjord Trafikk`, description: `Meld deg på ${course.title} hos Nordfjord Trafikk, avdeling ${course.location}.` },
    course, taken, fmtDate, path: '/kurs'
  });
});

router.get('/pamelding', async (req, res) => {
  const data = await base('pamelding');
  const [classes, settings] = await Promise.all([db.getDoc('classes', seedContent.classes), db.getDoc('settings', seedContent.settings)]);
  res.render('pamelding', { ...data, classes, locations: settings.locations, path: '/pamelding' });
});

router.get('/gavekort', async (req, res) => {
  const data = await base('gavekort');
  res.render('gavekort', { ...data, path: '/gavekort' });
});

router.get('/kontakt', async (req, res) => {
  const data = await base('kontakt');
  res.render('kontakt', { ...data, path: '/kontakt' });
});

router.get('/personvern', async (req, res) => {
  const data = await base('personvern');
  res.render('personvern', { ...data, mailEnabled: mail.enabled, path: '/personvern' });
});

// ---------- Skjema (API) ----------

router.post('/api/signup', formLimiter, async (req, res) => {
  if (isSpam(req)) return res.json({ ok: true }); // stille avvising av bottar
  const courseId = Number(req.body.course_id);
  const course = await db.getCourse(courseId);
  if (!course || !course.visible) return res.status(400).json({ ok: false, error: 'Kurset finst ikkje lenger.' });
  const name = clean(req.body.name, 120);
  const phone = clean(req.body.phone, 40);
  const email = clean(req.body.email, 160);
  if (!name || !phone) return res.status(400).json({ ok: false, error: 'Namn og telefonnummer må fyllast ut.' });
  const taken = await db.countSignups(courseId);
  if (course.capacity > 0 && taken >= course.capacity) {
    return res.status(400).json({ ok: false, error: 'Kurset er dessverre fullt. Ta kontakt, så set vi deg på venteliste!' });
  }
  await db.createSignup({
    course_id: courseId, name, phone, email,
    birthdate: clean(req.body.birthdate, 20), note: clean(req.body.note, 1000)
  });
  mail.notify(`Ny kurspåmelding: ${course.title} (${course.location})`,
    `${name} har meldt seg på «${course.title}» ${course.starts_at}.\nTelefon: ${phone}\nE-post: ${email}\nSjå alle påmeldingar i admin.`, email);
  mail.confirmTo(email, `Påmelding motteken – ${course.title}`,
    `Hei ${name}!\n\nVi har motteke påmeldinga di til «${course.title}» (${course.location}).\nVi tek kontakt om noko endrar seg.\n\nHelsing Nordfjord Trafikk`);
  res.json({ ok: true });
});

router.post('/api/request', formLimiter, async (req, res) => {
  if (isSpam(req)) return res.json({ ok: true });
  const name = clean(req.body.name, 120);
  const phone = clean(req.body.phone, 40);
  if (!name || !phone) return res.status(400).json({ ok: false, error: 'Namn og telefonnummer må fyllast ut.' });
  await db.createRequest({
    name, phone,
    birthdate: clean(req.body.birthdate, 20),
    email: clean(req.body.email, 160),
    klass: clean(req.body.klass, 80),
    location: clean(req.body.location, 60),
    note: clean(req.body.note, 1000)
  });
  mail.notify('Ny påmelding til opplæring',
    `${name} ønskjer opplæring (${clean(req.body.klass, 80)}) ved avdeling ${clean(req.body.location, 60)}.\nTelefon: ${phone}\nE-post: ${clean(req.body.email, 160)}`, clean(req.body.email, 160));
  res.json({ ok: true });
});

router.post('/api/giftcard', formLimiter, async (req, res) => {
  if (isSpam(req)) return res.json({ ok: true });
  const buyer_name = clean(req.body.buyer_name, 120);
  const buyer_email = clean(req.body.buyer_email, 160);
  if (!buyer_name || !buyer_email) return res.status(400).json({ ok: false, error: 'Namn og e-post må fyllast ut.' });
  await db.createGiftcard({
    buyer_name, buyer_email,
    buyer_phone: clean(req.body.buyer_phone, 40),
    value: clean(req.body.value, 40),
    recipient: clean(req.body.recipient, 400)
  });
  mail.notify('Ny gåvekort-bestilling', `${buyer_name} har bestilt gåvekort (verdi: ${clean(req.body.value, 40)}).\nE-post: ${buyer_email}\nTelefon: ${clean(req.body.buyer_phone, 40)}\nMottakar: ${clean(req.body.recipient, 400)}`, buyer_email);
  res.json({ ok: true });
});

router.post('/api/contact', formLimiter, async (req, res) => {
  if (isSpam(req)) return res.json({ ok: true });
  const name = clean(req.body.name, 120);
  const body = clean(req.body.message, 3000);
  if (!name || !body) return res.status(400).json({ ok: false, error: 'Namn og melding må fyllast ut.' });
  await db.createMessage({
    name, body,
    email: clean(req.body.email, 160),
    phone: clean(req.body.phone, 40),
    subject: clean(req.body.subject, 200)
  });
  mail.notify(`Ny melding frå nettsida: ${clean(req.body.subject, 200) || '(utan emne)'}`,
    `Frå: ${name}\nE-post: ${clean(req.body.email, 160)}\nTelefon: ${clean(req.body.phone, 40)}\n\n${body}`, clean(req.body.email, 160));
  res.json({ ok: true });
});

// ---------- Opplasta bilete ----------
router.get('/media/:id(\\d+)', async (req, res) => {
  const img = await db.getImage(Number(req.params.id));
  if (!img) return res.status(404).end();
  res.setHeader('Content-Type', img.mime);
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.end(Buffer.from(img.data));
});

// ---------- SEO ----------

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${baseUrl(req)}/sitemap.xml\n`);
});

router.get('/sitemap.xml', async (req, res) => {
  const urls = ['/', '/om-oss', '/trafikkopplaringa', '/prisar', '/kurs', '/pamelding', '/gavekort', '/kontakt', '/personvern'];
  const courses = await db.listCourses();
  for (const c of courses) urls.push(`/kurs/${c.id}`);
  const body = urls.map((u) => `  <url><loc>${baseUrl(req)}${u}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
});

function baseUrl(req) {
  return process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

module.exports = router;
