import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, Search, User, CreditCard, Calendar } from 'lucide-react'
import { membersAPI, plansAPI, membershipsAPI } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const NuevaAsignacion = () => {
    const navigate = useNavigate()

    // Steps: 1: Select Client, 2: Select Plan, 3: Details
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Data State
    const [clients, setClients] = useState([])
    const [plans, setPlans] = useState([])
    const [selectedClient, setSelectedClient] = useState(null)

    // Search State
    const [searchTerm, setSearchTerm] = useState('')
    const [searching, setSearching] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        planId: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        metodoPago: 'efectivo',
        monto: '',
        notas: '',
        isCuotas: false,
        numCuotas: 2
    })

    // Load Plans on Mount
    useEffect(() => {
        const loadPlans = async () => {
            try {
                const response = await plansAPI.getAll({ activo: true })
                setPlans(response.data)
            } catch (error) {
                toast.error('Error al cargar planes')
            }
        }
        loadPlans()
    }, [])

    // Preselect Client from state (e.g., from Inactivos list)
    const location = useLocation()
    useEffect(() => {
        const preselectClient = location.state?.preselectClient
        if (preselectClient && !selectedClient) {
            handleClientSelect({
                id: preselectClient.cliente_id,
                nombre: preselectClient.cliente_nombre,
                apellido: preselectClient.cliente_apellido,
                email: preselectClient.email,
                telefono: preselectClient.telefono
            })
        }
    }, [location.state])

    // Search Clients
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchTerm.length > 2) {
                setSearching(true)
                try {
                    const response = await membersAPI.getAll({ search: searchTerm, limit: 5 })
                    setClients(response.data.clientes || [])
                } catch (error) {
                    console.error(error)
                } finally {
                    setSearching(false)
                }
            } else {
                setClients([])
            }
        }, 300)

        return () => clearTimeout(delayDebounce)
    }, [searchTerm])

    // Handle Plan Selection updates price and duration
    useEffect(() => {
        if (formData.planId) {
            const plan = plans.find(p => p.id === parseInt(formData.planId))
            if (plan) {
                setFormData(prev => ({
                    ...prev,
                    monto: plan.precio
                }))
            }
        }
    }, [formData.planId, plans])

    const handleClientSelect = (client) => {
        setSelectedClient(client)
        setStep(2)
    }

    const handlePlanSelect = (planId) => {
        setFormData(prev => ({ ...prev, planId }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedClient || !formData.planId) return

        setLoading(true)
        try {
            const payload = {
                cliente_id: selectedClient.id,
                membresia_id: parseInt(formData.planId),
                fecha_inicio: formData.fechaInicio,
                precio_pagado: formData.isCuotas ? parseFloat(formData.monto) : parseFloat(formData.monto),
                metodo_pago: formData.metodoPago,
                notas: formData.notas,
                es_cuotas: formData.isCuotas,
                num_cuotas: formData.isCuotas ? parseInt(formData.numCuotas) : undefined
            }

            const res = await membershipsAPI.create(payload)
            toast.success('Membresía asignada correctamente')

            // After assign, we could show a modal with the receipt. 
            // For now we redirect and pass the receipt ID to the list
            if (res.data?.data?.pago_id) {
                navigate('/pagos/historial', { state: { showReceiptId: res.data.data.pago_id } })
            } else {
                navigate('/membresias/asignaciones')
            }
        } catch (error) {
            console.error('Error assigning:', error)
            toast.error(error.response?.data?.error || 'Error al asignar membresía')
        } finally {
            setLoading(false)
        }
    }

    // Calculate expiration for preview
    const getExpirationPreview = () => {
        if (!formData.planId || !formData.fechaInicio) return null
        const plan = plans.find(p => p.id === parseInt(formData.planId))
        if (!plan) return null

        const start = new Date(formData.fechaInicio)
        const end = new Date(start)
        if (plan.duracion_dias) {
            end.setDate(end.getDate() + plan.duracion_dias)
        }
        return end.toLocaleDateString()
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/membresias/asignaciones')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Nueva Asignación</h1>
                    <p className="text-gray-600">
                        {step === 1 && 'Paso 1: Seleccionar Cliente'}
                        {step === 2 && 'Paso 2: Detalles de Membresía'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">

                {/* Step 1: Client Selection */}
                {step === 1 && (
                    <div className="p-8">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                            <input
                                type="text"
                                placeholder="Buscar cliente por nombre o código..."
                                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            {searching ? (
                                <div className="text-center py-8 text-gray-500">Buscando...</div>
                            ) : clients.length > 0 ? (
                                clients.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => handleClientSelect(client)}
                                        className="w-full text-left p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                                                {client.nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">{client.nombre} {client.apellido}</h3>
                                                <p className="text-sm text-gray-500">{client.email || 'Sin email'} • {client.telefono || 'Sin teléfono'}</p>
                                            </div>
                                        </div>
                                        {client.membresiaActiva && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                Activo
                                            </span>
                                        )}
                                    </button>
                                ))
                            ) : searchTerm.length > 2 ? (
                                <div className="text-center py-8 text-gray-500">No se encontraron clientes</div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <User size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Escribe para buscar un cliente</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Form Details */}
                {step === 2 && selectedClient && (
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-8 p-4 bg-primary-50 rounded-xl border border-primary-100">
                            <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                                {selectedClient.nombre.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs text-primary-600 font-semibold uppercase tracking-wider">Cliente Seleccionado</p>
                                <h3 className="font-bold text-gray-900">{selectedClient.nombre} {selectedClient.apellido}</h3>
                            </div>
                            <button onClick={() => setStep(1)} className="ml-auto text-sm text-primary-600 hover:text-primary-800 font-medium underline">
                                Cambiar
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Plan Selection */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Plan</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {plans.map(plan => (
                                            <div
                                                key={plan.id}
                                                onClick={() => handlePlanSelect(plan.id)}
                                                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${formData.planId === plan.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-900">{plan.nombre}</h4>
                                                    <span className="text-primary-600 font-bold">{formatCurrency(plan.precio)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {plan.duracion_dias
                                                        ? `${plan.duracion_dias} Días`
                                                        : `${plan.duracion} ${plan.tipoDuracion}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            value={formData.fechaInicio}
                                            onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                    {formData.planId && (
                                        <p className="text-xs text-gray-500 mt-1 pl-1">
                                            Vence: <span className="font-medium text-gray-900">{getExpirationPreview()}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Installments / Cuotas Option */}
                                <div className="col-span-1 md:col-span-2 bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                    <h4 className="font-semibold text-gray-800 mb-4">Opciones de Pago</h4>

                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tipoPago"
                                                checked={!formData.isCuotas}
                                                onChange={() => setFormData({ ...formData, isCuotas: false })}
                                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-gray-700 font-medium">Pago Completado</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tipoPago"
                                                checked={formData.isCuotas}
                                                onChange={() => setFormData({ ...formData, isCuotas: true })}
                                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-gray-700 font-medium">Pagar en Cuotas</span>
                                        </label>
                                    </div>

                                    {formData.isCuotas && (
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuotas</label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    max="12"
                                                    value={formData.numCuotas}
                                                    onChange={(e) => setFormData({ ...formData, numCuotas: parseInt(e.target.value) || 2 })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="text-sm font-medium text-gray-700">Monto Primera Cuota (Hoy):</p>
                                                <p className="text-lg font-bold text-primary-600">
                                                    {formData.monto && formData.numCuotas
                                                        ? formatCurrency(parseFloat(formData.monto) / formData.numCuotas)
                                                        : '-'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    (Las siguientes cuotas se cargarán como pendientes)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                {!formData.isCuotas && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Pagar (Hoy)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.monto}
                                                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            value={formData.metodoPago}
                                            onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="efectivo">Efectivo</option>
                                            <option value="tarjeta">Tarjeta</option>
                                            <option value="transferencia">Transferencia</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                    <textarea
                                        value={formData.notas}
                                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        placeholder="Observaciones opcionales..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !formData.planId}
                                    className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    {loading ? 'Procesando...' : 'Confirmar Asignación'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NuevaAsignacion
