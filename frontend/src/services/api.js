import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
}

// Members API
export const membersAPI = {
  getAll: (params) => api.get('/miembros', { params }),
  getById: (id) => api.get(`/miembros/${id}`),
  create: (data) => api.post('/miembros', data),
  update: (id, data) => api.put(`/miembros/${id}`, data),
  delete: (id) => api.delete(`/miembros/${id}`),
}

// Memberships API
export const membershipsAPI = {
  getAll: (params) => api.get('/membresias', { params }),
  getById: (id, params) => api.get(`/membresias/${id}`, { params }),
  getActive: (miembroId) => api.get(`/membresias/activa/${miembroId}`),
  create: (data) => api.post('/membresias', data),
  update: (id, data) => api.put(`/membresias/${id}`, data),
  cancel: (id) => api.put(`/membresias/${id}/cancelar`),
}

// Plans API
export const plansAPI = {
  getAll: (params) => api.get('/planes', { params }),
  getById: (id) => api.get(`/planes/${id}`),
  create: (data) => api.post('/planes', data),
  update: (id, data) => api.put(`/planes/${id}`, data),
  delete: (id) => api.delete(`/planes/${id}`),
}

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/pagos', { params }),
  getById: (id) => api.get(`/pagos/${id}`),
  create: (data) => api.post('/pagos', data),
  getByMembership: (membresiaId) => api.get(`/pagos/membresia/${membresiaId}`),
}

// Attendance API
export const attendanceAPI = {
  getAll: (params) => api.get('/asistencias', { params }),
  register: (data) => api.post('/asistencias', data),
  getByMember: (miembroId, params) => api.get(`/asistencias/miembro/${miembroId}`, { params }),
  getStats: (params) => api.get('/asistencias/estadisticas', { params }),
}

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get('/alertas', { params }),
  markAsRead: (id) => api.put(`/alertas/${id}/leida`),
  markAllAsRead: () => api.put('/alertas/marcar-todas-leidas'),
}

// Reports API
export const reportsAPI = {
  getIncome: (params) => api.get('/reportes/ingresos', { params }),
  getMembers: (params) => api.get('/reportes/miembros', { params }),
  getAttendance: (params) => api.get('/reportes/asistencias', { params }),
}

// Dashboard API
export const dashboardAPI = {
  getMetrics: () => api.get('/dashboard/metricas'),
  getRecentActivity: () => api.get('/dashboard/actividad-reciente'),
}

// Store/Products API
export const productsAPI = {
  getAll: (params) => api.get('/productos', { params }),
  getById: (id) => api.get(`/productos/${id}`),
  create: (data) => api.post('/productos', data),
  update: (id, data) => api.put(`/productos/${id}`, data),
  delete: (id) => api.delete(`/productos/${id}`),
  getLowStock: () => api.get('/productos/bajo-stock'),
  getExpiringSoon: () => api.get('/productos/por-vencer'),
}

// Sales/POS API
export const salesAPI = {
  getAll: (params) => api.get('/ventas', { params }),
  getById: (id) => api.get(`/ventas/${id}`),
  create: (data) => api.post('/ventas', data),
  getStats: (params) => api.get('/ventas/estadisticas', { params }),
}

// Machines API
export const machinesAPI = {
  getAll: (params) => api.get('/maquinas', { params }),
  getById: (id) => api.get(`/maquinas/${id}`),
  create: (data) => api.post('/maquinas', data),
  update: (id, data) => api.put(`/maquinas/${id}`, data),
  delete: (id) => api.delete(`/maquinas/${id}`),
  recordMaintenance: (id, data) => api.post(`/maquinas/${id}/mantenimiento`, data),
  getMaintenanceHistory: (id, params) => api.get(`/maquinas/${id}/mantenimiento`, { params }),
}

export default api
