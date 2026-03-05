import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI } from '../../services/api'
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Power,
  PowerOff,
  Filter,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * ProductosList - List all products with server-side search, filter, pagination
 */
const ProductosList = () => {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '' (all), 'true' (active), 'false' (inactive)
  const [stockFilter, setStockFilter] = useState('') // '' (all), 'true' (low)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 12

  // Dynamic Categories for filtering
  const [categoriesList, setCategoriesList] = useState([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories()
      setCategoriesList(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    // Debounce search input
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1) // Reset page on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchProductos()
  }, [page, searchTerm, categoryFilter, statusFilter, stockFilter])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit,
        search: searchTerm,
        categoria: categoryFilter,
        activo: statusFilter,
        stock_bajo: stockFilter
      }

      const response = await productsAPI.getAll(params)
      // Supports both { productos, pagination } and plain array formats
      if (response.data.pagination) {
        setProductos(response.data.productos || [])
        setTotalPages(response.data.pagination.pages || 1)
        setTotalItems(response.data.pagination.total || 0)
      } else {
        setProductos(response.data.productos || response.data || [])
        setTotalPages(1)
        setTotalItems(response.data.length || 0)
      }
    } catch (error) {
      toast.error('Error al cargar productos')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (producto) => {
    const newStatus = producto.activo === 1 ? 0 : 1
    const actionText = newStatus === 1 ? 'activar' : 'desactivar'
    if (!window.confirm(`¿Estás seguro de ${actionText} este producto?`)) return

    try {
      // We can use the update endpoint to change only the status if the backend supports partial updates
      // Alternatively, we send back the required fields to meet validation
      const payload = {
        nombre: producto.nombre,
        precio_venta: producto.precio_venta || producto.precio || 1, // Fallback if property differs
        activo: newStatus
      }

      await productsAPI.update(producto.id, payload)
      toast.success(`Producto ${newStatus === 1 ? 'activado' : 'desactivado'} exitosamente`)
      fetchProductos()
    } catch (error) {
      toast.error(`Error al ${actionText} producto`)
      console.error(`Error toggling product status:`, error)
    }
  }

  // Get stock status
  const getStockStatus = (producto) => {
    // Backend uses stock_actual and stock_minimo. Fallback to frontend's cantidad
    const qty = producto.stock_actual !== undefined ? producto.stock_actual : producto.cantidad
    const min = producto.stock_minimo !== undefined ? producto.stock_minimo : 5

    if (qty === 0) {
      return { label: 'Sin stock', color: 'bg-red-100 text-red-800' }
    } else if (qty <= min) {
      return { label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-800' }
    }
    return { label: 'En stock', color: 'bg-green-100 text-green-800' }
  }

  const getPrice = (producto) => {
    return producto.precio_venta !== undefined ? producto.precio_venta : producto.precio
  }

  const getStock = (producto) => {
    return producto.stock_actual !== undefined ? producto.stock_actual : producto.cantidad
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Productos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalItems} producto(s) en total
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/tienda/productos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${showFilters || categoryFilter || statusFilter || stockFilter
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-900'
              }`}
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filtros</span>
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Todas</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id || cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Inventario
              </label>
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Todos</option>
                <option value="true">Stock bajo o nulo</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(categoryFilter || statusFilter || stockFilter) && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={() => {
                    setCategoryFilter('')
                    setStatusFilter('')
                    setStockFilter('')
                    setPage(1)
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
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
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {searchTerm || categoryFilter || statusFilter || stockFilter
              ? 'No hay resultados que coincidan con tu búsqueda. Intenta ajustar los filtros.'
              : 'Todavía no has agregado ningún producto al inventario.'}
          </p>
          {!(searchTerm || categoryFilter || statusFilter || stockFilter) && (
            <div className="mt-6">
              <Link
                to="/tienda/productos/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Agregar el primer producto
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((producto) => {
              const stockStatus = getStockStatus(producto)
              const isActive = producto.activo === 1

              return (
                <div
                  key={producto.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${!isActive ? 'border-gray-200 dark:border-gray-700 opacity-75' : 'border-gray-200 dark:border-gray-700 dark:border-gray-700'
                    }`}
                >
                  {/* Product Image */}
                  <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-900 relative group">
                    {producto.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${!isActive ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 dark:bg-gray-700">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}

                    {/* Status Overlays */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {!isActive && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-900/80 text-white backdrop-blur-sm">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {isActive && getStock(producto) <= (producto.stock_minimo || 5) && (
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white shadow-sm" title="Stock Bajo">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <div className="mb-4">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1" title={producto.nombre}>
                          {producto.nombre}
                        </h3>
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 px-2 py-0.5 rounded">
                          ${Number(getPrice(producto) || 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                        <span>{producto.codigo}</span>
                        <span>{producto.categoria}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between py-3 border-y border-gray-100 dark:border-gray-700 mb-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stock disponible</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white text-lg leading-none">
                            {getStock(producto)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to={`/tienda/productos/${producto.id}/editar`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg outline-none hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 hover:text-gray-900 dark:text-white transition-colors font-medium text-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Link>
                      <button
                        onClick={() => toggleStatus(producto)}
                        title={isActive ? 'Desactivar producto' : 'Activar producto'}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg outline-none transition-colors border ${isActive
                          ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-200'
                          : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100 hover:border-green-200'
                          }`}
                      >
                        {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl mt-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando página <span className="font-medium">{page}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 disabled:opacity-50"
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 disabled:opacity-50"
                    >
                      <span className="sr-only">Siguiente</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ProductosList
