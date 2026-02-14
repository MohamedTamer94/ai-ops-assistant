export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

export function validateLoginForm({ email, password }) {
  const errors = {}
  if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  return errors
}

export function validateRegisterForm({ name, email, password }) {
  const errors = validateLoginForm({ email, password })
  if (!name || !name.trim()) {
    errors.name = 'Name is required.'
  }
  return errors
}
