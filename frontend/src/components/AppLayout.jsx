import { Routes, Route, Navigate } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/auth'
import OrgSelectPage from '../pages/OrgSelectPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectLayout from './ProjectLayout'

function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">AI Ops Assistant</h1>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600">{user.email}</span>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<OrgSelectPage />} />
        <Route path="/orgs/:orgId/projects" element={<ProjectsPage />} />
        <Route path="/orgs/:orgId/projects/:projectId/*" element={<ProjectLayout />} />
      </Routes>
    </div>
  )
}

export default AppLayout
