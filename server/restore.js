/* eslint-env node */
import fs from 'fs/promises'
import Database from 'better-sqlite3'
const db = new Database('users.db')
const file = process.argv[2] || 'backup.json'
const text = await fs.readFile(file, 'utf8')
const rows = JSON.parse(text)
const tx = db.transaction(() => {
  const upsert = db.prepare(`
    INSERT INTO users (id, name, email, "group", created_at)
    VALUES (@id, @name, @email, @group, COALESCE(@created_at, datetime('now')))
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, email=excluded.email, "group"=excluded."group"
  `)
  for (const u of rows) upsert.run(u)
})
tx()
console.log('Restored', rows.length, 'rows')
