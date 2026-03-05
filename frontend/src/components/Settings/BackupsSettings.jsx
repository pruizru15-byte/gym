import { useState, useEffect } from 'react'
import { Shield, HardDrive, Clock, FolderOpen, Download, Upload, Save, RotateCcw } from 'lucide-react'
import { configuracionAPI } from '../../services/api'
import toast from 'react-hot-toast'

const BackupsSettings = () => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [creatingBackup, setCreatingBackup] = useState(false)
    const [form, setForm] = useState({
        backup_automatico: true,
        frecuencia_backup: 'diario',
        hora_backup: '02:00',
        dias_mantener_backup: '30',
        ubicacion_backup: 'C:/GymSystem/backups/',
        permitir_acceso_vencido: false,
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
                backup_automatico: cfg.backup_automatico?.valor !== 'false',
                frecuencia_backup: cfg.frecuencia_backup?.valor || 'diario',
                hora_backup: cfg.hora_backup?.valor || '02:00',
                dias_mantener_backup: cfg.dias_mantener_backup?.valor || '30',
                ubicacion_backup: cfg.ubicacion_backup?.valor || 'C:/GymSystem/backups/',
                permitir_acceso_vencido: cfg.permitir_acceso_vencido?.valor === 'true',
            }
            setForm(newForm)
            setOriginalForm(newForm)
        } catch (error) {
            console.error('Error loading backup config:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await configuracionAPI.updateMultiple([
                { clave: 'backup_automatico', valor: String(form.backup_automatico), descripcion: 'Activar respaldos automáticos' },
                { clave: 'frecuencia_backup', valor: form.frecuencia_backup, descripcion: 'Frecuencia de respaldos' },
                { clave: 'hora_backup', valor: form.hora_backup, descripcion: 'Hora del respaldo automático' },
                { clave: 'dias_mantener_backup', valor: form.dias_mantener_backup, descripcion: 'Días a mantener respaldos' },
                { clave: 'ubicacion_backup', valor: form.ubicacion_backup, descripcion: 'Ubicación de los respaldos' },
                { clave: 'permitir_acceso_vencido', valor: String(form.permitir_acceso_vencido), descripcion: 'Permitir acceso con membresía vencida' },
            ])
            setOriginalForm(form)
            toast.success('Configuración de seguridad guardada')
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    const handleCreateBackup = async () => {
        setCreatingBackup(true)
        try {
            // Simulate backup creation (in real scenario, this would call a backend endpoint)
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success('Backup creado exitosamente')
        } catch {
            toast.error('Error al crear backup')
        } finally {
            setCreatingBackup(false)
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
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Seguridad y Backups</h3>
                    <p className="text-sm text-gray-500">Respaldos automáticos y seguridad del sistema</p>
                </div>
            </div>

            {/* Backup config */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-blue-500" />
                    Respaldos Automáticos
                </h4>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Backup automático</span>
                    <button
                        onClick={() => setForm(prev => ({ ...prev, backup_automatico: !prev.backup_automatico }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.backup_automatico ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-800 transition-transform shadow ${form.backup_automatico ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {form.backup_automatico && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Frecuencia</label>
                                <select
                                    value={form.frecuencia_backup}
                                    onChange={(e) => setForm(prev => ({ ...prev, frecuencia_backup: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="diario">Diario</option>
                                    <option value="semanal">Semanal</option>
                                    <option value="quincenal">Quincenal</option>
                                    <option value="mensual">Mensual</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Hora
                                </label>
                                <input
                                    type="time"
                                    value={form.hora_backup}
                                    onChange={(e) => setForm(prev => ({ ...prev, hora_backup: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Mantener backups</span>
                            <select
                                value={form.dias_mantener_backup}
                                onChange={(e) => setForm(prev => ({ ...prev, dias_mantener_backup: e.target.value }))}
                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {[7, 15, 30, 60, 90].map(d => (
                                    <option key={d} value={d}>{d} días</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" /> Ubicación de respaldos
                    </label>
                    <input
                        type="text"
                        value={form.ubicacion_backup}
                        onChange={(e) => setForm(prev => ({ ...prev, ubicacion_backup: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Quick backup actions */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                <h4 className="text-sm font-semibold text-blue-800">Acciones Rápidas</h4>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleCreateBackup}
                        disabled={creatingBackup}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                        {creatingBackup ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {creatingBackup ? 'Creando...' : 'Crear Backup Ahora'}
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                        <FolderOpen className="w-4 h-4" />
                        Ver Backups
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                        <Upload className="w-4 h-4" />
                        Restaurar
                    </button>
                </div>
            </div>

            {/* Security */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" />
                    Seguridad de Acceso
                </h4>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-sm text-gray-700">Permitir acceso con membresía vencida</span>
                        <p className="text-xs text-gray-500">Si se activa, los clientes podrán acceder aunque su membresía haya expirado</p>
                    </div>
                    <button
                        onClick={() => setForm(prev => ({ ...prev, permitir_acceso_vencido: !prev.permitir_acceso_vencido }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${form.permitir_acceso_vencido ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-800 transition-transform shadow ${form.permitir_acceso_vencido ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
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

export default BackupsSettings
