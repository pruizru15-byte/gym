import { useState, useEffect } from 'react'
import { Bell, Clock, Package, Wrench, Save, RotateCcw } from 'lucide-react'
import { configuracionAPI } from '../../services/api'
import toast from 'react-hot-toast'

const ToggleSwitch = ({ enabled, onChange, label }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-800 transition-transform shadow ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
)

const NotificationsSettings = () => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        dias_alerta_vencimiento: '7',
        dias_alerta_producto: '15',
        alerta_stock_minimo: true,
        alerta_mantenimiento: true,
        notificaciones_email: false,
        notificaciones_sms: false,
    })
    const [originalForm, setOriginalForm] = useState({})

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await configuracionAPI.getAll()
            const cfg = res.data
            const newForm = {
                dias_alerta_vencimiento: cfg.dias_alerta_vencimiento?.valor || '7',
                dias_alerta_producto: cfg.dias_alerta_producto?.valor || '15',
                alerta_stock_minimo: cfg.alerta_stock_minimo?.valor !== 'false',
                alerta_mantenimiento: cfg.alerta_mantenimiento?.valor !== 'false',
                notificaciones_email: cfg.notificaciones_email?.valor === 'true',
                notificaciones_sms: cfg.notificaciones_sms?.valor === 'true',
            }
            setForm(newForm)
            setOriginalForm(newForm)
        } catch (error) {
            console.error('Error loading notifications config:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await configuracionAPI.updateMultiple([
                { clave: 'dias_alerta_vencimiento', valor: form.dias_alerta_vencimiento, descripcion: 'Días antes de vencimiento para alertar' },
                { clave: 'dias_alerta_producto', valor: form.dias_alerta_producto, descripcion: 'Días antes de vencimiento de producto para alertar' },
                { clave: 'alerta_stock_minimo', valor: String(form.alerta_stock_minimo), descripcion: 'Alertar cuando el stock esté bajo' },
                { clave: 'alerta_mantenimiento', valor: String(form.alerta_mantenimiento), descripcion: 'Alertar mantenimiento de máquinas' },
                { clave: 'notificaciones_email', valor: String(form.notificaciones_email), descripcion: 'Enviar notificaciones por email' },
                { clave: 'notificaciones_sms', valor: String(form.notificaciones_sms), descripcion: 'Enviar notificaciones por SMS' },
            ])
            setOriginalForm(form)
            toast.success('Configuración de notificaciones guardada')
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
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <Bell className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Notificaciones</h3>
                    <p className="text-sm text-gray-500">Configura alertas y notificaciones del sistema</p>
                </div>
            </div>

            {/* Membership alerts */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Alertas de Membresías
                </h4>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Alertar vencimiento de membresía</span>
                    <div className="flex items-center gap-2">
                        <select
                            value={form.dias_alerta_vencimiento}
                            onChange={(e) => setForm(prev => ({ ...prev, dias_alerta_vencimiento: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {[3, 5, 7, 10, 15, 30].map(d => (
                                <option key={d} value={d}>{d} días antes</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Product alerts */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    Alertas de Productos
                </h4>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Alertar vencimiento de productos</span>
                    <select
                        value={form.dias_alerta_producto}
                        onChange={(e) => setForm(prev => ({ ...prev, dias_alerta_producto: e.target.value }))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {[7, 15, 30, 60, 90].map(d => (
                            <option key={d} value={d}>{d} días antes</option>
                        ))}
                    </select>
                </div>
                <ToggleSwitch
                    label="Alertar stock mínimo"
                    enabled={form.alerta_stock_minimo}
                    onChange={(v) => setForm(prev => ({ ...prev, alerta_stock_minimo: v }))}
                />
            </div>

            {/* Machines */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-500" />
                    Alertas de Máquinas
                </h4>
                <ToggleSwitch
                    label="Alertar mantenimiento de máquinas"
                    enabled={form.alerta_mantenimiento}
                    onChange={(v) => setForm(prev => ({ ...prev, alerta_mantenimiento: v }))}
                />
            </div>

            {/* Channels */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">Canales de Notificación</h4>
                <ToggleSwitch
                    label="Notificaciones por email"
                    enabled={form.notificaciones_email}
                    onChange={(v) => setForm(prev => ({ ...prev, notificaciones_email: v }))}
                />
                <ToggleSwitch
                    label="Notificaciones por SMS"
                    enabled={form.notificaciones_sms}
                    onChange={(v) => setForm(prev => ({ ...prev, notificaciones_sms: v }))}
                />
            </div>

            {/* Actions */}
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

export default NotificationsSettings
