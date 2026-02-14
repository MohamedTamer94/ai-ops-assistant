import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let handlingUnauthorized = false

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']

      if (
        !handlingUnauthorized &&
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login'
      ) {
        handlingUnauthorized = true
        window.location.replace('/login')
      }
    }

    return Promise.reject(error)
  }
)

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

export const createOrganization = async (name) => {
  const response = await api.post('/orgs/', { name })
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

export const uploadIngestionLogs = async (orgId, projectId, ingestionId, file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/logs/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}

export const getIngestionOverview = async (orgId, projectId, ingestionId) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/overview`
  )
  return response.data
}

export const listIngestionEvents = async (orgId, projectId, ingestionId, params = {}) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/events`,
    { params }
  )
  return response.data
}

export const getIngestionFindings = async (orgId, projectId, ingestionId) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/findings`
  )
  return response.data
}

export const getGroupOverview = async (orgId, projectId, ingestionId, fingerprint) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/groups/${fingerprint}`
  )
  return response.data
}

export const listIngestionGroups = async (orgId, projectId, ingestionId, params = {}) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/groups`,
    { params }
  )
  return response.data
}

export const getFindingDetails = async (orgId, projectId, ingestionId, findingId) => {
  const response = await api.get(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/findings/${findingId}`
  )
  return response.data
}

export const generateInsight = async (orgId, projectId, ingestionId, scopeType, scopeId) => {
  const body = {
    scope_type: scopeType,
  }
  if (scopeType === 'group') {
    body.fingerprint = scopeId
  } else if (scopeType === 'finding') {
    body.finding_id = scopeId
  }
  const response = await api.post(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}/insights`,
    body
  )
  return response.data
}

export const deleteOrganization = async (orgId) => {
  const response = await api.delete(`/orgs/${orgId}`)
  return response.data
}

export const deleteProject = async (orgId, projectId) => {
  const response = await api.delete(`/orgs/${orgId}/projects/${projectId}`)
  return response.data
}

export const deleteIngestion = async (orgId, projectId, ingestionId) => {
  const response = await api.delete(
    `/orgs/${orgId}/projects/${projectId}/ingestions/${ingestionId}`
  )
  return response.data
}

export const listOrgMembers = async (orgId) => {
  const response = await api.get(`/orgs/${orgId}/users`)
  return response.data
}

export const inviteOrgMember = async (orgId, payload) => {
  const response = await api.post(`/orgs/${orgId}/users`, payload)
  return response.data
}

export const updateOrgMemberRole = async (orgId, userId, role) => {
  const response = await api.patch(`/orgs/${orgId}/users/${userId}`, { role })
  return response.data
}

export const removeOrgMember = async (orgId, userId) => {
  const response = await api.delete(`/orgs/${orgId}/users/${userId}`)
  return response.data
}

export default api
