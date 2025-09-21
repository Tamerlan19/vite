import './App.css'
import { useState, useEffect, useCallback } from 'react'
import { listUsers, getUser, updateUser, createUser, listGroups } from './services/users.js'


export default function App() {
  const [path, navigate] = usePath()

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
              onSaved={(newId) => navigate(`/users/${newId}`)}
            />
          ) : selectedId !== null ? (
            <UserDetails
              id={selectedId}
              mode={matchEdit ? 'edit' : 'view'}
              onBack={() => navigate('/')}
              onEdit={() => navigate(`/users/${selectedId}/edit`)}
              onSaved={() => navigate(`/users/${selectedId}`)}
              onCancel={() => navigate(`/users/${selectedId}`)}
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


function UsersList({ onSelect, onAdd }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState(null)   // 'name' | 'email' | 'group' | null
  const [sortDir, setSortDir] = useState('asc')// 'asc' | 'desc'
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [viewRows, setViewRows] = useState([])
  const [totalPages, setTotalPages] = useState(1)


  const [debouncedQuery, setDebouncedQuery] = useState(query)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

const validSort = new Set(['name','email','group'])
const ensureSortKey = (k) => (validSort.has(k) ? k : null)


useEffect(() => {
  const sp = new URLSearchParams(window.location.search)
  const q    = sp.get('q') || ''
  const sort = ensureSortKey(sp.get('sort'))
  const dir  = sp.get('dir') === 'desc' ? 'desc' : 'asc'
  const pg   = Math.max(1, Number(sp.get('page') || 1))

  setQuery(q)
  setSortBy(sort)
  setSortDir(sort ? dir : 'asc')
  setPage(pg)
}, [])


useEffect(() => {
  const sp = new URLSearchParams()
  if (debouncedQuery) sp.set('q', debouncedQuery)
  if (sortBy) {
    sp.set('sort', sortBy)
    if (sortDir !== 'asc') sp.set('dir', sortDir)
  }
  if (page > 1) sp.set('page', String(page))

  const qs = sp.toString()
  const next = qs ? `/?${qs}` : `/`
  window.history.replaceState(null, '', next)
}, [debouncedQuery, sortBy, sortDir, page])


  useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await listUsers({
        page,
        pageSize,
        search: debouncedQuery,
        sortBy,
        sortDir,
      })
      if (cancelled) return
      setViewRows(res.items)
      setTotalPages(res.totalPages)
    }
    load()
    return () => { cancelled = true }
  }, [page, pageSize, debouncedQuery, sortBy, sortDir])

  const onSort = (key) => {
    setPage(1)
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('asc') }
  }

  const ariaSort = (key) => {
    if (sortBy !== key) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  const prevPage = () => setPage(p => Math.max(1, p - 1))
  const nextPage = () => setPage(p => Math.min(totalPages, p + 1))

  return (
    <>
      <Header
        query={query}
        onChangeQuery={(v) => { setPage(1); setQuery(v) }}
        onAdd={onAdd}
      />

      <table className="user-table">
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort('name')}  onClick={() => onSort('name')}  style={{ cursor:'pointer' }} title="Сортировать по имени">Имя</th>
            <th scope="col" aria-sort={ariaSort('email')} onClick={() => onSort('email')} style={{ cursor:'pointer' }} title="Сортировать по почте">Почта</th>
            <th scope="col" aria-sort={ariaSort('group')} onClick={() => onSort('group')} style={{ cursor:'pointer' }} title="Сортировать по отделу">Отдел</th>
            <th scope="col" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {viewRows.length === 0 ? (
            <tr><td colSpan={4}>Ничего не найдено</td></tr>
          ) : (
            viewRows.map(u => (
              <TableRow
                key={u.id}
                name={u.name}
                email={u.email}
                group={u.group}
                onClick={() => onSelect(u.id)}
              />
            ))
          )}
        </tbody>
      </table>

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
      <td>{group}</td>
      <td className="user-table__arrow" aria-hidden="true">›</td>
    </tr>
  )
}


function UserDetails({ id, mode = 'view', onBack, onEdit, onSaved, onCancel }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const u = await getUser(id)
        if (!cancelled) setUser(u)
      } catch (e) {
        if (!cancelled) setError(e)
      }
    }
    load()
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

  if (mode === 'view') {
    return (
      <section className="content">
        <button type="button" onClick={onBack}>← Назад</button>
        <h2>Информация о работнике</h2>
        <div className="infoUser">
          <div className='infoUser__name'><span>Имя:</span><span>{user.name}</span></div>
          <div className='infoUser__mail'><span>Почта:</span><span>{user.email}</span></div>
          <div className='infoUser__group'><span>Отдел:</span><span>{user.group ?? '—'}</span></div>
        </div>
        <button type="button" onClick={onEdit}>Редактировать</button>
      </section>
    )
  }

  return (
    <EditForm
      initial={user}
      onCancel={onCancel}
      onSubmit={async (values) => {
        if (!values.name?.trim() || !values.email?.trim()) return
        await updateUser(id, {
          name: values.name.trim(),
          email: values.email.trim(),
          group: values.group?.trim() || null,
        })
        onSaved()
      }}
    />
  )
}

function CreateUser({ onCancel, onSaved }) {
  return (
    <EditForm
      initial={{ name: '', email: '', group: '' }}
      onCancel={onCancel}
      onSubmit={async (values) => {
        if (!values.name?.trim() || !values.email?.trim()) return
        const created = await createUser({
          name: values.name.trim(),
          email: values.email.trim(),
          group: values.group?.trim() || null,
        })
        onSaved(created.id)
      }}
      title="Новый пользователь"
      saveLabel="Создать"
    />
  )
}

function EditForm({
  initial,
  onSubmit,
  onCancel,
  title = 'Редактирование пользователя',
  saveLabel = 'Сохранить',
}) {
  const [name, setName] = useState(initial.name || '')
  const [email, setEmail] = useState(initial.email || '')
  const [group, setGroup] = useState(initial.group || '')
  const [groups, setGroups] = useState([])


  useEffect(() => {
    let cancelled = false
    async function load() {
      const arr = await listGroups()
      if (!cancelled) setGroups(arr)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // лёгкая валидация
  const nameOk = name.trim().length > 0
  const emailOk = email.trim().includes('@') && email.trim().length > 0
  const isValid = nameOk && emailOk

  const handleSave = () => {
    if (!isValid) return
    onSubmit({ name, email, group }) 
  }

  return (
    <section className="content">
      <button type="button" onClick={onCancel}>← Назад</button>
      <h2>{title}</h2>

      <div className="infoUser">
        <div className="infoUser__name">
          <span>Имя:</span>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="infoUser__mail">
          <span>Почта:</span>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="infoUser__group">
          <span>Отдел:</span>
          <select value={group} onChange={e => setGroup(e.target.value)}>
            <option value="">— без группы —</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          title={!isValid ? 'Введите имя и email с @' : undefined}
        >
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel}>Отмена</button>
      </div>
    </section>
  )
}




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
