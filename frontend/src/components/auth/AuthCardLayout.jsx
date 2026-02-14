import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function AuthCardLayout({
  title,
  description,
  mode,
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_45%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
        <Card className="w-full border-slate-200 shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center rounded-lg bg-slate-100 p-1">
              <Link
                to="/login"
                className={`w-1/2 rounded-md px-3 py-2 text-center text-sm font-medium transition ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`w-1/2 rounded-md px-3 py-2 text-center text-sm font-medium transition ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register
              </Link>
            </div>
            <div className="space-y-1 text-center">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuthCardLayout
