import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/auth'

/**
 * Hook that requires authentication. If user is not logged in, redirects to login.
 * Returns the current user object.
 */
function useRequireAuth() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const fetchMe = useAuthStore((state) => state.fetchMe)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      if (user) {
        if (!cancelled) setChecking(false)
        return
      }

      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      if (loading) return

      try {
        await fetchMe()
        if (!cancelled) setChecking(false)
      } catch {
        if (!cancelled) navigate('/login', { replace: true })
      }
    }

    checkAuth()
    return () => {
      cancelled = true
    }
  }, [fetchMe, loading, navigate, token, user])

  return { user, loading: loading || checking }
}

export default useRequireAuth
