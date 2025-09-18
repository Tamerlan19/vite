import './App.css'
import { data } from './Components/data.js'

export default function App() {
  return (
    <div className="app">
      <main className="app__content">
        <section className="card">
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
              {data.slice(0,12).map((item, index) => (
                <TableRow key={index} {...item} />
              ))}
            </tbody>
          </table>
            <nav className='pagin'>
              <button className='pagin__btn'>
                ‹
              </button>
              <div className='pagin__page'><span></span></div>
              <button className='pagin__btn'>
                ›
              </button>
            </nav>          
        </section>
      </main>
    </div>
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

function TableRow({ name, email, group }) {
  return (
    <tr className="user-table__row">
      <td>{name}</td>
      <td>{email}</td>
      <td>{group}</td>
      <td className="user-table__arrow" aria-hidden="true">
        ›
      </td>
    </tr>
  )
}