import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, X, User, Mail, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react'
import { membersAPI } from '../../services/api'
import toast from 'react-hot-toast'

const ClienteForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    direccion: '',
    condicionesMedicas: '',
    alergias: '',
    emergenciaContacto: '',
    emergenciaTelefono: '',
    notas: '',
  })
  const [errors, setErrors] = useState({})

  // Load client data if editing
  useEffect(() => {
    if (isEditing) {
      loadCliente()
    }
  }, [id])

  const loadCliente = async () => {
    setLoading(true)
    try {
      const response = await membersAPI.getById(id)
      const cliente = response.data.miembro || response.data

      // Format date for input
      const fechaNacimiento = cliente.fechaNacimiento
        ? new Date(cliente.fechaNacimiento).toISOString().split('T')[0]
        : ''

      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        fechaNacimiento,
        direccion: cliente.direccion || '',
        condicionesMedicas: cliente.condiciones_medicas || cliente.condicionesMedicas || '',
        alergias: cliente.alergias || '',
        emergenciaContacto: cliente.contacto_emergencia || cliente.emergenciaContacto || '', // Handle snake_case from DB
        emergenciaTelefono: cliente.telefono_emergencia || cliente.emergenciaTelefono || '', // Handle snake_case from DB
        notas: cliente.notas || '',
      })
    } catch (error) {
      toast.error('Error al cargar cliente')
      navigate('/clientes')
    } finally {
      setLoading(false)
    }
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validate form
  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (!/^\d{9}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'El teléfono debe tener 9 dígitos'
    }

    if (formData.fechaNacimiento) {
      const birthDate = new Date(formData.fechaNacimiento)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 16 || age > 100) {
        newErrors.fechaNacimiento = 'La edad debe estar entre 16 y 100 años'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        await membersAPI.update(id, formData)
        toast.success('Cliente actualizado correctamente')
      } else {
        // Generate a temporary code if one doesn't exist to satisfy backend validation
        // (This handles cases where the backend hasn't been restarted with the new auto-generation logic)
        const payload = {
          ...formData,
          codigo: formData.codigo || `CLI-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        };
        await membersAPI.create(payload)
        toast.success('Cliente creado correctamente')
      }
      navigate('/clientes')
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar cliente'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isEditing ? 'Actualiza la información del cliente' : 'Registra un nuevo miembro del gimnasio'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={20} />
              Información Personal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:border-gray-600'
                    }`}
                  placeholder="Ej: Juan"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.nombre}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.apellido ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:border-gray-600'
                    }`}
                  placeholder="Ej: Pérez García"
                />
                {errors.apellido && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.apellido}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:border-gray-600'
                      }`}
                    placeholder="ejemplo@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    maxLength={9}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.telefono ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:border-gray-600'
                      }`}
                    placeholder="987654321"
                  />
                </div>
                {errors.telefono && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.telefono}
                  </p>
                )}
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de nacimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.fechaNacimiento ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:border-gray-600'
                      }`}
                  />
                </div>
                {errors.fechaNacimiento && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.fechaNacimiento}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Calle, número, colonia, ciudad"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Información Médica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Medical Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condiciones Médicas
                </label>
                <textarea
                  name="condicionesMedicas"
                  value={formData.condicionesMedicas}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Lesiones, enfermedades crónicas, etc."
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alergias
                </label>
                <textarea
                  name="alergias"
                  value={formData.alergias}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Medicamentos, alimentos, etc."
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Contacto de Emergencia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency Contact Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="emergenciaContacto"
                  value={formData.emergenciaContacto}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nombre del contacto"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="emergenciaTelefono"
                    value={formData.emergenciaTelefono}
                    onChange={handleChange}
                    maxLength={9}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="987654321"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas adicionales
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Información adicional sobre el cliente (condiciones médicas, preferencias, etc.)"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2"
          >
            <X size={18} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEditing ? 'Actualizar' : 'Crear'} Cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ClienteForm
