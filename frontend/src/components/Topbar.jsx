import { useLocation, useNavigate } from 'react-router-dom'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useAuthStore from '@/stores/auth'
import { shortId } from '@/utils/ingestionFormatters'

function Topbar({ user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { orgId, projectId } = useParams()
  const organizations = useAuthStore((state) => state.user?.organizations || [])
  const orgName = organizations.find((item) => item.id === orgId)?.name || (orgId ? `Org ${shortId(orgId, 6, 0)}` : null)

  const breadcrumbs = [
    { label: 'Organizations', to: '/app' },
  ]

  if (orgId) {
    breadcrumbs.push({ label: orgName || 'Organization', to: `/app/orgs/${orgId}/projects` })
  }

  if (location.pathname.includes('/members') && orgId) {
    breadcrumbs.push({ label: 'Members' })
  }

  if (projectId) {
    breadcrumbs.push({ label: `Project ${shortId(projectId, 8, 0)}`, to: `/app/orgs/${orgId}/projects/${projectId}/ingestions` })
  }

  if (location.pathname.includes('/ingestions')) {
    breadcrumbs.push({ label: 'Ingestions' })
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/app"
            className="shrink-0 text-sm font-semibold tracking-tight text-slate-900 hover:text-slate-700"
          >
            AIOps Assistant
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex min-w-0 items-center gap-1 text-sm text-slate-500">
            {breadcrumbs.map((crumb, index) => (
              <div key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
                {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="truncate hover:text-slate-900">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate text-slate-900">{crumb.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-9 w-9 rounded-full bg-slate-100 p-0 hover:bg-slate-200"
                >
                  <span className="text-xs font-semibold text-neutral-700">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-xs text-neutral-600">
                  {user.email}
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
