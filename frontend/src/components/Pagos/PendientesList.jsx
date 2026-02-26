import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Clock, Mail, Phone, AlertCircle, FileText, Send, UserX, UserPlus, X } from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PendientesList = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('deudores'); // 'deudores' | 'inactivos'

    // Data State
    const [pendientes, setPendientes] = useState([]);
    const [inactivos, setInactivos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Payment Form State
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedCuota, setSelectedCuota] = useState(null);
    const [montoPago, setMontoPago] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [notasPago, setNotasPago] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Email Form State
    const [isSendingEmail, setIsSendingEmail] = useState(null); // id of the client being sent an email

    const [error, setError] = useState(null);

    const { user } = useAuth(); // Assume we have an auth context to get current user if needed

    useEffect(() => {
        if (activeTab === 'deudores') {
            fetchPendientes();
        } else {
            fetchInactivos();
        }
    }, [activeTab]);

    const fetchPendientes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await paymentsAPI.getPendientes();
            setPendientes(response.data.data || []);
        } catch (err) {
            console.error('Error fetching pendientes:', err);
            setError('Error al cargar la lista de pagos pendientes. Intente nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInactivos = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await paymentsAPI.getInactivos();
            setInactivos(response.data.data || []);
        } catch (err) {
            console.error('Error fetching inactivos:', err);
            setError('Error al cargar la lista de clientes inactivos.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePagar = (cliente) => {
        setSelectedClient(cliente);
        setSelectedCuota(null);
        setMontoPago(cliente.deuda.toString());
        setMetodoPago('efectivo');
        setNotasPago('');
        setError(null);
    };

    const handlePagarCuota = (cliente, cuota) => {
        setSelectedClient(cliente);
        setSelectedCuota(cuota);
        setMontoPago(cuota.monto.toString());
        setMetodoPago('efectivo');
        setNotasPago('');
        setError(null);
    };

    const submitPago = async (e) => {
        e.preventDefault();
        if (!selectedClient) return;

        setIsProcessing(true);
        setError(null);

        try {
            const res = await paymentsAPI.pagarPendiente(selectedClient.asignacion_id, {
                monto: parseFloat(montoPago),
                metodo_pago: metodoPago,
                notas: notasPago,
                cuota_id: selectedCuota ? selectedCuota.cuota_id : undefined
            });

            // Close modal and refresh list
            setSelectedClient(null);
            setSelectedCuota(null);
            await fetchPendientes();

            toast.success('Pago registrado exitosamente');

            // Redirect to receipt if created
            if (res.data?.data?.pago_id) {
                navigate('/pagos/historial', { state: { showReceiptId: res.data.data.pago_id } })
            }
        } catch (err) {
            console.error('Error registering payment:', err);
            // Usually API errors have response.data.error
            const errorMsg = err.response?.data?.error || 'Error al procesar el pago. Verifique que la caja esté abierta e intente nuevamente.';
            setError(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRenovar = (cliente) => {
        // Redirigir a la vista de asignar membresía, pasando el cliente por estado si queremos, o solo redirigir
        navigate('/membresias/asignar', { state: { preselectClient: cliente } });
    };

    const handleSendEmail = async (cliente) => {
        if (!cliente.email) {
            toast.error('Este cliente no tiene correo registrado.');
            return;
        }

        setIsSendingEmail(cliente.cliente_id);
        const toastId = toast.loading('Enviando correo...');
        try {
            await paymentsAPI.sendWinBackEmail(cliente.cliente_id);
            toast.success(`Correo enviado exitosamente a ${cliente.email}`, { id: toastId });
        } catch (err) {
            console.error('Error sending email:', err);
            toast.error(err.response?.data?.error || 'No se pudo enviar el correo', { id: toastId });
        } finally {
            setIsSendingEmail(null);
        }
    };

    const handleSendCuotaEmail = async (cuota) => {
        setIsSendingEmail(`cuota_${cuota.cuota_id}`);
        const toastId = toast.loading('Enviando recordatorio de cuota...');
        try {
            await paymentsAPI.enviarRecordatorioCuota(cuota.cuota_id);
            toast.success(`Recordatorio enviado exitosamente`, { id: toastId });
        } catch (err) {
            console.error('Error sending cuota email:', err);
            toast.error(err.response?.data?.error || 'No se pudo enviar el recordatorio', { id: toastId });
        } finally {
            setIsSendingEmail(null);
        }
    };

    const filteredPendientes = pendientes.filter(p => {
        const term = searchTerm.toLowerCase();
        return (p.cliente_nombre || '').toLowerCase().includes(term) ||
            (p.cliente_apellido || '').toLowerCase().includes(term) ||
            (p.plan_nombre || '').toLowerCase().includes(term);
    });

    const filteredInactivos = inactivos.filter(i => {
        const term = searchTerm.toLowerCase();
        return (i.cliente_nombre || '').toLowerCase().includes(term) ||
            (i.cliente_apellido || '').toLowerCase().includes(term) ||
            (i.ultimo_plan || '').toLowerCase().includes(term);
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            {/* Header & Controls */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-rose-500" />
                            Oportunidades y Deudas
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Gestiona los saldos pendientes y recupera clientes inactivos.</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 p-1 bg-gray-200/50 rounded-lg max-w-md border border-gray-200">
                    <button
                        onClick={() => setActiveTab('deudores')}
                        className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'deudores'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                            }`}
                    >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Saldos Pendientes
                    </button>
                    <button
                        onClick={() => setActiveTab('inactivos')}
                        className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'inactivos'
                            ? 'bg-rose-600 text-white shadow'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                            }`}
                    >
                        <UserX className="w-4 h-4 mr-2" />
                        Inactivos
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50/30 custom-scrollbar">
                {error && !selectedClient && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start shadow-sm">
                        <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                ) : activeTab === 'deudores' ? (
                    /* DEUDORES VIEW */
                    filteredPendientes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                            <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No hay pagos pendientes</h3>
                            <p className="mt-2 text-sm text-gray-500 max-w-sm">
                                Todos los clientes activos están al día con sus pagos o no hay coincidencias con tu búsqueda.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPendientes.map((p) => (
                                <div key={p.asignacion_id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 truncate max-w-[180px]" title={`${p.cliente_nombre} ${p.cliente_apellido}`}>
                                                {p.cliente_nombre} {p.cliente_apellido}
                                            </h3>
                                            <div className="flex items-center text-xs text-blue-600 font-medium mt-1">
                                                <FileText className="w-3 h-3 mr-1" />
                                                {p.plan_nombre}
                                            </div>
                                        </div>
                                        <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full border border-rose-100 shadow-sm flex items-center font-bold text-sm">
                                            Debe: {formatCurrency(p.deuda)}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4 text-sm flex-1">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                                            <span className="text-gray-500">Total Plan:</span>
                                            <span className="text-gray-900 font-medium">{formatCurrency(p.total)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                                            <span className="text-gray-500">Abonado hasta ahora:</span>
                                            <span className="text-gray-900 font-medium">{formatCurrency(p.abonado)}</span>
                                        </div>

                                        <div className="pt-2 flex flex-col gap-1.5 text-xs text-gray-600">
                                            {p.telefono && (
                                                <div className="flex items-center">
                                                    <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                                    {p.telefono}
                                                </div>
                                            )}
                                            {p.email && (
                                                <div className="flex items-center">
                                                    <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                                    <span className="truncate">{p.email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center mt-1 text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-md inline-flex w-fit">
                                                <Clock className="w-3.5 h-3.5 mr-1" />
                                                Vence: {formatDate(p.fecha_vencimiento)}
                                            </div>
                                        </div>
                                    </div>

                                    {p.cuotas && p.cuotas.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Cuotas Pendientes:</p>
                                            <div className="max-h-[180px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                                {p.cuotas.map(cuota => (
                                                    <div key={cuota.cuota_id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-800 font-semibold">Cuota {cuota.numero_cuota}</span>
                                                            <span className="text-rose-600 font-bold">{formatCurrency(cuota.monto)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                                            <span className="flex items-center text-orange-600 font-medium"><Clock className="w-3 h-3 mr-1" /> Exp: {formatDate(cuota.fecha_vencimiento)}</span>
                                                            {p.email && (
                                                                <button
                                                                    onClick={() => handleSendCuotaEmail(cuota)}
                                                                    disabled={isSendingEmail === `cuota_${cuota.cuota_id}`}
                                                                    className="text-blue-600 hover:text-blue-700 flex items-center transition-colors disabled:opacity-50 font-medium"
                                                                    title="Enviar Recordatorio"
                                                                >
                                                                    {isSendingEmail === `cuota_${cuota.cuota_id}` ? (
                                                                        <div className="w-3 h-3 mr-1 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <Send className="w-3 h-3 mr-1" />
                                                                    )}
                                                                    Recordar
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handlePagarCuota(p, cuota)}
                                                            className="w-full mt-1.5 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-md font-medium transition-colors text-sm flex items-center justify-center shadow-sm"
                                                        >
                                                            <DollarSign className="w-4 h-4 mr-1" /> Pagar Cuota
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePagar(p)}
                                            className="w-full mt-auto bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center shadow-sm relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 transform origin-left transition-transform duration-300 ease-out"></div>
                                            <DollarSign className="w-4 h-4 mr-2 relative z-10" />
                                            <span className="relative z-10">Procesar Pago Total</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* INACTIVOS VIEW */
                    filteredInactivos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                            <UserX className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No hay clientes inactivos</h3>
                            <p className="mt-2 text-sm text-gray-500 max-w-sm">
                                ¡Excelente! Todos tus clientes tienen una membresía activa en este momento.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredInactivos.map((i) => (
                                <div key={i.cliente_id} className="bg-white rounded-xl border border-gray-200 hover:border-rose-300 shadow-sm transition-all flex flex-col p-5 relative overflow-hidden group hover:shadow-md">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                                        <UserX className="w-32 h-32 text-rose-500" />
                                    </div>

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 truncate max-w-[200px]" title={`${i.cliente_nombre} ${i.cliente_apellido}`}>
                                                {i.cliente_nombre} {i.cliente_apellido}
                                            </h3>
                                            <div className="flex items-center text-xs text-gray-500 font-medium mt-1 bg-gray-100 px-2 py-1 rounded inline-flex">
                                                <FileText className="w-3 h-3 mr-1" />
                                                <span className="truncate">{i.ultimo_plan || 'Sin plan previo'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6 text-sm text-gray-600 flex-1 relative z-10">
                                        <div className="flex items-center mt-1 bg-rose-50 w-fit px-2 py-1 rounded-md">
                                            <Clock className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                                            <span className="text-rose-600 font-medium text-xs">
                                                Venció: {i.ultimo_vencimiento ? formatDate(i.ultimo_vencimiento) : 'N/A'}
                                            </span>
                                        </div>
                                        {i.telefono && (
                                            <div className="flex items-center mt-3">
                                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                {i.telefono}
                                            </div>
                                        )}
                                        {i.email && (
                                            <div className="flex items-center mt-1.5">
                                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="truncate" title={i.email}>{i.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto flex flex-col gap-2 relative z-10">
                                        <button
                                            onClick={() => handleRenovar(i)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center shadow-sm hover:shadow"
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Renovar Membresía
                                        </button>

                                        <button
                                            onClick={() => handleSendEmail(i)}
                                            disabled={!i.email || isSendingEmail === i.cliente_id}
                                            className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center 
                                                ${!i.email
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                    : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 shadow-sm'
                                                }`}
                                            title={!i.email ? 'Cliente sin correo registrado' : 'Enviar un correo invitándole a volver'}
                                        >
                                            {isSendingEmail === i.cliente_id ? (
                                                <div className="flex items-center">
                                                    <div className="w-4 h-4 mr-2 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
                                                    Enviando...
                                                </div>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Enviar Recordatorio
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Embedded Modal for Processing Payment */}
            {
                selectedClient && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <div className="bg-green-100 p-1.5 rounded-full mr-3 text-green-600">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    {selectedCuota ? `Pagar Cuota ${selectedCuota.numero_cuota}` : 'Liquidar Saldo Pendiente'}
                                </h3>
                                <button onClick={() => { setSelectedClient(null); setSelectedCuota(null); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitPago} className="p-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                                    <div className="text-sm text-gray-500 mb-1">Cliente</div>
                                    <div className="font-semibold text-gray-900 text-lg">{selectedClient.cliente_nombre} {selectedClient.cliente_apellido}</div>
                                    <div className="text-xs text-blue-600 font-medium mt-0.5">{selectedClient.plan_nombre}</div>

                                    <div className="mt-4 flex justify-between items-end border-t border-gray-200 pt-3">
                                        <div className="text-sm font-medium text-gray-600">{selectedCuota ? 'Valor de cuota:' : 'Deuda actual:'}</div>
                                        <div className="text-2xl font-bold text-rose-600">{formatCurrency(selectedCuota ? selectedCuota.monto : selectedClient.deuda)}</div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg flex items-start">
                                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto a abonar</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max={selectedCuota ? selectedCuota.monto : selectedClient.deuda}
                                                required
                                                readOnly={!!selectedCuota}
                                                value={montoPago}
                                                onChange={(e) => setMontoPago(e.target.value)}
                                                className={`w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${selectedCuota ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1.5 flex items-center">
                                            <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                            {selectedCuota
                                                ? 'Las cuotas deben pagarse por su monto exacto.'
                                                : `El monto no puede superar la deuda máxima (${formatCurrency(selectedClient.deuda)}).`
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Método de Pago</label>
                                        <select
                                            value={metodoPago}
                                            onChange={(e) => setMetodoPago(e.target.value)}
                                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        >
                                            <option value="efectivo">Efectivo 💵</option>
                                            <option value="tarjeta">Tarjeta 💳</option>
                                            <option value="transferencia">Transferencia / Yape / Plin 📱</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (Opcional)</label>
                                        <textarea
                                            value={notasPago}
                                            onChange={(e) => setNotasPago(e.target.value)}
                                            placeholder="Ej. Liquidación final del mes..."
                                            rows="2"
                                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedClient(null)}
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl font-medium transition-colors min-w-[120px]"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 min-w-[120px] flex justify-center items-center"
                                    >
                                        {isProcessing ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            'Confirmar Pago'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default PendientesList;
