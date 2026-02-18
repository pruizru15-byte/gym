import { useState, useEffect } from 'react'
import { Search, QrCode, CheckCircle, XCircle, AlertCircle, User, Clock } from 'lucide-react'
import { membersAPI, attendanceAPI } from '../../services/api'
import { formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const CheckIn = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recentCheckIns, setRecentCheckIns] = useState([])
  const [loading, setLoading] = useState(false)
  const [qrScannerActive, setQrScannerActive] = useState(false)

  // Load recent check-ins on mount
  useEffect(() => {
    loadRecentCheckIns()
  }, [])

  // Search members as user types
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchMembers()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  // Load recent check-ins
  const loadRecentCheckIns = async () => {
    try {
      const response = await attendanceAPI.getAll({ limit: 10 })
      setRecentCheckIns(response.data.asistencias || response.data || [])
    } catch (error) {
      console.error('Error loading recent check-ins:', error)
    }
  }

  // Search for members
  const searchMembers = async () => {
    setLoading(true)
    try {
      const response = await membersAPI.getAll({ search: searchTerm, limit: 5 })
      setSearchResults(response.data.miembros || response.data.data || [])
    } catch (error) {
      toast.error('Error al buscar clientes')
      console.error('Error searching members:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle check-in
  const handleCheckIn = async (miembroId, nombre) => {
    try {
      await attendanceAPI.register({ miembroId })
      
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle size={20} />
          <span><strong>{nombre}</strong> registrado correctamente</span>
        </div>,
        {
          duration: 3000,
          icon: '✅',
        }
      )
      
      // Clear search and reload recent check-ins
      setSearchTerm('')
      setSearchResults([])
      loadRecentCheckIns()
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar asistencia'
      
      if (error.response?.status === 403) {
        // Member has no active membership
        toast.error(
          <div className="flex flex-col gap-1">
            <strong>Membresía inactiva</strong>
            <span>{nombre} no tiene una membresía activa</span>
          </div>,
          {
            duration: 5000,
            icon: '❌',
          }
        )
      } else {
        toast.error(message)
      }
      
      console.error('Error checking in:', error)
    }
  }

  // Handle QR scanner (placeholder for actual QR implementation)
  const handleQrScan = () => {
    setQrScannerActive(!qrScannerActive)
    
    if (!qrScannerActive) {
      toast('Escáner QR activado', {
        icon: '📷',
        duration: 2000,
      })
      
      // Note: In a real implementation, you would integrate a QR scanner library like
      // react-qr-reader or html5-qrcode here
      toast('Función QR en desarrollo. Use búsqueda manual.', {
        icon: 'ℹ️',
        duration: 3000,
      })
    }
  }

  // Get member status
  const getMemberStatus = (member) => {
    if (!member.membresiaActiva) {
      return {
        text: 'Inactivo',
        className: 'bg-red-100 text-red-800',
        icon: <XCircle size={14} />,
        canCheckIn: false,
      }
    }
    
    return {
      text: 'Activo',
      className: 'bg-green-100 text-green-800',
      icon: <CheckCircle size={14} />,
      canCheckIn: true,
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Check-In</h1>
        <p className="text-gray-600 mt-1">Registra la entrada de los clientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Search and Check-in */}
        <div>
          {/* Search Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar Cliente</h2>
            
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  autoFocus
                />
              </div>

              {/* QR Scanner Button */}
              <button
                onClick={handleQrScan}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed transition ${
                  qrScannerActive
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                <QrCode size={24} />
                {qrScannerActive ? 'Desactivar escáner QR' : 'Usar escáner QR'}
              </button>
            </div>

            {/* Search Results */}
            {loading && (
              <div className="mt-4 flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            )}

            {!loading && searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((member) => {
                  const status = getMemberStatus(member)
                  return (
                    <div
                      key={member.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="text-primary-600" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{member.nombre}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${status.className}`}>
                          {status.icon}
                          {status.text}
                        </span>
                      </div>
                      
                      {status.canCheckIn ? (
                        <button
                          onClick={() => handleCheckIn(member.id, member.nombre)}
                          className="w-full mt-2 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                        >
                          Registrar Entrada
                        </button>
                      ) : (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Este cliente no tiene una membresía activa
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {!loading && searchTerm.length >= 2 && searchResults.length === 0 && (
              <div className="mt-4 text-center py-8">
                <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600">No se encontraron clientes</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{recentCheckIns.filter(ci => {
                    const today = new Date().toDateString()
                    return new Date(ci.fechaHora).toDateString() === today
                  }).length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Última hora</p>
                  <p className="text-2xl font-bold text-gray-900">{recentCheckIns.filter(ci => {
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
                    return new Date(ci.fechaHora) >= oneHourAgo
                  }).length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Check-ins */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Check-ins Recientes</h2>
          
          {recentCheckIns.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No hay check-ins recientes</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {recentCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="text-primary-600" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{checkIn.miembroNombre}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDateTime(checkIn.fechaHora)}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckIn
