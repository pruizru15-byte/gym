import { useState, useEffect } from 'react'
import { Palette, DollarSign, Calendar, Globe, Save, RotateCcw, Sun, Moon } from 'lucide-react'
import { configuracionAPI } from '../../services/api'
import { useCurrency } from '../../contexts/CurrencyContext'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'

const THEME_COLORS = [
    { id: '#3b82f6', label: 'Azul', class: 'bg-blue-500' },
    { id: '#10b981', label: 'Verde', class: 'bg-emerald-500' },
    { id: '#8b5cf6', label: 'Púrpura', class: 'bg-violet-500' },
    { id: '#f59e0b', label: 'Ámbar', class: 'bg-amber-500' },
    { id: '#ef4444', label: 'Rojo', class: 'bg-red-500' },
    { id: '#84cc16', label: 'Verde Limón', class: 'bg-lime-500' },
    { id: '#06b6d4', label: 'Cian', class: 'bg-cyan-500' },
    { id: '#ec4899', label: 'Rosa', class: 'bg-pink-500' },
]

const CURRENCIES = [
    { code: 'MXN', label: '$ MXN (Peso Mexicano)', symbol: '$' },
    { code: 'USD', label: '$ USD (Dólar)', symbol: '$' },
    { code: 'EUR', label: '€ EUR (Euro)', symbol: '€' },
    { code: 'COP', label: '$ COP (Peso Colombiano)', symbol: '$' },
    { code: 'ARS', label: '$ ARS (Peso Argentino)', symbol: '$' },
    { code: 'CLP', label: '$ CLP (Peso Chileno)', symbol: '$' },
    { code: 'PEN', label: 'S/ PEN (Sol Peruano)', symbol: 'S/' },
]

const DATE_FORMATS = [
    { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
    { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
    { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
]

const AppearanceSettings = () => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { updateCurrency } = useCurrency()
    const { theme, setTheme } = useTheme()
    const [form, setForm] = useState({
        tema_color: '#3b82f6',
        moneda: 'MXN',
        formato_fecha: 'DD/MM/YYYY',
        idioma: 'es',
        impuesto_ventas: '18',
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
                tema_color: cfg.tema_color?.valor || '#3b82f6',
                moneda: cfg.moneda?.valor || 'MXN',
                formato_fecha: cfg.formato_fecha?.valor || 'DD/MM/YYYY',
                idioma: cfg.idioma?.valor || 'es',
                impuesto_ventas: cfg.impuesto_ventas?.valor || '0',
            }
            setForm(newForm)
            setOriginalForm(newForm)
        } catch (error) {
            console.error('Error loading appearance config:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await configuracionAPI.updateMultiple([
                { clave: 'tema_color', valor: form.tema_color, descripcion: 'Color principal del tema' },
                { clave: 'moneda', valor: form.moneda, descripcion: 'Moneda utilizada' },
                { clave: 'formato_fecha', valor: form.formato_fecha, descripcion: 'Formato de fecha' },
                { clave: 'idioma', valor: form.idioma, descripcion: 'Idioma del sistema' },
                { clave: 'impuesto_ventas', valor: form.impuesto_ventas, descripcion: 'Porcentaje de impuesto en ventas' },
            ])
            setOriginalForm(form)
            // Propagate currency change system-wide immediately
            updateCurrency(form.moneda)
            toast.success('Configuración de apariencia guardada')
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
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                    <Palette className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Apariencia y Preferencias</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza el aspecto y configuración regional</p>
                </div>
            </div>

            {/* Theme mode — Dark/Light */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    Modo de Tema
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                            }`}
                    >
                        <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-amber-600' : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${theme === 'light' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            Modo Claro
                        </span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                            }`}
                    >
                        <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            Modo Oscuro
                        </span>
                    </button>
                </div>
            </div>

            {/* Theme color */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-500" />
                    Color del Tema
                </h4>
                <div className="flex flex-wrap gap-3">
                    {THEME_COLORS.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setForm(prev => ({ ...prev, tema_color: c.id }))}
                            className={`group flex flex-col items-center gap-1.5`}
                            title={c.label}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl transition-all ${c.class} ${form.tema_color === c.id
                                    ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-800 scale-110'
                                    : 'hover:scale-105 opacity-70 hover:opacity-100'
                                    }`}
                            />
                            <span className={`text-xs ${form.tema_color === c.id ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                {c.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Currency */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Moneda
                </h4>
                <select
                    value={form.moneda}
                    onChange={(e) => setForm(prev => ({ ...prev, moneda: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                    {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                </select>
            </div>

            {/* Date format */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Formato de Fecha
                </h4>
                <div className="space-y-2">
                    {DATE_FORMATS.map(f => (
                        <label
                            key={f.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.formato_fecha === f.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-800'
                                }`}
                        >
                            <input
                                type="radio" name="formato" value={f.id}
                                checked={form.formato_fecha === f.id}
                                onChange={(e) => setForm(prev => ({ ...prev, formato_fecha: e.target.value }))}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={`text-sm font-medium ${form.formato_fecha === f.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {f.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Language */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-500" />
                    Idioma
                </h4>
                <select
                    value={form.idioma}
                    onChange={(e) => setForm(prev => ({ ...prev, idioma: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                </select>
            </div>

            {/* Tax */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    Impuesto General a las Ventas (IGV)
                </h4>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={form.impuesto_ventas}
                        onChange={(e) => setForm(prev => ({ ...prev, impuesto_ventas: e.target.value }))}
                        className="w-24 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar
                </button>
            </div>
        </div>
    )
}

export default AppearanceSettings
