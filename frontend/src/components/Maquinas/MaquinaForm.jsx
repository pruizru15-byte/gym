import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { machinesAPI } from '../../services/api'
import { Dumbbell, ArrowLeft, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * MaquinaForm - Form to create/edit machines with maintenance scheduling
 */
const MaquinaForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    marca: '',
    modelo: '',
    categoria: 'Cardio',
    descripcion: '',
    ubicacion: '',
    estado: 'disponible',
    fecha_adquisicion: '',
    costo: '',
    vida_util_anos: '',
    frecuencia_mantenimiento_dias: '',
    ultimo_mantenimiento: '',
    proximo_mantenimiento: '',
    instrucciones_uso: '',
    notas: '',
  })

  // Categories and status options
  const categories = ['Cardio', 'Fuerza', 'Peso Libre', 'Funcional', 'Otro']
  const statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'mantenimiento', label: 'En Mantenimiento' },
    { value: 'fuera_servicio', label: 'Fuera de Servicio' },
  ]

  useEffect(() => {
    if (isEditing) {
      fetchMaquina()
    }
  }, [id])

  // Calculate next maintenance date when last maintenance or frequency changes
  useEffect(() => {
    if (formData.ultimo_mantenimiento && formData.frecuencia_mantenimiento_dias) {
      const lastDate = new Date(formData.ultimo_mantenimiento)
      const days = parseInt(formData.frecuencia_mantenimiento_dias)
      if (!isNaN(days)) {
        const nextDate = new Date(lastDate)
        nextDate.setDate(nextDate.getDate() + days)
        setFormData(prev => ({
          ...prev,
          proximo_mantenimiento: nextDate.toISOString().split('T')[0]
        }))
      }
    }
  }, [formData.ultimo_mantenimiento, formData.frecuencia_mantenimiento_dias])

  const fetchMaquina = async () => {
    try {
      setLoading(true)
      const response = await machinesAPI.getById(id)
      const maquina = response.data
      
      setFormData({
        codigo: maquina.codigo || '',
        nombre: maquina.nombre || '',
        marca: maquina.marca || '',
        modelo: maquina.modelo || '',
        categoria: maquina.categoria || 'Cardio',
        descripcion: maquina.descripcion || '',
        ubicacion: maquina.ubicacion || '',
        estado: maquina.estado || 'disponible',
        fecha_adquisicion: maquina.fecha_adquisicion?.split('T')[0] || '',
        costo: maquina.costo || '',
        vida_util_anos: maquina.vida_util_anos || '',
        frecuencia_mantenimiento_dias: maquina.frecuencia_mantenimiento_dias || '',
        ultimo_mantenimiento: maquina.ultimo_mantenimiento?.split('T')[0] || '',
        proximo_mantenimiento: maquina.proximo_mantenimiento?.split('T')[0] || '',
        instrucciones_uso: maquina.instrucciones_uso || '',
        notas: maquina.notas || '',
      })
    } catch (error) {
      toast.error('Error al cargar máquina')
      console.error('Error fetching machine:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.nombre || !formData.codigo) {
      toast.error('Por favor completa los campos requeridos')
      return
    }

    try {
      setLoading(true)

      if (isEditing) {
        await machinesAPI.update(id, formData)
        toast.success('Máquina actualizada exitosamente')
      } else {
        await machinesAPI.create(formData)
        toast.success('Máquina creada exitosamente')
      }

      navigate('/maquinas')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar máquina')
      console.error('Error saving machine:', error)
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
          onClick={() => navigate('/maquinas')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Máquina' : 'Nueva Máquina'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Actualiza la información de la máquina' : 'Completa los datos de la nueva máquina'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="MAQ-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Caminadora Profesional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Life Fitness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo
                </label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="T3-TRACK-CONSOLE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Área de Cardio - Zona A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Descripción de la máquina..."
                />
              </div>
            </div>
          </div>

          {/* Acquisition Info */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Adquisición
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Adquisición
                </label>
                <input
                  type="date"
                  name="fecha_adquisicion"
                  value={formData.fecha_adquisicion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo
                </label>
                <input
                  type="number"
                  name="costo"
                  value={formData.costo}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vida Útil (años)
                </label>
                <input
                  type="number"
                  name="vida_util_anos"
                  value={formData.vida_util_anos}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Programa de Mantenimiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia de Mantenimiento (días)
                </label>
                <input
                  type="number"
                  name="frecuencia_mantenimiento_dias"
                  value={formData.frecuencia_mantenimiento_dias}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Días entre cada mantenimiento programado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Último Mantenimiento
                </label>
                <input
                  type="date"
                  name="ultimo_mantenimiento"
                  value={formData.ultimo_mantenimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Próximo Mantenimiento
                </label>
                <input
                  type="date"
                  name="proximo_mantenimiento"
                  value={formData.proximo_mantenimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se calcula automáticamente si defines frecuencia y último mantenimiento
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información Adicional
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones de Uso
                </label>
                <textarea
                  name="instrucciones_uso"
                  value={formData.instrucciones_uso}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Instrucciones básicas para el uso correcto de la máquina..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Notas adicionales sobre la máquina..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/maquinas')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                <Dumbbell className="w-5 h-5" />
                {isEditing ? 'Actualizar Máquina' : 'Crear Máquina'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MaquinaForm
