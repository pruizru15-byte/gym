import { useState, useEffect } from 'react'
import { productsAPI } from '../../services/api'
import { 
  AlertTriangle, 
  Package, 
  Calendar,
  RefreshCw,
  TrendingDown,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

/**
 * AlertasInventario - Inventory alerts for low stock and expiring products
 */
const AlertasInventario = () => {
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [expiringProducts, setExpiringProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('low-stock') // low-stock, expiring

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const [lowStockRes, expiringRes] = await Promise.all([
        productsAPI.getLowStock(),
        productsAPI.getExpiringSoon()
      ])
      
      setLowStockProducts(lowStockRes.data)
      setExpiringProducts(expiringRes.data)
    } catch (error) {
      toast.error('Error al cargar alertas')
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate days until expiration
  const getDaysUntilExpiration = (date) => {
    const expirationDate = new Date(date)
    const today = new Date()
    const diffTime = expirationDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get urgency level for expiring products
  const getExpirationUrgency = (date) => {
    const days = getDaysUntilExpiration(date)
    if (days <= 7) return { label: 'Urgente', color: 'bg-red-100 text-red-800 border-red-200' }
    if (days <= 30) return { label: 'Próximo', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { label: 'Normal', color: 'bg-blue-100 text-blue-800 border-blue-200' }
  }

  // Get stock urgency level
  const getStockUrgency = (producto) => {
    const percentage = (producto.cantidad / producto.stock_minimo) * 100
    if (producto.cantidad === 0) {
      return { label: 'Sin stock', color: 'bg-red-100 text-red-800 border-red-200' }
    }
    if (percentage <= 50) {
      return { label: 'Crítico', color: 'bg-red-100 text-red-800 border-red-200' }
    }
    return { label: 'Bajo', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const totalAlerts = lowStockProducts.length + expiringProducts.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-yellow-500" />
            Alertas de Inventario
          </h1>
          <p className="text-gray-600 mt-1">
            {totalAlerts} alerta(s) activa(s)
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 text-sm font-medium mb-1">Stock Bajo</p>
              <p className="text-4xl font-bold text-yellow-900">
                {lowStockProducts.length}
              </p>
            </div>
            <div className="bg-yellow-200 p-3 rounded-full">
              <TrendingDown className="w-8 h-8 text-yellow-700" />
            </div>
          </div>
          <p className="text-yellow-700 text-sm mt-3">
            Productos con stock por debajo del mínimo
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 text-sm font-medium mb-1">Por Vencer</p>
              <p className="text-4xl font-bold text-red-900">
                {expiringProducts.length}
              </p>
            </div>
            <div className="bg-red-200 p-3 rounded-full">
              <Clock className="w-8 h-8 text-red-700" />
            </div>
          </div>
          <p className="text-red-700 text-sm mt-3">
            Productos próximos a vencer
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('low-stock')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'low-stock'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Stock Bajo ({lowStockProducts.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('expiring')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'expiring'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                Por Vencer ({expiringProducts.length})
              </div>
            </button>
          </div>
        </div>

        {/* Low Stock Tab */}
        {activeTab === 'low-stock' && (
          <div className="p-6">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay alertas de stock bajo
                </h3>
                <p className="text-gray-600">
                  Todos los productos tienen stock suficiente
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((producto) => {
                  const urgency = getStockUrgency(producto)
                  return (
                    <div
                      key={producto.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {producto.nombre}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${urgency.color}`}>
                              {urgency.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Código:</span>
                              <p className="font-medium text-gray-900">{producto.codigo}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Stock Actual:</span>
                              <p className="font-medium text-red-600">
                                {producto.cantidad} {producto.unidad}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Stock Mínimo:</span>
                              <p className="font-medium text-gray-900">
                                {producto.stock_minimo} {producto.unidad}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Categoría:</span>
                              <p className="font-medium text-gray-900">{producto.categoria}</p>
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/tienda/productos/${producto.id}/editar`}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                        >
                          Reabastecer
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Expiring Tab */}
        {activeTab === 'expiring' && (
          <div className="p-6">
            {expiringProducts.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay productos por vencer
                </h3>
                <p className="text-gray-600">
                  Todos los productos tienen fechas de vencimiento lejanas
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiringProducts.map((producto) => {
                  const urgency = getExpirationUrgency(producto.fecha_vencimiento)
                  const daysLeft = getDaysUntilExpiration(producto.fecha_vencimiento)
                  
                  return (
                    <div
                      key={producto.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {producto.nombre}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${urgency.color}`}>
                              {urgency.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Código:</span>
                              <p className="font-medium text-gray-900">{producto.codigo}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Vence en:</span>
                              <p className={`font-bold ${daysLeft <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                                {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Fecha de Venc.:</span>
                              <p className="font-medium text-gray-900">
                                {new Date(producto.fecha_vencimiento).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Stock:</span>
                              <p className="font-medium text-gray-900">
                                {producto.cantidad} {producto.unidad}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/tienda/productos/${producto.id}/editar`}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {totalAlerts > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Acciones Recomendadas
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {lowStockProducts.length > 0 && (
                  <li>• Contacta a tus proveedores para reabastecer productos con stock bajo</li>
                )}
                {expiringProducts.length > 0 && (
                  <li>• Crea promociones para productos próximos a vencer</li>
                )}
                <li>• Actualiza las cantidades después de recibir inventario</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertasInventario
