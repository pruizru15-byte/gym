import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, User, Calendar, Phone, Mail, RefreshCw, Search, Filter } from 'lucide-react'
import { membershipsAPI } from '../../services/api'
import { formatDate, formatCurrency, daysUntil } from '../../utils/formatters'
import toast from 'react-hot-toast'

const VencimientosProximos = () => {
  const [membresias, setMembresias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDays, setFilterDays] = useState(30) // Show memberships expiring in X days
  const [sortField, setSortField] = useState('fecha_vencimiento')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    fetchMembresias()
  }, [filterDays])

  // Fetch memberships
  const fetchMembresias = async () => {
    setLoading(true)
    try {
      // Usa el endpoint correcto: /membresias/por-vencer?days=N
      const response = await membershipsAPI.getExpiring(filterDays)
      setMembresias(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error('Error al cargar vencimientos')
      console.error('Error fetching expiring memberships:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter memberships by search
  const filteredMembresias = membresias.filter(membresia => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    const nombre = `${membresia.cliente_nombre || ''} ${membresia.cliente_apellido || ''}`.toLowerCase()
    return (
      nombre.includes(searchLower) ||
      membresia.email?.toLowerCase().includes(searchLower) ||
      membresia.telefono?.includes(searchTerm)
    )
  })

  // Sort memberships
  const sortedMembresias = [...filteredMembresias].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    if (sortField === 'fecha_vencimiento') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Get urgency level
  const getUrgencyLevel = (days) => {
    if (days <= 3) {
      return {
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: <AlertTriangle size={16} className="text-red-600" />,
        label: 'Urgente',
      }
    } else if (days <= 7) {
      return {
        className: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: <AlertTriangle size={16} className="text-orange-600" />,
        label: 'Próximo',
      }
    } else if (days <= 15) {
      return {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <Calendar size={16} className="text-yellow-600" />,
        label: 'Pronto',
      }
    }
    return {
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <Calendar size={16} className="text-blue-600" />,
      label: 'Programado',
    }
  }

  // Get statistics
  const stats = {
    urgent: filteredMembresias.filter(m => {
      const days = daysUntil(m.fecha_vencimiento)
      return days !== null && days <= 3
    }).length,
    next7Days: filteredMembresias.filter(m => {
      const days = daysUntil(m.fecha_vencimiento)
      return days !== null && days <= 7
    }).length,
    next30Days: filteredMembresias.filter(m => {
      const days = daysUntil(m.fecha_vencimiento)
      return days !== null && days <= 30
    }).length,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">Vencimientos Próximos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Membresías que están por vencer</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Urgente (≤3 días)</p>
              <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Próximos 7 días</p>
              <p className="text-3xl font-bold text-orange-600">{stats.next7Days}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Calendar className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Próximos 30 días</p>
              <p className="text-3xl font-bold text-blue-600">{stats.next30Days}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Days */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={7}>Próximos 7 días</option>
              <option value={15}>Próximos 15 días</option>
              <option value={30}>Próximos 30 días</option>
              <option value={60}>Próximos 60 días</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memberships List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : sortedMembresias.length === 0 ? (
          <div className="text-center p-12">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay membresías por vencer</h3>
            <p className="text-gray-600">Todas las membresías están al día</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 dark:divide-gray-700">
            {sortedMembresias.map((membresia) => {
              const days = daysUntil(membresia.fecha_vencimiento)
              const urgency = getUrgencyLevel(days)
              const nombreCompleto = `${membresia.cliente_nombre || ''} ${membresia.cliente_apellido || ''}`.trim()

              return (
                <div
                  key={membresia.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Member Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <User className="text-primary-600 dark:text-primary-400 dark:text-primary-400" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {nombreCompleto}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {membresia.email && (
                            <div className="flex items-center gap-1">
                              <Mail size={14} className="text-gray-400" />
                              <span>{membresia.email}</span>
                            </div>
                          )}
                          {membresia.telefono && (
                            <div className="flex items-center gap-1">
                              <Phone size={14} className="text-gray-400" />
                              <span>{membresia.telefono}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Membership Info */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="text-center md:text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</p>
                        <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{membresia.membresia_nombre}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(membresia.precio_pagado)}</p>
                      </div>

                      <div className="text-center md:text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vence</p>
                        <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{formatDate(membresia.fecha_vencimiento)}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${urgency.className}`}>
                          {urgency.icon}
                          {days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `${days} días`}
                        </div>
                      </div>

                      <Link
                        to={`/membresias/renovar/${membresia.cliente_id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2 justify-center"
                      >
                        <RefreshCw size={18} />
                        Renovar
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Export/Actions */}
      {!loading && sortedMembresias.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Mostrando {sortedMembresias.length} {sortedMembresias.length === 1 ? 'membresía' : 'membresías'}
          </p>
          <button
            onClick={() => {
              // This would typically export to CSV or print
              toast.success('Función de exportación en desarrollo')
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition"
          >
            Exportar Lista
          </button>
        </div>
      )}
    </div>
  )
}

export default VencimientosProximos
