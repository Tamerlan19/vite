const API = 'http://5.129.215.232:3001'

export async function listUsers({ page=1, pageSize=12, search='', sortBy=null, sortDir='asc' } = {}) {
  const sp = new URLSearchParams()
  sp.set('page', page); sp.set('pageSize', pageSize)
  if (search) sp.set('search', search)
  if (sortBy) { sp.set('sortBy', sortBy); if (sortDir !== 'asc') sp.set('sortDir', sortDir) }
  const r = await fetch(`${API}/users?` + sp.toString())
  if (!r.ok) throw new Error('LIST_FAIL')
  return r.json()
}

export async function getUser(id) {
  const r = await fetch(`${API}/users/${id}`)
  if (!r.ok) throw new Error('NOT_FOUND')
  return r.json()
}

export async function createUser(payload) {
  const r = await fetch(`${API}/users`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('CREATE_FAIL')
  return r.json()
}

export async function updateUser(id, patch) {
  const r = await fetch(`${API}/users/${id}`, {
    method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(patch)
  })
  if (!r.ok) throw new Error('UPDATE_FAIL')
  return r.json()
}

export async function listGroups() {
  const r = await fetch(`${API}/groups`)
  if (!r.ok) throw new Error('GROUPS_FAIL')
  return r.json()
}
