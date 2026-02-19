import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import api, { authAPI, usersAPI } from '../../services/api'
import { User, Mail, Camera, Save, RefreshCw, Activity, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const UserProfile = () => {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        username: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [auditLogs, setAuditLogs] = useState([])
    const [loadingLogs, setLoadingLogs] = useState(false)

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                nombre: user.nombre || '',
                email: user.email || '',
                username: user.username || ''
            }))
            fetchUserLogs()
        }
    }, [user])

    const fetchUserLogs = async () => {
        if (!user) return
        setLoadingLogs(true)
        try {
            const response = await usersAPI.getAuditLogs({ userId: user.id, limit: 10 })
            setAuditLogs(response.data.logs)
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setLoadingLogs(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmitProfile = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { nombre, email, username } = formData
            const response = await authAPI.updateProfile(user.id, { nombre, email, username })
            updateUser(response.data)
            toast.success('Perfil actualizado correctamente')
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al actualizar perfil')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitPassword = async (e) => {
        e.preventDefault()
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error('Las contraseñas no coinciden')
        }
        setLoading(true)
        try {
            await authAPI.changePassword(user.id, {
                newPassword: formData.newPassword
            })
            toast.success('Contraseña actualizada correctamente')
            setFormData(prev => ({
                ...prev,
                newPassword: '',
                confirmPassword: ''
            }))
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al cambiar contraseña')
        } finally {
            setLoading(false)
        }
    }

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('foto', file)
        // Also send current data to avoid overwriting with nulls if backend requires it
        // But backend handles COALESCE, so sending just the file might be enough depending on route
        // The update route expects all fields, but COALESCE handles missing ones.
        // However, standard fetch/axios put might send empty body if not careful.
        // Best to send only the file in this specific call if the backend supports partial updates via PATCH or smart PUT.
        // The current backend UPDATE query uses COALESCE(?, field), so undefined/null is ignored.
        // But FormData fields are strings.

        try {
            const response = await api.put(`/usuarios/${user.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            updateUser(response.data)
            toast.success('Foto actualizada')
        } catch (error) {
            console.error(error)
            toast.error('Error al subir foto')
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Photo & Personal Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Photo Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-100 mb-4">
                                {user?.foto ? (
                                    <img
                                        src={user.foto}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/150?text=Error';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-300">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-4 right-0 bg-primary-600 p-2 rounded-full text-white cursor-pointer hover:bg-primary-700 transition shadow-md">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </label>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">{user?.nombre}</h2>
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mt-1 uppercase">
                            {user?.rol}
                        </span>
                        <p className="text-gray-500 text-sm mt-2">Miembro desde {user?.fecha_creacion ? format(new Date(user.fecha_creacion), 'MMM yyyy') : '-'}</p>
                    </div>

                    {/* Change Password Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <RefreshCw size={20} className="text-primary-600" />
                            Cambiar Contraseña
                        </h3>
                        <form onSubmit={handleSubmitPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !formData.newPassword}
                                className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
                            >
                                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Edit Details & Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Edit Profile Info */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <User size={20} className="text-primary-600" />
                            Información Personal
                        </h3>
                        <form onSubmit={handleSubmitProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-primary-600" />
                            Actividad Reciente
                        </h3>
                        <div className="space-y-6">
                            {loadingLogs ? (
                                <p className="text-center text-gray-500">Cargando actividad...</p>
                            ) : auditLogs.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No hay actividad reciente.</p>
                            ) : (
                                auditLogs.map((log) => (
                                    <div key={log.id} className="flex gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 z-10 relative">
                                                <Activity size={18} />
                                            </div>
                                            <div className="absolute top-10 bottom-0 left-1/2 w-0.5 bg-gray-100 -translate-x-1/2"></div>
                                        </div>
                                        <div className="pb-6">
                                            <p className="text-gray-800 font-medium">
                                                {log.accion} en {log.entidad_tipo}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {JSON.stringify(log.detalle)}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {format(new Date(log.fecha_hora), 'dd MMM yyyy', { locale: es })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {format(new Date(log.fecha_hora), 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfile
