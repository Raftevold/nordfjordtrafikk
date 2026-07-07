// Lagringslag med to drivarar:
//  - PostgreSQL (Render) når DATABASE_URL er sett → varig lagring
//  - better-sqlite3 lokalt (fil i data/) elles
// Same API uansett drivar. Alle funksjonar er async.

const path = require('node:path');
const fs = require('node:fs');

const usePg = !!process.env.DATABASE_URL;

const TABLES = `
CREATE TABLE IF NOT EXISTS content (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS images (id {ID}, name TEXT NOT NULL, mime TEXT NOT NULL, data {BLOB} NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS courses (id {ID}, title TEXT NOT NULL, type TEXT NOT NULL DEFAULT '', location TEXT NOT NULL, starts_at TEXT NOT NULL, duration TEXT NOT NULL DEFAULT '', capacity INTEGER NOT NULL DEFAULT 0, price TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', visible INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS signups (id {ID}, course_id INTEGER NOT NULL, name TEXT NOT NULL, birthdate TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'ny', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS requests (id {ID}, name TEXT NOT NULL, birthdate TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', klass TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'ny', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS giftcards (id {ID}, buyer_name TEXT NOT NULL, buyer_email TEXT NOT NULL DEFAULT '', buyer_phone TEXT NOT NULL DEFAULT '', value TEXT NOT NULL DEFAULT '', recipient TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'ny', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS messages (id {ID}, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'ny', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admins (id {ID}, username TEXT UNIQUE NOT NULL, pass_hash TEXT NOT NULL);
`;

let driver;

if (usePg) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  // '?'-plasshaldarar → $1, $2 ...
  const q = (sql, params = []) => {
    let i = 0;
    const text = sql.replace(/\?/g, () => `$${++i}`);
    return pool.query(text, params);
  };
  driver = {
    async init() {
      const ddl = TABLES.replaceAll('{ID}', 'SERIAL PRIMARY KEY').replaceAll('{BLOB}', 'BYTEA');
      for (const stmt of ddl.split(';').map(s => s.trim()).filter(Boolean)) await pool.query(stmt);
    },
    async all(sql, params) { return (await q(sql, params)).rows; },
    async get(sql, params) { return (await q(sql, params)).rows[0]; },
    async run(sql, params) {
      if (/^\s*insert/i.test(sql)) {
        const r = await q(sql + ' RETURNING id', params);
        return { lastID: r.rows[0]?.id };
      }
      const r = await q(sql, params);
      return { changes: r.rowCount };
    }
  };
} else {
  const Database = require('better-sqlite3');
  const dir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new Database(path.join(dir, 'site.db'));
  sqlite.pragma('journal_mode = WAL');
  driver = {
    async init() {
      const ddl = TABLES.replaceAll('{ID}', 'INTEGER PRIMARY KEY AUTOINCREMENT').replaceAll('{BLOB}', 'BLOB');
      sqlite.exec(ddl);
    },
    async all(sql, params = []) { return sqlite.prepare(sql).all(...params); },
    async get(sql, params = []) { return sqlite.prepare(sql).get(...params); },
    async run(sql, params = []) {
      const r = sqlite.prepare(sql).run(...params);
      return { lastID: Number(r.lastInsertRowid), changes: r.changes };
    }
  };
}

const now = () => new Date().toISOString();

