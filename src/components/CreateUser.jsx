import { useEffect, useState } from 'react'
import { createUser, listGroups } from '../services/users.js'

export default function CreateUser({ onCancel, onSaved }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [group, setGroup] = useState('')
  const [groups, setGroups] = useState([])

  useEffect(() => {
    listGroups().then(setGroups).catch(() => {})
  }, [])

  const invalidEmail = email.trim() === '' || !email.includes('@')
  const showHint = email.trim() !== '' && !email.includes('@')
  const valid = name.trim().length > 0 && !invalidEmail

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
          <input
            id="cu-email"
            className="input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={invalidEmail ? 'true' : 'false'}
            placeholder="name@mail.ru"
          />
          {showHint && <div className="field-hint">Формат: имя@домен</div>}
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
