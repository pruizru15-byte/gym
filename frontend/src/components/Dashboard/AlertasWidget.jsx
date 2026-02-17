import { useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react'
import { getRelativeTime } from '../../utils/formatters'

/**
 * Widget displaying alerts and notifications
 */
const AlertasWidget = () => {
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead 
  } = useNotifications()

  useEffect(() => {
    fetchNotifications({ limit: 5 })
  }, [])

  // Get icon based on alert type
  const getAlertIcon = (tipo) => {
    switch (tipo) {
      case 'vencimiento':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'pago_pendiente':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'renovacion':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  // Get background color based on alert type
  const getAlertBgColor = (tipo) => {
    switch (tipo) {
      case 'vencimiento':
        return 'bg-orange-50'
      case 'pago_pendiente':
        return 'bg-red-50'
      case 'renovacion':
        return 'bg-blue-50'
      default:
        return 'bg-gray-50'
    }
  }

  const handleDismiss = async (id) => {
    await markAsRead(id)
    fetchNotifications({ limit: 5 })
  }

  if (loading) {
    return (
      <div className="card h-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Alertas</h2>
        {notifications.length > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
            {notifications.filter(n => !n.leida).length}
          </span>
        )}
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">No hay alertas pendientes</p>
          </div>
        ) : (
          notifications.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg ${getAlertBgColor(alert.tipo)} ${
                alert.leida ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.tipo)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {alert.titulo}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {alert.mensaje}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getRelativeTime(alert.fecha_creacion)}
                  </p>
                </div>

                {!alert.leida && (
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
                    aria-label="Marcar como leída"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View all link */}
      {notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todas las alertas →
          </button>
        </div>
      )}
    </div>
  )
}

export default AlertasWidget
