const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('../db');
const seedContent = require('../seed-content');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: 'For mange innloggingsforsøk. Vent 15 minutt.' }
});

// Enkel CSRF-vern: skrivande kall må kome frå same opphav
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin') || req.get('referer') || '';
    const host = req.get('host');
    if (origin && host && !origin.includes(host)) {
      return res.status(403).json({ ok: false, error: 'Ugyldig opphav.' });
    }
  }
  next();
});

const requireAuth = (req, res, next) => {
  if (req.session?.admin) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ ok: false, error: 'Ikkje innlogga.' });
  return res.redirect('/admin');
};

// ---------- Innlogging ----------

router.get('/', async (req, res) => {
  if (!req.session?.admin) return res.render('admin/login', { error: null });
  const settings = await db.getDoc('settings', seedContent.settings);
  res.render('admin/app', { settings, username: req.session.admin });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const admin = await db.getAdmin(String(username || '').trim().toLowerCase());
  if (!admin || !bcrypt.compareSync(String(password || ''), admin.pass_hash)) {
    return res.status(401).render('admin/login', { error: 'Feil brukarnamn eller passord.' });
  }
  req.session.admin = admin.username;
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/admin');
});

router.use(requireAuth);

router.post('/api/password', async (req, res) => {
  const { current, next } = req.body;
  const admin = await db.getAdmin(req.session.admin);
  if (!bcrypt.compareSync(String(current || ''), admin.pass_hash)) {
    return res.status(400).json({ ok: false, error: 'Noverande passord er feil.' });
  }
  if (String(next || '').length < 10) {
    return res.status(400).json({ ok: false, error: 'Nytt passord må ha minst 10 teikn.' });
  }
  await db.setAdminPassword(admin.username, bcrypt.hashSync(String(next), 12));
  res.json({ ok: true });
});

// ---------- Oversikt ----------

router.get('/api/overview', async (req, res) => {
  const counts = await db.counts();
  const courses = await db.listCourses(true);
  const upcoming = [];
  for (const c of courses) {
    if (c.starts_at >= new Date().toISOString().slice(0, 10)) {
      upcoming.push({ ...c, taken: await db.countSignups(c.id) });
    }
    if (upcoming.length >= 6) break;
  }
  res.json({ ok: true, counts, upcoming });
});

// ---------- Innhald (JSON-dokument) ----------

const EDITABLE_KEYS = ['settings', 'seo', 'pages', 'prices', 'team', 'classes', 'courseTypes'];

router.get('/api/content/:key', async (req, res) => {
  const { key } = req.params;
  if (!EDITABLE_KEYS.includes(key)) return res.status(404).json({ ok: false });
  res.json({ ok: true, value: await db.getDoc(key, seedContent[key]) });
});

router.put('/api/content/:key', async (req, res) => {
  const { key } = req.params;
  if (!EDITABLE_KEYS.includes(key)) return res.status(404).json({ ok: false });
  await db.setDoc(key, req.body.value);
  res.json({ ok: true });
});

// ---------- Kurs ----------

router.get('/api/courses', async (req, res) => {
  const courses = await db.listCourses(true);
  const out = [];
  for (const c of courses) out.push({ ...c, taken: await db.countSignups(c.id) });
  res.json({ ok: true, courses: out });
});

router.post('/api/courses', async (req, res) => {
  const c = req.body;
  if (!c.title || !c.location || !c.starts_at) return res.status(400).json({ ok: false, error: 'Tittel, avdeling og dato er påkravd.' });
  const id = await db.createCourse(c);
  res.json({ ok: true, id });
});

router.put('/api/courses/:id(\\d+)', async (req, res) => {
  await db.updateCourse(Number(req.params.id), req.body);
  res.json({ ok: true });
});

router.delete('/api/courses/:id(\\d+)', async (req, res) => {
  await db.deleteCourse(Number(req.params.id));
  res.json({ ok: true });
});

router.get('/api/courses/:id(\\d+)/signups', async (req, res) => {
  res.json({ ok: true, signups: await db.listSignups(Number(req.params.id)) });
});

router.get('/api/courses/:id(\\d+)/signups.csv', async (req, res) => {
  const course = await db.getCourse(Number(req.params.id));
  const rows = await db.listSignups(Number(req.params.id));
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const csv = ['Namn;Fødselsdato;E-post;Telefon;Merknad;Status;Registrert']
    .concat(rows.map((r) => [r.name, r.birthdate, r.email, r.phone, r.note, r.status, r.created_at].map(esc).join(';')))
    .join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="paameldingar-kurs-${course ? course.id : 'x'}.csv"`);
  res.send('﻿' + csv);
});

// ---------- Lister (påmeldingar/førespurnadar/gåvekort/meldingar) ----------

const listMap = {
  signups: { list: () => db.listSignups(), status: db.updateSignupStatus, del: db.deleteSignup },
  requests: { list: db.listRequests, status: db.updateRequestStatus, del: db.deleteRequest },
  giftcards: { list: db.listGiftcards, status: db.updateGiftcardStatus, del: db.deleteGiftcard },
  messages: { list: db.listMessages, status: db.updateMessageStatus, del: db.deleteMessage }
};

router.get('/api/:kind(signups|requests|giftcards|messages)', async (req, res) => {
  res.json({ ok: true, items: await listMap[req.params.kind].list() });
});

router.patch('/api/:kind(signups|requests|giftcards|messages)/:id(\\d+)', async (req, res) => {
  const status = String(req.body.status || '').slice(0, 30);
  await listMap[req.params.kind].status(Number(req.params.id), status);
  res.json({ ok: true });
});

router.delete('/api/:kind(signups|requests|giftcards|messages)/:id(\\d+)', async (req, res) => {
  await listMap[req.params.kind].del(Number(req.params.id));
  res.json({ ok: true });
});

// ---------- Bilete ----------

router.get('/api/images', async (req, res) => {
  res.json({ ok: true, images: await db.listImages() });
});

router.post('/api/images', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'Ingen fil motteken.' });
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(req.file.mimetype)) {
    return res.status(400).json({ ok: false, error: 'Berre biletfiler (jpg/png/webp/gif/avif).' });
  }
  let data = req.file.buffer;
  let mime = req.file.mimetype;
  try {
    const sharp = require('sharp');
    data = await sharp(req.file.buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    mime = 'image/webp';
  } catch (err) {
    console.error('Biletkomprimering feila, lagrar original:', err.message);
  }
  const id = await db.saveImage(req.file.originalname, mime, data);
  res.json({ ok: true, id, url: `/media/${id}` });
});

router.delete('/api/images/:id(\\d+)', async (req, res) => {
  await db.deleteImage(Number(req.params.id));
  res.json({ ok: true });
});

// ---------- Sikkerheitskopi ----------

router.get('/api/backup', async (req, res) => {
  const dump = { exported_at: new Date().toISOString(), content: {}, courses: await db.listCourses(true), signups: await db.listSignups(), requests: await db.listRequests(), giftcards: await db.listGiftcards(), messages: await db.listMessages() };
  for (const key of EDITABLE_KEYS) dump.content[key] = await db.getDoc(key, seedContent[key]);
  res.setHeader('Content-Disposition', `attachment; filename="nordfjordtrafikk-backup-${dump.exported_at.slice(0, 10)}.json"`);
  res.json(dump);
});

router.post('/api/restore', async (req, res) => {
  const dump = req.body;
  if (!dump || typeof dump.content !== 'object') return res.status(400).json({ ok: false, error: 'Ugyldig backupfil.' });
  for (const key of EDITABLE_KEYS) {
    if (dump.content[key] !== undefined) await db.setDoc(key, dump.content[key]);
  }
  res.json({ ok: true, note: 'Innhald gjenoppretta. Kurs/påmeldingar blir ikkje overskrivne av gjenoppretting.' });
});

module.exports = router;
