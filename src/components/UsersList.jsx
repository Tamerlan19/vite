import { useEffect, useRef, useState } from 'react'
import { listUsers } from '../services/users.js'

export default function UsersList({ onSelect, onAdd }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState(null)   // 'name' | 'email' | 'group' | null
  const [sortDir, setSortDir] = useState('asc')// 'asc' | 'desc'
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [rows, setRows] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [debouncedQuery, setDebouncedQuery] = useState(query)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

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
                <tr className="user-table__row user-table__row--message">
                  <td className="user-table__cell user-table__cell--message" colSpan={4}>
                    Ничего не найдено
                  </td>
                </tr>
                {Array.from({ length: Math.max(0, pageSize - 1) }).map((_, i) => (
                  <tr className="user-table__row user-table__row--empty" key={`empty-${i}`}>
                    <td className="user-table__cell user-table__cell--empty" colSpan={4}>&nbsp;</td>
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
                    <td className="user-table__cell user-table__cell--empty" colSpan={4}>&nbsp;</td>
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
      <td className="user-table__cell" data-label="Имя">{name}</td>
      <td className="user-table__cell" data-label="Почта">{email}</td>
      <td className="user-table__cell user-table__cell--muted" data-label="Отдел">{group ?? '—'}</td>
      <td className="user-table__cell user-table__arrow" data-label="" aria-hidden="true">›</td>
    </tr>
  )
}
