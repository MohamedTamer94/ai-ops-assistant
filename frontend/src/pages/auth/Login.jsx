import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import useAuthStore from '@/stores/auth'
import AuthCardLayout from '@/components/auth/AuthCardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateLoginForm } from '@/utils/authValidation'

function Login() {
  const navigate = useNavigate()
  const { login, loading, error } = useAuthStore()

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [values, setValues] = useState({
    email: '',
    password: '',
  })
  const [touched, setTouched] = useState({})

  const validationErrors = useMemo(
    () => validateLoginForm(values),
    [values]
  )

  const canSubmit = Object.keys(validationErrors).length === 0

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ email: true, password: true })
    if (!canSubmit) return

    try {
      await login(values.email, values.password)
      if (!rememberMe) {
        sessionStorage.setItem('token', localStorage.getItem('token') || '')
      }
      navigate('/app')
    } catch {
      // store handles backend error state
    }
  }

  return (
    <AuthCardLayout
      mode="login"
      title="Welcome back"
      description="Sign in to continue to your workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={values.email}
            disabled={loading}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
          />
          {touched.email && validationErrors.email && (
            <p className="text-xs text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={values.password}
              disabled={loading}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-900"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {touched.password && validationErrors.password && (
            <p className="text-xs text-red-600">{validationErrors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Remember me
          </label>
          <a href="#" className="text-sm text-slate-500 hover:text-slate-900">
            Forgot password?
          </a>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-medium text-slate-900 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCardLayout>
  )
}

export default Login
