import { useState, useEffect } from 'react'
import { Building2, MapPin, Phone, Mail, Clock, Camera, Save, RotateCcw } from 'lucide-react'
import { configuracionAPI } from '../../services/api'
import toast from 'react-hot-toast'

const GeneralSettings = () => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        nombre_gimnasio: '',
        direccion: '',
        telefono: '',
        email: '',
        horario_apertura: '06:00',
        horario_cierre: '22:00',
        logo: '',
    })
    const [originalForm, setOriginalForm] = useState({})

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await configuracionAPI.getGymInfo()
            const data = res.data
            const newForm = {
                nombre_gimnasio: data.nombre_gimnasio || '',
                direccion: data.direccion || '',
                telefono: data.telefono || '',
                email: data.email || '',
                horario_apertura: data.horario_apertura || '06:00',
                horario_cierre: data.horario_cierre || '22:00',
                logo: data.logo || '',
            }
            setForm(newForm)
            setOriginalForm(newForm)
        } catch (error) {
            console.error('Error loading gym info:', error)
            // Try initializing defaults
            try {
                await configuracionAPI.initializeDefaults()
                const res = await configuracionAPI.getGymInfo()
                const data = res.data
                const newForm = {
                    nombre_gimnasio: data.nombre_gimnasio || 'Mi Gimnasio',
                    direccion: data.direccion || '',
                    telefono: data.telefono || '',
                    email: data.email || '',
                    horario_apertura: data.horario_apertura || '06:00',
                    horario_cierre: data.horario_cierre || '22:00',
                    logo: data.logo || '',
                }
                setForm(newForm)
                setOriginalForm(newForm)
            } catch {
                toast.error('Error al cargar configuración')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await configuracionAPI.updateGymInfo(form)
            setOriginalForm(form)
            toast.success('Datos del gimnasio guardados')
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        setForm(originalForm)
        toast('Cambios descartados', { icon: '↩️' })
    }

    const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm)

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <Building2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Datos del Gimnasio</h3>
                    <p className="text-sm text-gray-500">Información general de tu gimnasio</p>
                </div>
            </div>

            {/* Logo upload */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                    {form.logo ? (
                        <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="w-8 h-8 text-gray-300" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700">Logo del Gimnasio</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Ingresa la URL del logo</p>
                    <input
                        type="text"
                        value={form.logo}
                        onChange={(e) => handleChange('logo', e.target.value)}
                        placeholder="https://ejemplo.com/logo.png"
                        className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg w-72 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        Nombre del Gimnasio
                    </label>
                    <input
                        type="text"
                        value={form.nombre_gimnasio}
                        onChange={(e) => handleChange('nombre_gimnasio', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Mi Gimnasio"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        Dirección
                    </label>
                    <input
                        type="text"
                        value={form.direccion}
                        onChange={(e) => handleChange('direccion', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Calle 123, Ciudad"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <Phone className="w-4 h-4 text-gray-400" />
                            Teléfono
                        </label>
                        <input
                            type="text"
                            value={form.telefono}
                            onChange={(e) => handleChange('telefono', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="555-1234"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <Mail className="w-4 h-4 text-gray-400" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="contacto@migimnasio.com"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            Horario Apertura
                        </label>
                        <input
                            type="time"
                            value={form.horario_apertura}
                            onChange={(e) => handleChange('horario_apertura', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            Horario Cierre
                        </label>
                        <input
                            type="time"
                            value={form.horario_cierre}
                            onChange={(e) => handleChange('horario_cierre', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
                <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                    onClick={handleReset}
                    disabled={!hasChanges}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors disabled:opacity-50"
                >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar
                </button>
            </div>
        </div>
    )
}

export default GeneralSettings
