import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'

function AppShell({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar user={user} onLogout={onLogout} />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
