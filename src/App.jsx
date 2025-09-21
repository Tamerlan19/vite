// src/App.jsx
import './App.css'
import { useState, useEffect, useCallback, useRef } from 'react'
import { listUsers, getUser, updateUser, createUser, listGroups } from './services/users.js'

export default function App() {
  const [path, navigate] = usePath()

  // маршруты:
  const matchView = (path || '/').match(/^\/users\/(\d+)$/)
  const matchEdit = (path || '/').match(/^\/users\/(\d+)\/edit$/)
  const matchNew  = (path || '/').match(/^\/users\/new$/)

  const selectedId =
    matchEdit ? Number(matchEdit[1]) :
    matchView ? Number(matchView[1]) : null

  return (
    <div className="app">
      <main className="app__content">
        <section className="card">
          {matchNew ? (
            <CreateUser
              onCancel={() => navigate('/')}
              onSaved={(u) => navigate(`/users/${u.id}`)}
            />
          ) : selectedId !== null ? (
            <UserDetails
              id={selectedId}
              mode={matchEdit ? 'edit' : 'view'}
              onBack={() => navigate('/')}
              onEdit={() => navigate(`/users/${selectedId}/edit`)}
              onSaved={(u) => navigate(`/users/${u.id}`)}
            />
          ) : (
            <UsersList
              onSelect={(id) => navigate(`/users/${id}`)}
              onAdd={() => navigate('/users/new')}
            />
          )}
        </section>
      </main>
    </div>
  )
}

