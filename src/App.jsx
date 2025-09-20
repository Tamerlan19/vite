import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { data } from './Components/data.js'

const HOME_PATH = '/'
const VISIBLE_USERS_COUNT = 12

export default function App() {
  const [path, navigate] = usePath()
  const normalizedPath = path || HOME_PATH
  const userMatch = normalizedPath.match(/^\/users\/(\d+)$/)

  let content = null

  if (userMatch) {
    const userIndex = Number(userMatch[1])
    const user = Number.isInteger(userIndex) ? data[userIndex] : undefined

    content = <UserDetails user={user} onBack={() => navigate(HOME_PATH)} />
  } else if (normalizedPath === HOME_PATH) {
    content = (
      <UsersList onSelectUser={(index) => navigate(`/users/${index}`)} />
    )
  } else {
    content = <NotFound onBack={() => navigate(HOME_PATH)} />
  }

  return (
    <div className="app">
      <main className="app__content">
        <section className="card">{content}</section>
      </main>
    </div>
  )
}

function UsersList({ onSelectUser }) {
  const visibleUsers = data.slice(0, VISIBLE_USERS_COUNT)

  return (
    <>
      <Header />

      <table className="user-table">
        <thead>
          <tr>
            <th scope="col">Имя</th>
            <th scope="col">Почта</th>
            <th scope="col">Отдел</th>
            <th scope="col" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map((item, index) => (
            <TableRow
              key={`${item.email}-${index}`}
              name={item.name}
              email={item.email}
              group={item.group}
              onSelect={() => onSelectUser(index)}
            />
          ))}
        </tbody>
      </table>

      <nav className="pagin" aria-label="Пагинация">
        <button className="pagin__btn" type="button" disabled>
          ‹
        </button>
        <div className="pagin__page" aria-hidden="true">
          <span>1</span>
        </div>
        <button className="pagin__btn" type="button" disabled>
          ›
        </button>
      </nav>
    </>
  )
}

function Header() {
  return (
    <header className="header">
      <h1 className="header__title">Список работников</h1>
      <div className="header__controls">
        <input
          className="header__search"
          type="search"
          name="search"
          id="search"
          placeholder="Поиск..."
        />
        <button className="header__button" type="button">
          Add User
        </button>
      </div>
    </header>
  )
}

function TableRow({ name, email, group, onSelect }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <tr
      className="user-table__row"
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <td>{name}</td>
      <td>{email}</td>
      <td>{group}</td>
      <td className="user-table__arrow" aria-hidden="true">
        ›
      </td>
    </tr>
  )
}

function UserDetails({ user, onBack }) {
  if (!user) {
    return (
      <section className="content">
        <button
          type="button"
          className="content__back-button"
          onClick={onBack}
        >
          ← Назад к списку
        </button>
        <h2 className="content__title">Пользователь не найден</h2>
        <p className="content__description">
          Возможно, ссылка устарела или запись была удалена.
        </p>
      </section>
    )
  }

  return <UserInfo {...user} onBack={onBack} />
}

function UserInfo({ name, email, group, onBack }) {
  return (
    <section className="content">
      <button
        type="button"
        className="content__back-button"
        onClick={onBack}
      >
        ← Назад к списку
      </button>

      <h2 className="content__title">Информация о работнике</h2>

      <div className="infoUser">
        <InfoField label="Имя" value={name} />
        <InfoField label="Почта" value={email} />
        <InfoField label="Отдел" value={group} />
      </div>

      <div className="content__actions">
        <button type="button" className="content__edit-button">
          Редактировать
        </button>
      </div>
    </section>
  )
}

function InfoField({ label, value }) {
  return (
    <div className="infoUser__row">
      <span className="infoUser__label">{label}:</span>
      <span className="infoUser__value">{value}</span>
    </div>
  )
}

function NotFound({ onBack }) {
  return (
    <section className="content">
      <button
        type="button"
        className="content__back-button"
        onClick={onBack}
      >
        ← Назад к списку
      </button>
      <h2 className="content__title">Страница не найдена</h2>
      <p className="content__description">
        Мы не нашли страницу по указанному адресу. Попробуйте вернуться на
        главную страницу.
      </p>
    </section>
  )
}

function usePath() {
  const isBrowser = typeof window !== 'undefined'
  const [path, setPath] = useState(() => {
    if (!isBrowser) {
      return HOME_PATH
    }

    return window.location.pathname || HOME_PATH
  })

  useEffect(() => {
    if (!isBrowser) {
      return undefined
    }

    const handlePopState = () => {
      setPath(window.location.pathname || HOME_PATH)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isBrowser])

  const navigate = useCallback(
    (nextPath, options = {}) => {
      const { replace = false } = options

      if (!isBrowser) {
        setPath(nextPath)
        return
      }

      if (replace) {
        window.history.replaceState(null, '', nextPath)
      } else {
        window.history.pushState(null, '', nextPath)
      }

      setPath(nextPath)
    },
    [isBrowser],
  )

  return [path, navigate]
}
