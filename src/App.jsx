import './App.css'
import CreateUser from './components/CreateUser.jsx'
import UserDetails from './components/UserDetails.jsx'
import UsersList from './components/UsersList.jsx'
import usePath from './hooks/usePath.js'

export default function App() {
  const [path, navigate] = usePath()

  const matchView = (path || '/').match(/^\/users\/(\d+)$/)
  const matchEdit = (path || '/').match(/^\/users\/(\d+)\/edit$/)
  const matchNew = (path || '/').match(/^\/users\/new$/)

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
