// index.js
import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'

const app = express()
app.use(cors())            // CORS по умолчанию: *
app.use(express.json())    // JSON body

// --- БД (SQLite) ---
const db = new Database('users.db')
db.pragma('journal_mode = WAL')
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  "group"    TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_name_ci  ON users (lower(name));
CREATE INDEX IF NOT EXISTS idx_users_email_ci ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_group    ON users ("group");
`)

// --- Хелперы ---
const SORT = { name: 'name', email: 'email', group: '"group"' }
const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

// --- Эндпоинты ---
app.get('/users', (req, res) => {
  const page     = clamp(parseInt(req.query.page || '1', 10)  || 1, 1, 1_000_000)
  const pageSize = clamp(parseInt(req.query.pageSize || '12', 10) || 12, 1, 100)
  const search   = (req.query.search || '').trim().toLowerCase()
  const sortBy   = SORT[req.query.sortBy] || null
  const sortDir  = req.query.sortDir === 'desc' ? 'DESC' : 'ASC'

  const params = []
  let where = ''
  if (search) {
    const p = `%${search}%`
    where = `WHERE lower(name) LIKE ? OR lower(email) LIKE ? OR lower("group") LIKE ?`
    params.push(p, p, p)
  }

  const orderSql = sortBy ? `ORDER BY ${sortBy} ${sortDir}` : ''
  const total = db.prepare(`SELECT COUNT(*) AS c FROM users ${where}`).get(...params).c

  const items = db.prepare(`
    SELECT id, name, email, "group"
    FROM users
    ${where} ${orderSql}
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, (page - 1) * pageSize) // важно: * pageSize

  res.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    sortBy: sortBy ? req.query.sortBy : null,
    sortDir: sortBy ? sortDir.toLowerCase() : 'asc',
    search,
  })
})

app.get('/users/:id', (req, res) => {
  const row = db.prepare(`SELECT id, name, email, "group" FROM users WHERE id = ?`).get(req.params.id)
  if (!row) return res.status(404).json({ error: 'NOT_FOUND' })
  res.json(row)
})

app.post('/users', (req, res) => {
  const { name, email, group } = req.body || {}
  if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'VALIDATION' })
  try {
    const info = db.prepare(`INSERT INTO users (name, email, "group") VALUES (?,?,?)`)
      .run(name.trim(), email.trim(), group?.trim() || null)
    const row = db.prepare(`SELECT id, name, email, "group" FROM users WHERE id = ?`).get(info.lastInsertRowid)
    res.status(201).json(row)
  } catch (e) {
    if (String(e.message).includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({ error: 'EMAIL_EXISTS' })
    }
    throw e
  }
})

app.patch('/users/:id', (req, res) => {
  const { name, email, group } = req.body || {}
  const fields = []
  const params = []
  if (name  !== undefined) { fields.push(`name = ?`);   params.push(name?.trim()  || '') }
  if (email !== undefined) { fields.push(`email = ?`);  params.push(email?.trim() || '') }
  if (group !== undefined) { fields.push(`"group" = ?`);params.push(group?.trim() || null) }
  if (!fields.length) return res.status(400).json({ error: 'EMPTY_PATCH' })
  params.push(req.params.id)

  try {
    const r = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    if (r.changes === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    const row = db.prepare(`SELECT id, name, email, "group" FROM users WHERE id = ?`).get(req.params.id)
    res.json(row)
  } catch (e) {
    if (String(e.message).includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({ error: 'EMAIL_EXISTS' })
    }
    throw e
  }
})

app.get('/groups', (_req, res) => {
  const rows = db.prepare(`SELECT DISTINCT "group" AS g FROM users WHERE "group" IS NOT NULL ORDER BY "group"`).all()
  res.json(rows.map(r => r.g))
})

// --- Запуск ---
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0' // слушаем извне; для локалки можно HOST=127.0.0.1
app.listen(PORT, HOST, () => {
  console.log(`API on http://${HOST}:${PORT}`)
})