const db = {
  usePg,
  init: () => driver.init(),

  // --- Innhald (JSON-dokument) ---
  async getDoc(key, fallback = null) {
    const row = await driver.get('SELECT value FROM content WHERE key = ?', [key]);
    return row ? JSON.parse(row.value) : fallback;
  },
  async setDoc(key, value) {
    const json = JSON.stringify(value);
    if (usePg) {
      await driver.run('INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, json]);
    } else {
      await driver.run('INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, json]);
    }
  },

  // --- Bilete ---
  async saveImage(name, mime, data) {
    const r = await driver.run('INSERT INTO images (name, mime, data, created_at) VALUES (?, ?, ?, ?)', [name, mime, data, now()]);
    return r.lastID;
  },
  getImage: (id) => driver.get('SELECT * FROM images WHERE id = ?', [id]),
  listImages: () => driver.all('SELECT id, name, mime, created_at FROM images ORDER BY id DESC'),
  deleteImage: (id) => driver.run('DELETE FROM images WHERE id = ?', [id]),

  // --- Kurs ---
  listCourses: (all = false) => driver.all(
    `SELECT * FROM courses ${all ? '' : "WHERE visible = 1 AND starts_at >= ?"} ORDER BY starts_at ASC`,
    all ? [] : [now().slice(0, 10)]
  ),
  getCourse: (id) => driver.get('SELECT * FROM courses WHERE id = ?', [id]),
  async createCourse(c) {
    const r = await driver.run(
      'INSERT INTO courses (title, type, location, starts_at, duration, capacity, price, description, visible, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [c.title, c.type || '', c.location, c.starts_at, c.duration || '', c.capacity | 0, c.price || '', c.description || '', c.visible ? 1 : 0, now()]
    );
    return r.lastID;
  },
  updateCourse: (id, c) => driver.run(
    'UPDATE courses SET title=?, type=?, location=?, starts_at=?, duration=?, capacity=?, price=?, description=?, visible=? WHERE id=?',
    [c.title, c.type || '', c.location, c.starts_at, c.duration || '', c.capacity | 0, c.price || '', c.description || '', c.visible ? 1 : 0, id]
  ),
  deleteCourse: async (id) => {
    await driver.run('DELETE FROM signups WHERE course_id = ?', [id]);
    return driver.run('DELETE FROM courses WHERE id = ?', [id]);
  },

  // --- Kurspåmeldingar ---
  async createSignup(s) {
    const r = await driver.run(
      'INSERT INTO signups (course_id, name, birthdate, email, phone, note, status, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [s.course_id, s.name, s.birthdate || '', s.email || '', s.phone || '', s.note || '', 'ny', now()]
    );
    return r.lastID;
  },
  listSignups: (courseId) => courseId
    ? driver.all('SELECT * FROM signups WHERE course_id = ? ORDER BY created_at ASC', [courseId])
    : driver.all('SELECT * FROM signups ORDER BY created_at DESC'),
  countSignups: async (courseId) => {
    const r = await driver.get("SELECT COUNT(*) AS n FROM signups WHERE course_id = ? AND status != 'avmeldt'", [courseId]);
    return Number(r?.n ?? 0);
  },
  updateSignupStatus: (id, status) => driver.run('UPDATE signups SET status = ? WHERE id = ?', [status, id]),
  deleteSignup: (id) => driver.run('DELETE FROM signups WHERE id = ?', [id]),

  // --- Førespurnadar om opplæring ---
  async createRequest(s) {
    const r = await driver.run(
      'INSERT INTO requests (name, birthdate, email, phone, klass, location, note, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [s.name, s.birthdate || '', s.email || '', s.phone || '', s.klass || '', s.location || '', s.note || '', 'ny', now()]
    );
    return r.lastID;
  },
  listRequests: () => driver.all('SELECT * FROM requests ORDER BY created_at DESC'),
  updateRequestStatus: (id, status) => driver.run('UPDATE requests SET status = ? WHERE id = ?', [status, id]),
  deleteRequest: (id) => driver.run('DELETE FROM requests WHERE id = ?', [id]),

  // --- Gåvekort ---
  async createGiftcard(g) {
    const r = await driver.run(
      'INSERT INTO giftcards (buyer_name, buyer_email, buyer_phone, value, recipient, status, created_at) VALUES (?,?,?,?,?,?,?)',
      [g.buyer_name, g.buyer_email || '', g.buyer_phone || '', g.value || '', g.recipient || '', 'ny', now()]
    );
    return r.lastID;
  },
  listGiftcards: () => driver.all('SELECT * FROM giftcards ORDER BY created_at DESC'),
  updateGiftcardStatus: (id, status) => driver.run('UPDATE giftcards SET status = ? WHERE id = ?', [status, id]),
  deleteGiftcard: (id) => driver.run('DELETE FROM giftcards WHERE id = ?', [id]),

  // --- Meldingar (kontaktskjema) ---
  async createMessage(m) {
    const r = await driver.run(
      'INSERT INTO messages (name, email, phone, subject, body, status, created_at) VALUES (?,?,?,?,?,?,?)',
      [m.name, m.email || '', m.phone || '', m.subject || '', m.body || '', 'ny', now()]
    );
    return r.lastID;
  },
  listMessages: () => driver.all('SELECT * FROM messages ORDER BY created_at DESC'),
  updateMessageStatus: (id, status) => driver.run('UPDATE messages SET status = ? WHERE id = ?', [status, id]),
  deleteMessage: (id) => driver.run('DELETE FROM messages WHERE id = ?', [id]),

  // --- Admin-brukarar ---
  getAdmin: (username) => driver.get('SELECT * FROM admins WHERE username = ?', [username]),
  async ensureAdmin(username, passHash) {
    const existing = await driver.get('SELECT id FROM admins WHERE username = ?', [username]);
    if (!existing) await driver.run('INSERT INTO admins (username, pass_hash) VALUES (?, ?)', [username, passHash]);
  },
  setAdminPassword: (username, passHash) => driver.run('UPDATE admins SET pass_hash = ? WHERE username = ?', [passHash, username]),

  // --- Teljarar til dashbordet ---
  async counts() {
    const one = async (sql) => Number((await driver.get(sql))?.n ?? 0);
    return {
      newSignups: await one("SELECT COUNT(*) AS n FROM signups WHERE status = 'ny'"),
      newRequests: await one("SELECT COUNT(*) AS n FROM requests WHERE status = 'ny'"),
      newGiftcards: await one("SELECT COUNT(*) AS n FROM giftcards WHERE status = 'ny'"),
      newMessages: await one("SELECT COUNT(*) AS n FROM messages WHERE status = 'ny'"),
      courses: await one('SELECT COUNT(*) AS n FROM courses')
    };
  }
};

module.exports = db;
