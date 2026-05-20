import axios from 'axios'

// Base Axios Configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1', // dynamic with fallback
  timeout: 45000,
})

// Request Interceptor to dynamically append JWT
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (username, password) => {
    const res = await API.post('/auth/login', { username, password })
    return res.data
  },
  register: async (data) => {
    const res = await API.post('/auth/register', data)
    return res.data
  }
}

export const hcpAPI = {
  list: async (filters = {}) => {
    const res = await API.get('/hcps', { params: filters })
    return res.data
  },
  create: async (data) => {
    const res = await API.post('/hcps', data)
    return res.data
  },
  update: async (id, data) => {
    const res = await API.put(`/hcps/${id}`, data)
    return res.data
  }
}

export const interactionAPI = {
  list: async () => {
    const res = await API.get('/interactions')
    return res.data
  },
  log: async (data) => {
    const res = await API.post('/log-interaction', data)
    return res.data
  },
  edit: async (id, modifications) => {
    const res = await API.put(`/edit-interaction/${id}`, modifications)
    return res.data
  },
  hcpHistory: async (hcpId) => {
    const res = await API.get(`/hcp-history/${hcpId}`)
    return res.data
  }
}

export const followupAPI = {
  list: async () => {
    const res = await API.get('/followups')
    return res.data
  }
}

export const dashboardAPI = {
  metrics: async () => {
    const res = await API.get('/dashboard-metrics')
    return res.data
  }
}

export const aiAPI = {
  chat: async (text, hcpId = null, chatHistory = []) => {
    const res = await API.post('/ai-chat', {
      text,
      hcp_id: hcpId,
      chat_history: chatHistory
    })
    return res.data
  },
  voiceSchedule: async (text) => {
    const res = await API.post('/voice-schedule', { text })
    return res.data
  }
}

export default API
