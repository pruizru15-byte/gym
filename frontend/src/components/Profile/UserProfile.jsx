import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import api, { authAPI, usersAPI } from '../../services/api'
import {
    User, Mail, Camera, Save, RefreshCw, Activity,
    Calendar, Clock, ChevronLeft, ChevronRight, Key, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getRelativeTime } from '../../utils/formatters'

const PAGE_SIZE = 5

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
    const [logPage, setLogPage] = useState(1)
    const [activeTab, setActiveTab] = useState('info') // 'info' | 'password'

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
        setLogPage(1)
        try {
            const response = await usersAPI.getAuditLogs({ userId: user.id, limit: 50 })
            setAuditLogs(response.data.logs || [])
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
            await authAPI.changePassword(user.id, { newPassword: formData.newPassword })
            toast.success('Contraseña actualizada correctamente')
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }))
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al cambiar contraseña')
        } finally {
            setLoading(false)
        }
    }

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        const fd = new FormData()
        fd.append('foto', file)
        try {
            const response = await api.put(`/usuarios/${user.id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            updateUser(response.data)
            toast.success('Foto actualizada')
        } catch (error) {
            toast.error('Error al subir foto')
        }
    }

    /* ── Pagination ── */
    const totalPages = Math.max(1, Math.ceil(auditLogs.length / PAGE_SIZE))
    const logStart = (logPage - 1) * PAGE_SIZE
    const pageItems = auditLogs.slice(logStart, logStart + PAGE_SIZE)

    return (
        /* Full-height container — no page scroll */
        <div className="h-full flex flex-col gap-4 overflow-hidden">

            {/* ── Page title ── */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-shrink-0">Mi Perfil</h1>

            {/* ── Three-column grid that fills remaining height ── */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden min-h-0">

                {/* ─── LEFT: Avatar card ─── */}
                <div className="flex flex-col gap-4 overflow-hidden">
                    {/* Avatar */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center">
                        <div className="relative group mb-4">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-100 shadow-md">
                                {user?.foto ? (
                                    <img
                                        src={user.foto}
                                        alt="Foto de perfil"
                                        className="w-full h-full object-cover"
                                        onError={e => { e.target.src = 'https://via.placeholder.com/150?text=?' }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                        <User size={52} className="text-primary-400" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white cursor-pointer hover:bg-primary-700 transition shadow-lg">
                                <Camera size={14} />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </label>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200">{user?.nombre}</h2>
                        <span className="mt-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                            {user?.rol}
                        </span>
                        <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                            <Calendar size={11} />
                            Desde {user?.fecha_creacion
                                ? format(new Date(user.fecha_creacion), 'MMM yyyy', { locale: es })
                                : '-'}
                        </p>
                    </div>

                    {/* Tabs: Info / Password */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
                        {/* Tab bar */}
                        <div className="flex border-b border-gray-100 dark:border-gray-700 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'info'
                                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 -mb-px'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <User size={14} /> Datos
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'password'
                                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 -mb-px'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <Key size={14} /> Contraseña
                            </button>
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {activeTab === 'info' ? (
                                <form onSubmit={handleSubmitProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Nombre completo
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Usuario
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                            <Mail size={11} /> Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={15} />
                                        {loading ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleSubmitPassword} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Nueva contraseña
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Confirmar contraseña
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                                        <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.newPassword}
                                        className="w-full py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Shield size={15} />
                                        {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── CENTER + RIGHT: Activity (2 cols) ─── */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">

                    {/* Section header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Activity size={18} className="text-primary-600 dark:text-primary-400 dark:text-primary-400" />
                            Actividad Reciente
                            {!loadingLogs && auditLogs.length > 0 && (
                                <span className="text-xs font-normal text-gray-400">
                                    ({auditLogs.length} registros)
                                </span>
                            )}
                        </h3>
                        <button
                            onClick={fetchUserLogs}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
                            title="Actualizar"
                        >
                            <RefreshCw size={15} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Scrollable log list */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {loadingLogs ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                            </div>
                        ) : auditLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Activity size={40} className="mb-3 text-gray-200" />
                                <p className="text-sm">No hay actividad reciente</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {pageItems.map((log, i) => (
                                    <div key={log.id} className="flex gap-4 group">
                                        {/* Timeline dot */}
                                        <div className="relative flex flex-col items-center">
                                            <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-500 z-10 flex-shrink-0">
                                                <Activity size={16} />
                                            </div>
                                            {i < pageItems.length - 1 && (
                                                <div className="w-px flex-1 bg-gray-100 dark:bg-gray-700 mt-1" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="pb-4 flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 dark:text-gray-200">
                                                <span className="text-primary-600 dark:text-primary-400 dark:text-primary-400">{log.accion}</span>
                                                {' '}en{' '}
                                                <span className="font-semibold">{log.entidad_tipo}</span>
                                            </p>
                                            {log.detalle && Object.keys(log.detalle).length > 0 && (
                                                <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                    {Object.entries(log.detalle)
                                                        .filter(([, v]) => v !== undefined && v !== null)
                                                        .map(([k, v]) => `${k}: ${v}`)
                                                        .join(' · ')}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {format(new Date(log.fecha_hora), 'dd MMM yyyy', { locale: es })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {format(new Date(log.fecha_hora), 'HH:mm')}
                                                </span>
                                                <span className="text-gray-300">·</span>
                                                <span>{getRelativeTime(log.fecha_hora)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Pagination bar ── */}
                    {!loadingLogs && auditLogs.length > PAGE_SIZE && (
                        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                                {logStart + 1}–{Math.min(logStart + PAGE_SIZE, auditLogs.length)} de {auditLogs.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                    disabled={logPage === 1}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setLogPage(n)}
                                        className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${n === logPage
                                                ? 'bg-primary-600 text-white'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                                    disabled={logPage === totalPages}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                            <span className="text-xs text-gray-300">pág. {logPage}/{totalPages}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserProfile
