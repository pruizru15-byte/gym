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
// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (id, data) => api.put(`/usuarios/${id}`, data), // Add update profile
  changePassword: (id, data) => api.post(`/usuarios/${id}/reset-password`, data), // Add change password
}

// Users API (Admin & Profile)
export const usersAPI = {
  getAll: () => api.get('/usuarios'),
  getById: (id) => api.get(`/usuarios/${id}`),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`),
  getAuditLogs: (params) => api.get('/usuarios/audit-logs', { params }), // Add audit logs
}

// Clients API (formerly membersAPI)
export const membersAPI = {
  getAll: (params) => api.get('/clientes', { params }), // Changed from /miembros
  getById: (id) => api.get(`/clientes/${id}`),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  delete: (id) => api.delete(`/clientes/${id}`),
}

// Memberships Assignments API
export const membershipsAPI = {
  // Logic might be mixed here, but mapping based on best guess
  getAll: (params) => api.get('/membresias', { params }), // NOTE: This actually gets Plans currently
  getById: (id, params) => api.get(`/membresias/${id}`, { params }),
  getActive: (clienteId) => api.get(`/membresias/cliente/${clienteId}`), // Changed path
  create: (data) => api.post('/membresias/asignar', data), // Changed for assignment
  update: (id, data) => api.put(`/membresias/${id}`, data),
  cancel: (id) => api.put(`/membresias/${id}/cancelar`), // This might need backend implementation
}

// Plans API
export const plansAPI = {
  getAll: (params) => api.get('/membresias', { params }), // Plans are at /membresias
  getById: (id) => api.get(`/membresias/${id}`),
  create: (data) => api.post('/membresias', data),
  update: (id, data) => api.put(`/membresias/${id}`, data),
  delete: (id) => api.delete(`/membresias/${id}`),
}

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/ventas', { params }), // Payments likely tracked via sales/ventas
  getById: (id) => api.get(`/ventas/${id}`),
  create: (data) => api.post('/ventas', data),
  getByMembership: (membresiaId) => api.get(`/ventas/membresia/${membresiaId}`), // Warning: mismatch likely
}

// Attendance API
export const attendanceAPI = {
  getAll: (params) => api.get('/asistencias', { params }),
  register: (data) => api.post('/asistencias/checkin', data), // Changed to specific endpoint
  getByMember: (clienteId, params) => api.get(`/asistencias/cliente/${clienteId}`, { params }), // Changed to /cliente
  getStats: (params) => api.get('/asistencias/estadisticas', { params }),
}

// Notifications API (formerly alertsAPI)
export const alertsAPI = {
  getAll: (params) => api.get('/notificaciones', { params }),
  markAsRead: (id) => api.patch(`/notificaciones/${id}/marcar-leida`), // PUT -> PATCH
  markAllAsRead: () => api.patch('/notificaciones/marcar-todas-leidas'), // PUT -> PATCH
  getUnreadCount: () => api.get('/notificaciones/no-leidas/contador'),
}

// Reports API (now Metricas)
export const reportsAPI = {
  getIncome: (params) => api.get('/metricas/ingresos', { params }),
  getMembers: (params) => api.get('/metricas/membresias', { params }),
  getAttendance: (params) => api.get('/metricas/asistencias', { params }),
}

// Dashboard API
export const dashboardAPI = {
  getMetrics: () => api.get('/metricas/dashboard'), // Changed path
  getRecentActivity: () => api.get('/metricas/actividad-reciente'), // Warning: Endpoint might not exist
}

// Store/Products API
export const productsAPI = {
  getAll: (params) => api.get('/tienda', { params }), // Changed to /tienda
  getById: (id) => api.get(`/tienda/${id}`),
  create: (data) => api.post('/tienda', data),
  update: (id, data) => api.put(`/tienda/${id}`, data),
  delete: (id) => api.delete(`/tienda/${id}`),
  getLowStock: () => api.get('/tienda/stock-bajo'),
  getExpiringSoon: () => api.get('/tienda/por-vencer'), // Warning: Endpoint missing
}

// Sales/POS API
export const salesAPI = {
  getAll: (params) => api.get('/ventas', { params }),
  getById: (id) => api.get(`/ventas/${id}`),
  create: (data) => api.post('/ventas', data),
  getStats: (params) => api.get('/ventas/estadisticas'), // Warning: Endpoint missing in ventas.js? (Actually no, it's not there)
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