/* --------------------- Список (поиск/сорт/пагинация серверные) --------------------- */
function UsersList({ onSelect, onAdd }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState(null)   // 'name' | 'email' | 'group' | null
  const [sortDir, setSortDir] = useState('asc')// 'asc' | 'desc'
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [rows, setRows] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  // дебаунс поиска
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // кэш страниц + префетч следующей
  const cacheRef = useRef(new Map())

  useEffect(() => {
    let cancelled = false
    const key = JSON.stringify({ page, pageSize, q: debouncedQuery, sortBy, sortDir })
    const cache = cacheRef.current

    const cached = cache.get(key)
    if (cached) {
      setRows(cached.items)
      setTotalPages(cached.totalPages)
    }

    setLoading(true)
    ;(async () => {
      try {
        const res = await listUsers({ page, pageSize, search: debouncedQuery, sortBy, sortDir })
        if (cancelled) return
        setRows(res.items)
        setTotalPages(res.totalPages)
        cache.set(key, res)

        // префетч следующей страницы
        if (page < res.totalPages) {
          const nextKey = JSON.stringify({ page: page + 1, pageSize, q: debouncedQuery, sortBy, sortDir })
          if (!cache.has(nextKey)) {
            listUsers({ page: page + 1, pageSize, search: debouncedQuery, sortBy, sortDir })
              .then(nxt => cache.set(nextKey, nxt))
              .catch(() => {})
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [page, pageSize, debouncedQuery, sortBy, sortDir])

  const onSort = (key) => {
    setPage(1)
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('asc') }
  }

  const ariaSort = (key) => (sortBy !== key ? 'none' : (sortDir === 'asc' ? 'ascending' : 'descending'))
  const prevPage = () => setPage(p => Math.max(1, p - 1))
  const nextPage = () => setPage(p => Math.min(totalPages, p + 1))

  return (
    <>
      <Header
        query={query}
        onChangeQuery={(v) => { setPage(1); setQuery(v) }}
        onAdd={onAdd}
      />

      <div className="user-table__wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th
                scope="col"
                aria-sort={ariaSort('name')}
                onClick={() => onSort('name')}
                style={{ cursor: 'pointer' }}
                title="Сортировать по имени"
              >
                Имя
              </th>
              <th
                scope="col"
                aria-sort={ariaSort('email')}
                onClick={() => onSort('email')}
                style={{ cursor: 'pointer' }}
                title="Сортировать по почте"
              >
                Почта
              </th>
              <th
                scope="col"
                aria-sort={ariaSort('group')}
                onClick={() => onSort('group')}
                style={{ cursor: 'pointer' }}
                title="Сортировать по отделу"
              >
                Отдел
              </th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <>
                <tr><td colSpan={4}>Ничего не найдено</td></tr>
                {Array.from({ length: Math.max(0, pageSize - 1) }).map((_, i) => (
                  <tr className="user-table__row user-table__row--empty" key={`empty-${i}`}>
                    <td colSpan={4}>&nbsp;</td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {rows.map(u => (
                  <TableRow
                    key={u.id}
                    name={u.name}
                    email={u.email}
                    group={u.group}
                    onClick={() => onSelect(u.id)}
                  />
                ))}
                {Array.from({ length: Math.max(0, pageSize - rows.length) }).map((_, i) => (
                  <tr className="user-table__row user-table__row--empty" key={`pad-${i}`}>
                    <td colSpan={4}>&nbsp;</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        {loading && <div className="user-table__overlay">Загрузка…</div>}
      </div>

      <nav className="pagin">
        <button className="pagin__btn" onClick={prevPage} disabled={page <= 1}>‹</button>
        <div className="pagin__page"><span>{page}/{totalPages}</span></div>
        <button className="pagin__btn" onClick={nextPage} disabled={page >= totalPages}>›</button>
      </nav>
    </>
  )
}

function Header({ query, onChangeQuery, onAdd }) {
  return (
    <header className="header">
      <h1 className="header__title">Список работников</h1>
      <div className="header__controls">
        <input
          className="header__search"
          type="search"
          id="search"
          placeholder="Поиск..."
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
        />
        <button className="header__button" type="button" onClick={onAdd}>
          Add User
        </button>
      </div>
    </header>
  )
}

function TableRow({ name, email, group, onClick }) {
  return (
    <tr className="user-table__row" onClick={onClick} style={{ cursor: 'pointer' }}>
      <td>{name}</td>
      <td>{email}</td>
      <td>{group ?? '—'}</td>
      <td className="user-table__arrow" aria-hidden="true">›</td>
    </tr>
  )
}

/* --------------------- Карточка пользователя + редактирование --------------------- */
function UserDetails({ id, mode = 'view', onBack, onEdit, onSaved }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState({ name: '', email: '', group: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { listGroups().then(setGroups).catch(() => {}) }, [])

  useEffect(() => {
    let cancelled = false
    getUser(id).then(u => {
      if (cancelled) return
      setUser(u)
      setForm({ name: u.name, email: u.email, group: u.group || '' })
    }).catch(e => !cancelled && setError(e))
    return () => { cancelled = true }
  }, [id])

  if (error) {
    return (
      <section className="content">
        <button type="button" onClick={onBack}>← Назад</button>
        <p>Пользователь не найден</p>
      </section>
    )
  }
  if (!user) {
    return (
      <section className="content">
        <button type="button" onClick={onBack}>← Назад</button>
        <p>Загрузка…</p>
      </section>
    )
  }

  const isValid = form.name.trim().length > 0 && form.email.includes('@')

  async function onSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    try {
      const u = await updateUser(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        group: form.group || null,
      })
      onSaved?.(u)
    } finally {
      setSaving(false)
    }
  }

  if (mode === 'edit') {
    return (
      <section className="content">
        <button type="button" onClick={onBack}>← Назад</button>
        <h2 className="content__title">Редактирование пользователя</h2>

        <form className="kv-grid" onSubmit={onSubmit}>
          <label className="kv__label" htmlFor="ed-name">Имя</label>
          <div className="kv__value">
            <input id="ed-name" className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <label className="kv__label" htmlFor="ed-email">Почта</label>
          <div className="kv__value">
            <input id="ed-email" className="input" type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <label className="kv__label" htmlFor="ed-group">Отдел</label>
          <div className="kv__value">
            <select id="ed-group" className="select"
              value={form.group}
              onChange={e => setForm(f => ({ ...f, group: e.target.value }))}>
              <option value="">— без группы —</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={!isValid || saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
            <button type="button" className="btn" onClick={onBack}>Отмена</button>
          </div>
        </form>
      </section>
    )
  }

  // VIEW режим
  return (
    <section className="content">
      <button type="button" onClick={onBack}>← Назад</button>
      <h2 className="content__title">Информация о работнике</h2>

      <div className="kv-grid">
        <div className="kv__label">Имя</div>
        <div className="kv__value">{user.name}</div>

        <div className="kv__label">Почта</div>
        <div className="kv__value">{user.email}</div>

        <div className="kv__label">Отдел</div>
        <div className="kv__value">{user.group ?? '—'}</div>

        <div className="form-actions">
          <button type="button" className="btn btn--primary" onClick={onEdit}>
            Редактировать
          </button>
        </div>
      </div>
    </section>
  )
}

/* --------------------- Создание пользователя --------------------- */
function CreateUser({ onCancel, onSaved }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [group, setGroup] = useState('')
  const [groups, setGroups] = useState([])

  useEffect(() => { listGroups().then(setGroups).catch(() => {}) }, [])
  const valid = name.trim().length > 0 && email.includes('@')

  async function onSubmit(e) {
    e.preventDefault()
    if (!valid) return
    const u = await createUser({ name: name.trim(), email: email.trim(), group: group || null })
    onSaved?.(u)
  }

  return (
    <section className="content">
      <button type="button" onClick={onCancel}>← Назад</button>
      <h2 className="content__title">Новый пользователь</h2>

      <form className="kv-grid" onSubmit={onSubmit}>
        <label className="kv__label" htmlFor="cu-name">Имя</label>
        <div className="kv__value">
          <input id="cu-name" className="input" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <label className="kv__label" htmlFor="cu-email">Почта</label>
        <div className="kv__value">
          <input id="cu-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <label className="kv__label" htmlFor="cu-group">Отдел</label>
        <div className="kv__value">
          <select id="cu-group" className="select" value={group} onChange={e => setGroup(e.target.value)}>
            <option value="">— без группы —</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={!valid}>Создать</button>
          <button type="button" className="btn" onClick={onCancel}>Отмена</button>
        </div>
      </form>
    </section>
  )
}

/* --------------------- Мини-роутер --------------------- */
function usePath() {
  const isBrowser = typeof window !== 'undefined'
  const [path, setPath] = useState(() =>
    isBrowser ? (window.location.pathname || '/') : '/'
  )

  useEffect(() => {
    if (!isBrowser) return
    const onPop = () => setPath(window.location.pathname || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isBrowser])

  const navigate = useCallback((next, { replace = false } = {}) => {
    if (!isBrowser) { setPath(next); return }
    if (replace) window.history.replaceState(null, '', next)
    else window.history.pushState(null, '', next)
    setPath(next)
  }, [isBrowser])

  return [path, navigate]
}
