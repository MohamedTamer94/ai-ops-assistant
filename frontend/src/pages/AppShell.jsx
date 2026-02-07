import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/auth'

function AppShell() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const fetchMe = useAuthStore((state) => state.fetchMe)
  const loading = useAuthStore((state) => state.loading)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      fetchMe()
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">AI Ops Assistant</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Welcome</h2>
          {user && (
            <p className="text-gray-700 mt-2">
              Logged in as <span className="font-medium">{user.email}</span>
            </p>
          )}
        </div>

        {user?.organizations && user.organizations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Organizations</h3>
            <ul className="space-y-2">
              {user.organizations.map((org) => (
                <li
                  key={org.id}
                  className="flex items-center p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="text-gray-700">{org.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(!user?.organizations || user.organizations.length === 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-700">No organizations yet. Create one to get started.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default AppShell
