import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  User, Mail, Phone, MapPin, Calendar, Edit, CreditCard,
  Clock, Activity, AlertCircle, ArrowLeft, RefreshCw
} from 'lucide-react'
import { membersAPI, membershipsAPI, attendanceAPI, paymentsAPI } from '../../services/api'
import { formatDate, formatDateTime, formatCurrency, formatPhone, daysUntil } from '../../utils/formatters'
import toast from 'react-hot-toast'

const ClienteDetalle = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [cliente, setCliente] = useState(null)
  const [membresiaActiva, setMembresiaActiva] = useState(null)
  const [historialAsistencias, setHistorialAsistencias] = useState([])
  const [historialPagos, setHistorialPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info') // info, asistencias, pagos

  useEffect(() => {
    loadClienteData()
  }, [id])

  // Load all client data
  const loadClienteData = async () => {
    setLoading(true)
    try {
      // Load client info
      const clienteRes = await membersAPI.getById(id)
      const clienteData = clienteRes.data.miembro || clienteRes.data
      setCliente(clienteData)

      // Load active membership
      try {
        const membresiaRes = await membershipsAPI.getActive(id)
        setMembresiaActiva(membresiaRes.data.membresia || membresiaRes.data)
      } catch (error) {
        // No active membership
        setMembresiaActiva(null)
      }

      // Load attendance history
      const asistenciasRes = await attendanceAPI.getByMember(id, { limit: 10 })
      setHistorialAsistencias(asistenciasRes.data.asistencias || asistenciasRes.data || [])

      // Load payment history
      if (clienteData.membresiaActualId) {
        const pagosRes = await paymentsAPI.getByMembership(clienteData.membresiaActualId)
        setHistorialPagos(pagosRes.data.pagos || pagosRes.data || [])
      }
    } catch (error) {
      toast.error('Error al cargar datos del cliente')
      console.error('Error loading client data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get membership status
  const getMembresiaStatus = () => {
    if (!membresiaActiva) {
      return {
        text: 'Sin membresía activa',
        className: 'bg-red-100 text-red-800',
        icon: <AlertCircle size={16} />
      }
    }

    const days = daysUntil(membresiaActiva.fechaVencimiento)
    
    if (days === null || days < 0) {
      return {
        text: 'Vencida',
        className: 'bg-red-100 text-red-800',
        icon: <AlertCircle size={16} />
      }
    }
    
    if (days <= 7) {
      return {
        text: `Vence en ${days} ${days === 1 ? 'día' : 'días'}`,
        className: 'bg-yellow-100 text-yellow-800',
        icon: <Clock size={16} />
      }
    }

    return {
      text: 'Activa',
      className: 'bg-green-100 text-green-800',
      icon: <Activity size={16} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cliente no encontrado</h3>
          <button
            onClick={() => navigate('/clientes')}
            className="text-primary-600 hover:text-primary-800"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  const status = getMembresiaStatus()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/clientes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Volver a clientes
        </button>
        
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="text-primary-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{cliente.nombre}</h1>
              <p className="text-gray-600">ID: {cliente.id}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              to={`/clientes/${id}/editar`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Edit size={18} />
              Editar
            </Link>
            {membresiaActiva ? (
              <Link
                to={`/membresias/renovar/${id}`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Renovar
              </Link>
            ) : (
              <Link
                to={`/membresias/nueva/${id}`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
              >
                <CreditCard size={18} />
                Asignar Membresía
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Membership Status Alert */}
      <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${status.className}`}>
        {status.icon}
        <span className="font-medium">{status.text}</span>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab('asistencias')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'asistencias'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial de Asistencias
          </button>
          <button
            onClick={() => setActiveTab('pagos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pagos'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial de Pagos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Información Personal
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{cliente.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="text-gray-900">{formatPhone(cliente.telefono)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                  <p className="text-gray-900">{formatDate(cliente.fechaNacimiento)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="text-gray-900">{cliente.direccion || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Membership Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Membresía Actual
            </h2>
            {membresiaActiva ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="text-lg font-semibold text-gray-900">{membresiaActiva.planNombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Inicio</p>
                  <p className="text-gray-900">{formatDate(membresiaActiva.fechaInicio)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Vencimiento</p>
                  <p className="text-gray-900">{formatDate(membresiaActiva.fechaVencimiento)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monto Pagado</p>
                  <p className="text-lg font-semibold text-primary-600">
                    {formatCurrency(membresiaActiva.monto)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600">Sin membresía activa</p>
                <Link
                  to={`/membresias/nueva/${id}`}
                  className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-800"
                >
                  <CreditCard size={16} />
                  Asignar membresía
                </Link>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Contacto de Emergencia
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="text-gray-900">{cliente.emergenciaContacto || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="text-gray-900">{formatPhone(cliente.emergenciaTelefono)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{cliente.notas || 'Sin notas adicionales'}</p>
          </div>
        </div>
      )}

      {activeTab === 'asistencias' && (
        <div className="bg-white rounded-lg shadow-sm">
          {historialAsistencias.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin asistencias registradas</h3>
              <p className="text-gray-600">Las asistencias aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha y Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historialAsistencias.map((asistencia) => (
                    <tr key={asistencia.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock size={14} className="mr-2 text-gray-400" />
                          {formatDateTime(asistencia.fechaHora)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Check-in
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pagos' && (
        <div className="bg-white rounded-lg shadow-sm">
          {historialPagos.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin pagos registrados</h3>
              <p className="text-gray-600">Los pagos aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historialPagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(pago.fechaPago)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pago.concepto || 'Pago de membresía'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {pago.metodoPago || 'Efectivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(pago.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ClienteDetalle
