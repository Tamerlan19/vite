// src/services/users.js
import { data as raw } from '../Components/data.js'

// стабильные id + счётчик для новых
const data = raw.map((u, idx) => ({ id: u.id ?? idx, ...u }))
let lastId = data.reduce((m, x) => Math.max(m, Number(x.id) || 0), -1)

export async function listUsers({
  page = 1,
  pageSize = 12,
  search = '',
  sortBy = null,
  sortDir = 'asc',
} = {}) {
  await sleep(50)

  const q = (search || '').trim().toLowerCase()

  // фильтр: null/undefined для group считаем пустой строкой
  let rows = q
    ? data.filter(u => {
        const g = (u.group ?? '').toLowerCase()
        return (
          String(u.name).toLowerCase().includes(q) ||
          String(u.email).toLowerCase().includes(q) ||
          g.includes(q)
        )
      })
    : data

  // сортировка: null как пустая строка
  if (sortBy) {
    const dir = sortDir === 'asc' ? 1 : -1
    rows = [...rows].sort(
      (a, b) =>
        String(a[sortBy] ?? '').localeCompare(String(b[sortBy] ?? ''), 'ru', { sensitivity: 'base' }) * dir
    )
  }

  const total = rows.length
  const start = (page - 1) * pageSize
  const items = rows.slice(start, start + pageSize)

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    sortBy,
    sortDir,
    search,
  }
}

export async function getUser(id) {
  await sleep(30)
  const u = data.find(x => String(x.id) === String(id))
  if (!u) throw new Error('NOT_FOUND')
  return u
}

export async function updateUser(id, patch) {
  await sleep(50)
  const idx = data.findIndex(x => String(x.id) === String(id))
  if (idx === -1) throw new Error('NOT_FOUND')
  data[idx] = { ...data[idx], ...patch }
  return data[idx]
}

export async function createUser(payload) {
  await sleep(50)
  const id = ++lastId
  const user = {
    id,
    name: (payload.name || '').trim(),
    email: (payload.email || '').trim(),
    group: (payload.group || '').trim() || null, // допускаем отсутствие группы
  }
  data.push(user)
  return user
}

// → под селект групп (уникальные, без null)
export async function listGroups() {
  await sleep(10)
  // уникальные группы из данных, без null/пустых
  const fromData = Array.from(new Set(data.map(u => u.group).filter(Boolean)))

  // дефолтные, чтобы точно было >=4
  const defaults = ['Руководство', 'Бухгалтерия', 'Отдел кадров', 'Разработка']

  // объединяем без дублей
  return Array.from(new Set([...defaults, ...fromData]))
    .sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }))
}


function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
