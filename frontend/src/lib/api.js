import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = async (email, password) => {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const response = await api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  return response.data
}

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
  })
  return response.data
}

export const me = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const listProjects = async (orgId) => {
  const response = await api.get(`/orgs/${orgId}/projects/`)
  return response.data
}

export const createProject = async (orgId, name) => {
  const response = await api.post(`/orgs/${orgId}/projects/`, {
    name,
  })
  return response.data
}

export const listIngestions = async (orgId, projectId) => {
  const response = await api.get(`/orgs/${orgId}/projects/${projectId}/ingestions/`)
  return response.data
}

export const createIngestion = async (orgId, projectId, payload) => {
  const response = await api.post(`/orgs/${orgId}/projects/${projectId}/ingestions/`, payload)
  return response.data
}

export const pasteIngestionLogs = async (orgId, projectId, ingestionId, text) => {
  const response = await api.post(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/logs/paste`,
    { text }
  )
  return response.data
}

export const getIngestionOverview = async (orgId, projectId, ingestionId) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/overview`
  )
  return response.data
}

export const listIngestionEvents = async (orgId, projectId, ingestionId, cursor = 0, limit = 100) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/events`,
    { params: { cursor, limit } }
  )
  return response.data
}

export const getIngestionFindings = async (orgId, projectId, ingestionId) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/findings`
  )
  return response.data
}

export default api
