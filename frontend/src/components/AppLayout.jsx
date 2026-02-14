import { Routes, Route, Outlet } from 'react-router-dom'
import useAuthStore from '../stores/auth'
import AppShell from './AppShell'
import OrgSelectPage from '../pages/OrgSelectPage'
import ProjectsPage from '../pages/ProjectsPage'
import OrgMembersPage from '../pages/OrgMembersPage'
import ProjectLayout from './ProjectLayout'

function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => logout()

  return (
    <Routes>
      <Route element={<AppShell user={user} onLogout={handleLogout} />}>
        <Route path="/" element={<OrgSelectPage />} />
        <Route path="/orgs/:orgId/projects" element={<ProjectsPage />} />
        <Route path="/orgs/:orgId/members" element={<OrgMembersPage />} />
        <Route path="/orgs/:orgId/projects/:projectId/*" element={<ProjectLayout />} />
      </Route>
    </Routes>
  )
}

export default AppLayout
