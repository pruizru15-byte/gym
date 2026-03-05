import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI, membershipsAPI } from '../../services/api'
import {
  AlertTriangle, TrendingDown, Clock, Package,
  CheckCircle, ArrowRight, RefreshCw
} from 'lucide-react'

/**
 * Widget displaying inventory alerts with direct links
 */
const AlertasWidget = () => {
  const [lowStock, setLowStock] = useState([])
  const [expiringProducts, setExpiringProducts] = useState([])
  const [expiringMemberships, setExpiringMemberships] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const [stockRes, productVencRes, membVencRes] = await Promise.all([
        productsAPI.getLowStock(),
        productsAPI.getExpiringSoon(),
        membershipsAPI.getExpiring(7) // membresías que vencen en 7 días
      ])
      setLowStock(Array.isArray(stockRes.data) ? stockRes.data.slice(0, 3) : [])
      setExpiringProducts(Array.isArray(productVencRes.data) ? productVencRes.data.slice(0, 3) : [])
      setExpiringMemberships(Array.isArray(membVencRes.data) ? membVencRes.data.slice(0, 3) : [])
    } catch (err) {
      console.error('Error fetching dashboard alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalAlertas = lowStock.length + expiringProducts.length + expiringMemberships.length

  if (loading) {
    return (
      <div className="card h-full">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alertas</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Alertas
        </h2>
        <div className="flex items-center gap-2">
          {totalAlertas > 0 && (
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
              {totalAlertas}
            </span>
          )}
          <button
            onClick={fetchAlerts}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {totalAlertas === 0 ? (
          <div className="text-center py-10">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Todo en orden, sin alertas</p>
          </div>
        ) : (
          <>
            {/* ── Stock Bajo ── */}
            {lowStock.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-yellow-500" />
                    Stock Bajo
                  </p>
                  <Link
                    to="/tienda/alertas"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
                  >
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {lowStock.map(p => (
                    <Link
                      key={p.id}
                      to="/tienda/alertas"
                      className="flex items-center justify-between p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.nombre}</span>
                      </div>
                      <span className={`text-xs font-bold ml-2 flex-shrink-0 ${p.stock_actual === 0 ? 'text-red-600' : 'text-yellow-700'}`}>
                        {p.stock_actual === 0 ? 'Agotado' : `${p.stock_actual} uds`}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Productos por Vencer ── */}
            {expiringProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    Productos por Vencer
                  </p>
                  <Link
                    to="/tienda/alertas"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
                  >
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {expiringProducts.map(p => {
                    const days = Math.ceil((new Date(p.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
                    return (
                      <Link
                        key={p.id}
                        to="/tienda/alertas"
                        className="flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 truncate">{p.nombre}</span>
                        </div>
                        <span className="text-xs font-bold text-red-600 ml-2 flex-shrink-0">
                          {days <= 0 ? 'Hoy' : `${days}d`}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Membresías por Vencer (7 días) ── */}
            {expiringMemberships.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                    Membresías (7 días)
                  </p>
                  <Link
                    to="/membresias/vencimientos"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
                  >
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {expiringMemberships.map(m => {
                    const days = Math.ceil((new Date(m.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
                    const nombre = `${m.cliente_nombre || ''} ${m.cliente_apellido || ''}`.trim()
                    return (
                      <Link
                        key={m.id}
                        to={`/membresias/renovar/${m.cliente_id}`}
                        className="flex items-center justify-between p-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{nombre}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.membresia_nombre}</p>
                        </div>
                        <span className={`text-xs font-bold ml-2 flex-shrink-0 ${days <= 1 ? 'text-red-600' : 'text-orange-600'}`}>
                          {days <= 0 ? 'Hoy' : `${days}d`}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer links */}
      {totalAlertas > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <Link
            to="/tienda/alertas"
            className="flex-1 text-center text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            Alertas Inventario →
          </Link>
          <Link
            to="/membresias/vencimientos"
            className="flex-1 text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Vencimientos →
          </Link>
        </div>
      )}
    </div>
  )
}

export default AlertasWidget
