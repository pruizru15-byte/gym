import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productsAPI } from '../../services/api'
import { Package, Upload, X, ArrowLeft, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * ProductoForm - Form to create/edit products with image upload
 */
const ProductoForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'Suplementos',
    precio: '',
    costo: '',
    cantidad: '',
    unidad: 'unidad',
    stock_minimo: '',
    fecha_vencimiento: '',
    proveedor: '',
    activo: 1, // 1 for true/active, 0 for false/inactive
    imagen: null,
  })

  // Dynamic Categories and fixed units
  const [categoriesList, setCategoriesList] = useState([])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryData, setNewCategoryData] = useState({ nombre: '', descripcion: '' })
  const [savingCategory, setSavingCategory] = useState(false)

  const units = ['unidad', 'kg', 'g', 'l', 'ml']

  useEffect(() => {
    fetchCategories()
    if (isEditing) {
      fetchProducto()
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories()
      setCategoriesList(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducto = async () => {
    try {
      setLoading(true)
      const response = await productsAPI.getById(id)
      const producto = response.data

      setFormData({
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || 'Suplementos',
        precio: producto.precio_venta || '',
        costo: producto.precio_costo || '',
        cantidad: producto.stock_actual || '',
        unidad: producto.unidad || 'unidad',
        stock_minimo: producto.stock_minimo || '',
        fecha_vencimiento: producto.fecha_vencimiento?.split('T')[0] || '',
        proveedor: producto.proveedor || '',
        activo: producto.activo !== undefined ? producto.activo : 1,
        imagen: null,
      })

      if (producto.imagen) {
        setImagePreview(producto.imagen)
      }
    } catch (error) {
      toast.error('Error al cargar producto')
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen')
        return
      }

      setFormData(prev => ({ ...prev, imagen: file }))

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imagen: null }))
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.nombre || !formData.precio || !formData.cantidad) {
      toast.error('Por favor completa los campos requeridos')
      return
    }

    try {
      setLoading(true)

      // Prepare form data for multipart/form-data
      const submitData = new FormData()

      // Mapping fields to backend expected names
      const fieldMapping = {
        precio: 'precio_venta',
        costo: 'precio_costo',
        cantidad: 'stock_actual'
      }

      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          const mappedKey = fieldMapping[key] || key
          submitData.append(mappedKey, formData[key])
        }
      })

      if (isEditing && formData.imagen === null && !imagePreview) {
        submitData.append('eliminar_imagen', 'true')
      }

      if (isEditing) {
        await productsAPI.update(id, submitData)
        toast.success('Producto actualizado exitosamente')
      } else {
        await productsAPI.create(submitData)
        toast.success('Producto creado exitosamente')
      }

      navigate('/tienda/productos')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto')
      console.error('Error saving product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tienda/productos')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditing ? 'Actualiza la información del producto' : 'Completa los datos del nuevo producto'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700">
        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Imagen del Producto
            </label>

            {imagePreview ? (
              <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Subir imagen</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex items-center mt-6">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  name="activo"
                  className="sr-only"
                  checked={formData.activo === 1}
                  onChange={handleChange}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${formData.activo === 1 ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white dark:bg-gray-800 w-6 h-6 rounded-full transition-transform ${formData.activo === 1 ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <div className="ml-3 text-sm font-medium text-gray-700">
                {formData.activo === 1 ? 'Producto Activo' : 'Producto Inactivo'}
              </div>
            </label>
            <p className="ml-4 text-xs text-gray-500">
              Desactiva el producto si no deseas que aparezca en la lista de ventas.
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="SKU-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Proteína Whey"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Descripción del producto..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Nueva Categoría
                </button>
              </div>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.id || cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proveedor
              </label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nombre del proveedor"
              />
            </div>
          </div>

          {/* Pricing and Stock */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Precio e Inventario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio de Venta <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Costo
                </label>
                <input
                  type="number"
                  name="costo"
                  value={formData.costo}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unidad <span className="text-red-500">*</span>
                </label>
                <select
                  name="unidad"
                  value={formData.unidad}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  name="stock_minimo"
                  value={formData.stock_minimo}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  name="fecha_vencimiento"
                  value={formData.fecha_vencimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/tienda/productos')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
              </>
            )}
          </button>
        </div>
      </form>
      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Nueva Categoría</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!newCategoryData.nombre) return
              try {
                setSavingCategory(true)
                const res = await productsAPI.createCategory(newCategoryData)
                toast.success('Categoría creada exitosamente')
                setCategoriesList(prev => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                setFormData(prev => ({ ...prev, categoria: res.data.nombre }))
                setNewCategoryData({ nombre: '', descripcion: '' })
                setIsCategoryModalOpen(false)
              } catch (err) {
                toast.error(err.response?.data?.error || 'Error al crear la categoría')
              } finally {
                setSavingCategory(false)
              }
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de Categoría <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryData.nombre}
                    onChange={(e) => setNewCategoryData(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej. Alimentos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={newCategoryData.descripcion}
                    onChange={(e) => setNewCategoryData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Descripción opcional..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600 dark:border-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCategory || !newCategoryData.nombre}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {savingCategory ? 'Guardando...' : 'Guardar Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductoForm
