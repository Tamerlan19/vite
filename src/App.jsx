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
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Group</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <TableRow key={index} {...item} />
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}

function Header() {
  return (
    <header className="header">
      <h1 className="header__title">User List</h1>
      <div className="header__controls">
        <input
          className="header__search"
          type="search"
          name="search"
          id="search"
          placeholder="Search..."
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