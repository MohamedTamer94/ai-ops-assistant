import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/auth'

/**
 * Hook that requires authentication. If user is not logged in, redirects to login.
 * Returns the current user object.
 */
function useRequireAuth() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const fetchMe = useAuthStore((state) => state.fetchMe)

  useEffect(() => {
    const checkAuth = async () => {
      // If no user is loaded yet, try to fetch
      if (!user && !loading) {
        try {
          await fetchMe()
        } catch (err) {
          // Auth failed, redirect to login
          navigate('/login')
        }
      }
    }

    checkAuth()
  }, [])

  // If not loading and still no user, redirect
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading])

  return { user, loading }
}

export default useRequireAuth
