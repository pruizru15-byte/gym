import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI } from '../../services/api'
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  Filter,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * ProductosList - List all products with search, filter, and stock alerts
 */
const ProductosList = () => {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('all') // all, low, out
  const [showFilters, setShowFilters] = useState(false)

  // Categories for filtering
  const categories = ['Suplementos', 'Bebidas', 'Snacks', 'Accesorios', 'Ropa', 'Otro']

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const response = await productsAPI.getAll()
      setProductos(response.data.productos || response.data || [])
    } catch (error) {
      toast.error('Error al cargar productos')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return

    try {
      await productsAPI.delete(id)
      toast.success('Producto eliminado exitosamente')
      fetchProductos()
    } catch (error) {
      toast.error('Error al eliminar producto')
      console.error('Error deleting product:', error)
    }
  }

  // Filter products based on search, category, and stock
  const filteredProductos = productos.filter((producto) => {
    const matchesSearch =
      producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      !categoryFilter || producto.categoria === categoryFilter

    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && producto.cantidad <= producto.stock_minimo) ||
      (stockFilter === 'out' && producto.cantidad === 0)

    return matchesSearch && matchesCategory && matchesStock
  })

  // Get stock status
  const getStockStatus = (producto) => {
    if (producto.cantidad === 0) {
      return { label: 'Sin stock', color: 'bg-red-100 text-red-800' }
    } else if (producto.cantidad <= producto.stock_minimo) {
      return { label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-800' }
    }
    return { label: 'En stock', color: 'bg-green-100 text-green-800' }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">
            {filteredProductos.length} producto(s) encontrado(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/tienda/productos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Stock
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="low">Stock bajo</option>
                <option value="out">Sin stock</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(categoryFilter || stockFilter !== 'all') && (
              <div className="sm:col-span-2">
                <button
                  onClick={() => {
                    setCategoryFilter('')
                    setStockFilter('all')
                  }}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProductos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-600">
            {searchTerm || categoryFilter || stockFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer producto'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProductos.map((producto) => {
            const stockStatus = getStockStatus(producto)
            return (
              <div
                key={producto.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {/* Stock Alert Badge */}
                  {producto.cantidad <= producto.stock_minimo && (
                    <div className="absolute top-2 right-2">
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {producto.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">{producto.codigo}</p>
                  </div>

                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-semibold text-gray-900">
                        ${Number(producto.precio).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-semibold text-gray-900">
                        {producto.cantidad} {producto.unidad}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoría:</span>
                      <span className="text-gray-900">{producto.categoria}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/tienda/productos/${producto.id}/editar`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProductosList
