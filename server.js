const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const compression = require('compression');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const db = require('./src/db');
const seedContent = require('./src/seed-content');
const publicRoutes = require('./src/routes/public');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // Render ligg bak proxy
app.locals.publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

// Innhaldsbasert versjon for cache-busting av CSS/JS (?v=xxxx i lenkjene)
const fs = require('node:fs');
app.locals.assetV = crypto.createHash('md5').update(
  ['public/css/site.css', 'public/js/site.js', 'public/css/admin.css', 'public/js/admin.js']
    .map((f) => { try { return fs.readFileSync(path.join(__dirname, f)); } catch { return ''; } }).join('')
).digest('hex').slice(0, 8);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Tryggingshovud (utan ekstern avhengigheit)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' https://www.instagram.com; " +
    "frame-src https://www.google.com https://maps.google.com https://consent.google.com https://www.instagram.com; " +
    "connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Statisk innhald med god cache (ingen cache lokalt under utvikling)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: IS_PROD ? '30d' : 0,
  setHeaders(res, filePath) {
    if (IS_PROD && (filePath.endsWith('.css') || filePath.endsWith('.js'))) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Signerte cookie-sesjonar (berre for admin)
app.use(cookieSession({
  name: 'ntsession',
  keys: [process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')],
  maxAge: 8 * 60 * 60 * 1000, // 8 timar
  sameSite: 'lax',
  httpOnly: true,
  secure: IS_PROD
}));

app.use(publicRoutes);
app.use('/admin', adminRoutes);

// 404
app.use(async (req, res) => {
  const settings = await db.getDoc('settings', seedContent.settings);
  res.status(404).render('404', { settings, seo: { title: 'Fann ikkje sida – Nordfjord Trafikk', description: '' }, path: req.path });
});

// Feilhandtering: JSON for API-kall, enkel tekst elles (aldri stacktrace ut)
app.use((err, req, res, next) => {
  console.error('Feil:', err.message);
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Fila er for stor (maks 8 MB).' : 'Noko gjekk gale på serveren.';
  if (req.path.startsWith('/api/') || req.path.includes('/admin/api/')) {
    return res.status(status).json({ ok: false, error: msg });
  }
  res.status(status).send(msg);
});

async function start() {
  await db.init();

  // Så inn startinnhald ved første oppstart (skriv aldri over admin-endringar)
  for (const key of ['settings', 'seo', 'pages', 'prices', 'team', 'classes', 'courseTypes', 'vehicles', 'faq', 'instagram']) {
    const existing = await db.getDoc(key);
    if (existing === null) await db.setDoc(key, seedContent[key]);
  }

  // Admin-brukar: passord frå env eller standard (MÅ endrast etter første innlogging)
  const initialPassword = process.env.ADMIN_PASSWORD || 'kosa-oss-2026';
  await db.ensureAdmin('admin', bcrypt.hashSync(initialPassword, 12));

  // Demo-innhald ved aller første oppstart, så kurspåmeldinga kan visast fram.
  // Vaktflagget gjer at innhaldet IKKJE kjem tilbake om admin slettar det.
  if (!(await db.getDoc('demoSeeded'))) {
    const iso = (daysAhead, time) => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return time ? `${day}T${time}` : day;
    };
    if (!(await db.listCourses(true)).length) {
      await db.createCourse({
        title: 'Trafikalt grunnkurs (DEMO)', type: 'Trafikalt grunnkurs', location: 'Nordfjordeid',
        starts_at: iso(21, '17:00'), ends_at: iso(24),
        sessions: [0, 1, 2, 3].map((i) => ({ date: iso(21 + i), start: '17:00', end: '20:00' })),
        duration: '4 kveldar', capacity: 12, price: 'kr 2 200,-',
        description: 'Dette er eit DØMEKURS lagt inn for å vise korleis kurspåmeldinga fungerer – rediger eller slett det i admin.',
        instructors: [], visible: 1
      });
      await db.createCourse({
        title: 'Førstehjelpskurs (DEMO)', type: 'Førstehjelpskurs', location: 'Stryn',
        starts_at: iso(28, '17:30'), duration: '4 x 45 min', capacity: 16, price: 'kr 950,-',
        description: 'Dette er eit DØMEKURS lagt inn for å vise korleis kurspåmeldinga fungerer – rediger eller slett det i admin.',
        instructors: [], visible: 1
      });
    }
    if (!(await db.listPosts(true)).length) {
      await db.createPost({
        title: 'Velkomen til den nye nettsida vår!',
        body: 'Her på nye nordfjordtrafikk.no kan du melde deg på kurs direkte i kurskalenderen, bestille opplæring i alle lette klassar, sjå oppdaterte prisar og bestille gåvekort – alt frå mobilen.\nUnder «Aktuelt» legg vi ut nyheiter om nye kurs og anna som skjer på trafikkskulen. Følg med!',
        image: '/img/skulebil-foto.webp', visible: 1
      });
    }
    await db.setDoc('demoSeeded', true);
  }

  app.listen(PORT, () => {
    console.log(`Nordfjord Trafikk køyrer på http://localhost:${PORT} (lagring: ${db.usePg ? 'PostgreSQL' : 'SQLite'})`);
  });
}

start().catch((err) => { console.error(err); process.exit(1); });
