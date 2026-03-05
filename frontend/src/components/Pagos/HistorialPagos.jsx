import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Search, Filter, Printer, Calendar as CalendarIcon, DollarSign, CreditCard, Box as Cash, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

import ReciboPagoModal from './ReciboPagoModal';
import CorteCajaModal from './CorteCajaModal';
import AbrirCajaModal from './AbrirCajaModal';
import PendientesList from './PendientesList';

const HistorialPagos = () => {
    const { user } = useAuth();

    const location = useLocation();
    const navigate = useNavigate();
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ResumenDia, setResumenDia] = useState({
        total: 0,
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0
    });

    // View state
    const [activeTab, setActiveTab] = useState('historial'); // 'historial' | 'pendientes'
    const [cajaState, setCajaState] = useState({ estado: 'cerrada', apertura: null });

    // Modals state
    const [selectedPago, setSelectedPago] = useState(null);
    const [isCorteCajaOpen, setIsCorteCajaOpen] = useState(false);
    const [isAbrirCajaOpen, setIsAbrirCajaOpen] = useState(false);

    // Filters state
    const [filters, setFilters] = useState({
        fecha: new Date().toISOString().split('T')[0], // Today's date by default
        tipo: 'all'
    });

    const loadCajaState = async () => {
        try {
            const res = await paymentsAPI.getCajaStatus();
            setCajaState(res.data.data);
        } catch (err) {
            console.error('Error loading caja state:', err);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await paymentsAPI.getHistory({
                fecha: filters.fecha,
                tipo: filters.tipo === 'all' ? undefined : filters.tipo
            });

            setPagos(res.data.data.pagos);
            setResumenDia(res.data.data.resumenDia);
        } catch (err) {
            toast.error('Error al cargar el historial de pagos');
            setPagos([]);
            setResumenDia({ total: 0, efectivo: 0, tarjeta: 0, transferencia: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCajaState();
    }, []);

    useEffect(() => {
        if (activeTab === 'historial') {
            loadData();
        }
    }, [filters, activeTab, cajaState]);

    useEffect(() => {
        // Auto-show receipt if navigating from another page
        if (location.state?.showReceiptId) {
            handleVerRecibo({ id: location.state.showReceiptId });
            // Clear the state so it doesn't re-open on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleVerRecibo = async (pago) => {
        try {
            const res = await paymentsAPI.getReceipt(pago.id);
            setSelectedPago(res.data.data);
        } catch (err) {
            toast.error('Error al obtener el recibo');
        }
    };

    const handleAbrirCaja = async (data) => {
        try {
            await paymentsAPI.abrirCaja(data);
            toast.success('Caja abierta exitosamente');
            setIsAbrirCajaOpen(false);
            await loadCajaState();
            await loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al abrir la caja');
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Pagos y Caja</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de ingresos, recolección y deudas</p>
                </div>

                {/* Caja State Display */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {cajaState.estado === 'abierta' ? (
                        <div className="flex flex-col items-end mr-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" /> Caja Abierta
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Por: {cajaState.apertura?.cajero || 'Admin'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end mr-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3 mr-1" /> Caja Cerrada
                            </span>
                        </div>
                    )}

                    {cajaState.estado === 'abierta' ? (
                        <button
                            onClick={() => setIsCorteCajaOpen(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium flex justify-center items-center gap-2 shadow-sm">
                            <Cash className="w-5 h-5" />
                            Corte de Caja
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsAbrirCajaOpen(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex justify-center items-center gap-2 shadow-sm animate-pulse">
                            <Cash className="w-5 h-5" />
                            Abrir Caja
                        </button>
                    )}
                </div>
            </div>

            {/* Warning Banner if Caja Closed */}
            {cajaState.estado === 'cerrada' && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3 text-sm text-amber-700 flex flex-col">
                            <p className="font-bold">Advertencia: La caja está cerrada</p>
                            <p>Para poder procesar pagos (cobrar planes o vender productos), primero debes aperturar la caja indicando tu fondo o caja base.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`
                    ${activeTab === 'historial'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400 dark:text-primary-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600 dark:border-gray-600'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  `}
                    >
                        <Search className="w-4 h-4 mr-2" />
                        Historial del Día
                    </button>
                    <button
                        onClick={() => setActiveTab('pendientes')}
                        className={`
                    ${activeTab === 'pendientes'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400 dark:text-primary-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600 dark:border-gray-600'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  `}
                    >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Membresías Pendientes de Pago
                    </button>
                </nav>
            </div>

            {/* TAB CONTENT: HISTORIAL */}
            {activeTab === 'historial' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={filters.fecha}
                                    onChange={(e) => setFilters(prev => ({ ...prev, fecha: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <select
                                    value={filters.tipo}
                                    onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 dark:bg-gray-800"
                                >
                                    <option value="all">Todos los Tipos</option>
                                    <option value="membresia">Membresías</option>
                                    <option value="venta">Tienda</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Resumen Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-500">Recaudado (Filtros)</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(ResumenDia?.total || 0)}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600"><Cash className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Efectivo</h3>
                                <p className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">{formatCurrency(ResumenDia?.efectivo || 0)}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><CreditCard className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Tarjeta</h3>
                                <p className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">{formatCurrency(ResumenDia?.tarjeta || 0)}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><path d="M4 10v11" /><path d="M20 10v11" /><path d="M8 14v3" /><path d="M12 14v3" /><path d="M16 14v3" /></svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Transferencia</h3>
                                <p className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">{formatCurrency(ResumenDia?.transferencia || 0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Fecha/Hora</th>
                                        <th className="px-6 py-4">Cliente</th>
                                        <th className="px-6 py-4">Concepto</th>
                                        <th className="px-6 py-4">Monto</th>
                                        <th className="px-6 py-4">Método</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                <div className="flex justify-center mb-2">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                                </div>
                                                Cargando historial...
                                            </td>
                                        </tr>
                                    ) : pagos.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                <div className="flex justify-center mb-3">
                                                    <DollarSign className="w-10 h-10 text-gray-300" />
                                                </div>
                                                <p className="text-lg font-medium text-gray-900 dark:text-white dark:text-white">No hay pagos registrados</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        pagos.map((pago) => (
                                            <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="font-medium text-gray-900 dark:text-white dark:text-white">{formatDate(pago.fecha_hora)}</div>
                                                    <div className="text-xs text-gray-500">{formatTime(pago.fecha_hora)}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    {pago.cliente ? (
                                                        <div className="font-medium">{`${pago.cliente.nombre} ${pago.cliente.apellido}`}</div>
                                                    ) : (
                                                        <span className="text-gray-400">- Cliente General -</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 max-w-[200px] truncate" title={pago.concepto}>{pago.concepto}</td>
                                                <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white dark:text-white">{formatCurrency(pago.monto)}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                ${pago.metodo_pago === 'efectivo' ? 'bg-green-100 text-green-700' :
                                                            pago.metodo_pago === 'tarjeta' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-purple-100 text-purple-700'}`}>
                                                        {pago.metodo_pago}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <button
                                                        onClick={() => handleVerRecibo(pago)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 bg-white dark:bg-gray-800 border border-blue-200 rounded-lg inline-flex items-center transition-colors shadow-sm"
                                                        title="Ver Recibo"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PENDIENTES */}
            {activeTab === 'pendientes' && (
                <div className="flex-1 min-h-[500px]">
                    <PendientesList />
                </div>
            )}

            {/* Modals */}
            {selectedPago && (
                <ReciboPagoModal pago={selectedPago} onClose={() => setSelectedPago(null)} />
            )}

            <CorteCajaModal
                isOpen={isCorteCajaOpen}
                resumenDia={ResumenDia}
                fecha={filters.fecha}
                onClose={() => setIsCorteCajaOpen(false)}
                onGenerar={async () => {
                    toast.success('Corte de caja generado (caja cerrada).');
                    setIsCorteCajaOpen(false);
                    await loadCajaState();
                    await loadData();
                }}
            />

            <AbrirCajaModal
                isOpen={isAbrirCajaOpen}
                onClose={() => setIsAbrirCajaOpen(false)}
                onConfirm={handleAbrirCaja}
            />
        </div>
    );
};

export default HistorialPagos;
