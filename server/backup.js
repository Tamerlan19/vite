/* eslint-env node */
import fs from 'fs/promises'
import Database from 'better-sqlite3'
const db = new Database('users.db', { readonly: true })
const out = process.argv[2] || 'backup.json'
const rows = db.prepare('SELECT id, name, email, "group", created_at FROM users ORDER BY id').all()
await fs.writeFile(out, JSON.stringify(rows, null, 2), 'utf8')
console.log('Saved', out)
