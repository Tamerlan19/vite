import { useEffect, useState } from 'react'
import { getUser, listGroups, updateUser } from '../services/users.js'

export default function UserDetails({ id, mode = 'view', onBack, onEdit, onSaved }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState({ name: '', email: '', group: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listGroups().then(setGroups).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    getUser(id)
      .then(u => {
        if (cancelled) return
        setUser(u)
        setForm({ name: u.name, email: u.email, group: u.group || '' })
      })
      .catch(e => {
        if (!cancelled) setError(e)
      })

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

  if (mode === 'edit') {
    const invalidEmail = form.email.trim() === '' || !form.email.includes('@')
    const showHint = form.email.trim() !== '' && !form.email.includes('@')
    const isValid = form.name.trim().length > 0 && !invalidEmail

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
        setUser(u)
        setForm({ name: u.name, email: u.email, group: u.group || '' })
        onSaved?.(u)
      } finally {
        setSaving(false)
      }
    }

    return (
      <section className="content">
        <button type="button" onClick={onBack}>← Назад</button>
        <h2 className="content__title">Редактирование пользователя</h2>

        <form className="kv-grid" onSubmit={onSubmit}>
          <label className="kv__label" htmlFor="ed-name">Имя</label>
          <div className="kv__value">
            <input
              id="ed-name"
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <label className="kv__label" htmlFor="ed-email">Почта</label>
          <div className="kv__value">
            <input
              id="ed-email"
              className="input"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              aria-invalid={invalidEmail ? 'true' : 'false'}
              placeholder="name@mail.ru"
            />
            {showHint && <div className="field-hint">Формат: имя@домен</div>}
          </div>

          <label className="kv__label" htmlFor="ed-group">Отдел</label>
          <div className="kv__value">
            <select
              id="ed-group"
              className="select"
              value={form.group}
              onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
            >
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
