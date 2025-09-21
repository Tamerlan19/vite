import { useCallback, useEffect, useState } from 'react'

export default function usePath() {
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
