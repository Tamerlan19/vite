import Database from 'better-sqlite3'
import fs from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'

const db = new Database('users.db')
db.pragma('journal_mode = WAL')
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "group" TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_name_ci  ON users (lower(name));
CREATE INDEX IF NOT EXISTS idx_users_email_ci ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_group    ON users ("group");
`)

const fileArg = process.argv[2] || './data.js'
const reset = process.argv.includes('--reset')

let records
if (fileArg.endsWith('.json')) {
  const text = await fs.readFile(fileArg, 'utf8')
  records = JSON.parse(text)
} else {
  const mod = await import(pathToFileURL(path.resolve(fileArg)).href)
  records = mod.data || mod.default
}

if (!Array.isArray(records)) {
  console.error('Ожидался массив объектов {name,email,group}')
  process.exit(1)
}

if (reset) db.exec('DELETE FROM users; VACUUM;')

const ins = db.prepare('INSERT OR IGNORE INTO users (name,email,"group") VALUES (?,?,?)')
const tx = db.transaction(() => {
  for (const u of records) {
    const name  = String(u.name ?? '').trim()
    const email = String(u.email ?? '').trim()
    const group = (u.group ?? null)
    if (!name || !email) continue
    ins.run(name, email, group === '' ? null : group)
  }
})
tx()
const { c } = db.prepare('SELECT COUNT(*) AS c FROM users').get()
console.log(`Импорт завершён. Всего в БД: ${c}`)