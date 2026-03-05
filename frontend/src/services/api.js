import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add cache buster to GET requests
    if (config.method === 'get') {
      config.params = config.params || {};
      config.params._t = new Date().getTime();
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
  getAllAssignments: (params) => api.get('/membresias/asignaciones', { params }), // New endpoint
  getById: (id, params) => api.get(`/membresias/${id}`, { params }),
  getActive: (clienteId) => api.get(`/membresias/cliente/${clienteId}`), // Changed path
  create: (data) => api.post('/membresias/asignar', data), // Changed for assignment
  update: (id, data) => api.put(`/membresias/${id}`, data),
  cancel: (id) => api.put(`/membresias/${id}/cancelar`), // This might need backend implementation
  getExpiring: (days = 30) => api.get('/membresias/por-vencer', { params: { days } }),
}

// Plans API
export const plansAPI = {
  getAll: (params) => api.get('/membresias', { params }), // Plans are at /membresias
  getById: (id) => api.get(`/membresias/${id}`),
  create: (data) => api.post('/membresias', data),
  update: (id, data) => api.put(`/membresias/${id}`, data),
  delete: (id) => api.delete(`/membresias/${id}`),
  toggleStatus: (id) => api.patch(`/membresias/${id}/toggle`),
}

// Payments API is defined collectively below

// Attendance API
export const attendanceAPI = {
  // Added getToday to fetch todays checkins
  getAll: (params) => api.get('/asistencias', { params }),
  getToday: () => api.get('/asistencias/hoy'),
  register: (data) => api.post('/asistencias/checkin', data),
  checkInByCode: (data) => api.post('/asistencias/checkin-codigo', data),
  registerExit: (data) => api.post('/asistencias/checkout', data),
  checkOutByCode: (data) => api.post('/asistencias/checkout-codigo', data),
  getByMember: (clienteId, params) => api.get(`/asistencias/cliente/${clienteId}`, { params }),
  getStats: (params) => api.get('/asistencias/estadisticas', { params }),
}

// Notifications API (formerly alertsAPI)
export const alertsAPI = {
  getAll: (params) => api.get('/notificaciones', { params }),
  markAsRead: (id) => api.patch(`/notificaciones/${id}/marcar-leida`), // PUT -> PATCH
  markAllAsRead: () => api.patch('/notificaciones/marcar-todas-leidas'), // PUT -> PATCH
  getUnreadCount: () => api.get('/notificaciones/no-leidas/contador'),
  getActivityFeed: (params) => api.get('/notificaciones/actividad-reciente', { params }),
  deleteNotification: (id) => api.delete(`/notificaciones/${id}`),
  generateAutomatic: () => api.post('/notificaciones/generar-automaticas'),
}

// Reports API (now Metricas)
export const reportsAPI = {
  getIncome: (params) => api.get('/metricas/ingresos', { params }),
  getExpenses: (params) => api.get('/metricas/egresos', { params }),
  getMembers: (params) => api.get('/metricas/membresias', { params }),
  getAttendance: (params) => api.get('/metricas/asistencias', { params }),
  getComparative: (params) => api.get('/metricas/comparativa', { params }),
  getTopProducts: (params) => api.get('/metricas/productos-top', { params }),
  getClientStats: (params) => api.get('/metricas/clientes-stats', { params }),
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
  create: (data) => api.post('/tienda', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/tienda/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/tienda/${id}`),
  getLowStock: () => api.get('/tienda/stock-bajo'),
  getExpiringSoon: () => api.get('/tienda/por-vencer'), // Warning: Endpoint missing
  getCategories: () => api.get('/tienda/categorias'),
  createCategory: (data) => api.post('/tienda/categorias', data)
}

// Payments & Cash Register API
export const paymentsAPI = {
  getHistory: (params) => api.get('/pagos', { params }),
  getByClient: (clienteId) => api.get('/pagos', { params: { cliente_id: clienteId } }),
  getByMembership: (membresiaId) => api.get('/pagos', { params: { referencia_id: membresiaId, tipo: 'membresia' } }),
  getReceipt: (id) => api.get(`/pagos/${id}/recibo`),

  // Caja
  getCajaStatus: () => api.get('/pagos/caja/estado'),
  abrirCaja: (data) => api.post('/pagos/caja/abrir', data),
  recordCashCut: (data) => api.post('/pagos/corte-caja', data),
  getCajaHistorial: (params) => api.get('/pagos/caja/historial', { params }),

  // Pendientes & Inactivos
  getPendientes: () => api.get('/pagos/pendientes'),
  pagarPendiente: (id, data) => api.post(`/pagos/pendientes/${id}/pagar`, data),
  enviarRecordatorioCuota: (cuotaId) => api.post(`/pagos/pendientes/cuota/${cuotaId}/recordatorio`),
  getInactivos: () => api.get('/pagos/inactivos'),
  sendWinBackEmail: (id) => api.post(`/pagos/inactivos/${id}/send-email`),
  enviarRecibo: (id, data) => api.post(`/pagos/${id}/enviar-recibo`, data),
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
  recordMaintenance: (id, data) => api.post(`/maquinas/${id}/mantenimientos`, data),
  getMaintenanceHistory: (id, params) => api.get(`/maquinas/${id}/mantenimientos`, { params }),
  updateStatus: (id, data) => api.patch(`/maquinas/${id}/estado`, data),
}

// Configuration API
export const configuracionAPI = {
  getAll: () => api.get('/configuracion'),
  getGymInfo: () => api.get('/configuracion/gimnasio'),
  updateGymInfo: (data) => api.put('/configuracion/gimnasio', data),
  getSystemSettings: () => api.get('/configuracion/sistema'),
  updateMultiple: (configuraciones) => api.put('/configuracion/multiple', { configuraciones }),
  set: (clave, valor, descripcion) => api.post('/configuracion', { clave, valor, descripcion }),
  initializeDefaults: () => api.post('/configuracion/inicializar'),
}

export default api
