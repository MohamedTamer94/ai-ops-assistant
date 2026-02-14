import { create } from 'zustand'
import { api, login as apiLogin, register as apiRegister, me as apiMe } from '../lib/api'

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const data = await apiLogin(email, password)
      localStorage.setItem('token', data.access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
      set({ token: data.access_token })
      
      const userData = await apiMe()
      set({ user: userData, token: data.access_token })
      return userData
    } catch (error) {
      const message = error.response?.data?.detail || error.message
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const data = await apiRegister(name, email, password)
      return data
    } catch (error) {
      const message = error.response?.data?.detail || error.message
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchMe: async () => {
    const token = get().token || localStorage.getItem('token')
    if (!token) {
      set({ user: null, loading: false, error: 'Not authenticated' })
      throw new Error('Not authenticated')
    }

    set({ loading: true, error: null })
    try {
      const userData = await apiMe()
      set({ user: userData })
      return userData
    } catch (error) {
      if (error?.response?.status !== 200) {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        set({ token: null, user: null, error: 'Session expired. Please sign in again.' })
      } else {
        set({ error: error.message })
      }
      throw error
    } finally {
      set({ loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    set({ token: null, user: null })
  },
}))

// Initialize token on store creation
const token = localStorage.getItem('token')
if (token) {
  useAuthStore.setState({ token })
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export default useAuthStore
