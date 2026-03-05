import { useState, useEffect } from 'react';
import {
    DollarSign, Calendar as CalendarIcon, Clock, User, ArrowUpCircle, ArrowDownCircle,
    CreditCard, Building, Banknote, ChevronDown, ChevronUp, FileText, CheckCircle, AlertCircle,
    Filter, AlertTriangle, Box as Cash
} from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import AbrirCajaModal from '../Pagos/AbrirCajaModal';
import CorteCajaModal from '../Pagos/CorteCajaModal';

const HistorialCaja = () => {
    const { user } = useAuth();
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [cajaState, setCajaState] = useState({ estado: 'cerrada', apertura: null });
    const [resumenDia, setResumenDia] = useState({ total: 0, efectivo: 0, tarjeta: 0, transferencia: 0 });
    const [isAbrirCajaOpen, setIsAbrirCajaOpen] = useState(false);
    const [isCorteCajaOpen, setIsCorteCajaOpen] = useState(false);
    const [filters, setFilters] = useState({
        fecha_inicio: '',
        fecha_fin: ''
    });

    const loadCajaState = async () => {
        try {
            const res = await paymentsAPI.getCajaStatus();
            setCajaState(res.data.data);
        } catch (err) {
            console.error('Error loading caja state:', err);
        }
    };

    const loadResumenDia = async () => {
        try {
            const fecha = new Date().toISOString().split('T')[0];
            const res = await paymentsAPI.getHistory({ fecha });
            setResumenDia(res.data.data.resumenDia);
        } catch (err) {
            console.error('Error loading resumen:', err);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
            if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;

            const res = await paymentsAPI.getCajaHistorial(params);
            setSesiones(res.data.data.sesiones || []);
        } catch (err) {
            toast.error('Error al cargar el historial de caja');
            setSesiones([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCajaState();
        loadResumenDia();
    }, []);

    useEffect(() => {
        loadData();
    }, [filters]);

    const handleAbrirCaja = async (data) => {
        try {
            await paymentsAPI.abrirCaja(data);
            toast.success('Caja abierta exitosamente');
            setIsAbrirCajaOpen(false);
            await loadCajaState();
            await loadResumenDia();
            await loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al abrir la caja');
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getDuration = (apertura, cierre) => {
        if (!cierre) return 'En curso';
        const start = new Date(apertura.fecha_hora);
        const end = new Date(cierre.fecha_hora);
        const diffMs = end - start;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Caja</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control de aperturas, cierres y resumen de caja</p>
                </div>

                {/* Caja State + Action Button */}
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
                            <p>Para poder procesar pagos, primero debes aperturar la caja indicando tu fondo o caja base.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">Filtrar por fecha:</span>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Desde:</label>
                        <input
                            type="date"
                            value={filters.fecha_inicio}
                            onChange={(e) => setFilters(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Hasta:</label>
                        <input
                            type="date"
                            value={filters.fecha_fin}
                            onChange={(e) => setFilters(prev => ({ ...prev, fecha_fin: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                    </div>
                    {(filters.fecha_inicio || filters.fecha_fin) && (
                        <button
                            onClick={() => setFilters({ fecha_inicio: '', fecha_fin: '' })}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Sessions List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : sesiones.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white dark:text-white">No hay registros de caja</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aún no se han registrado aperturas o cierres de caja.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sesiones.map((sesion) => {
                        const isExpanded = expandedId === sesion.id;
                        const isOpen = sesion.estado === 'abierta';
                        const totalIngresos = sesion.cierre
                            ? (sesion.cierre.ingresos_efectivo || 0) + (sesion.cierre.ingresos_tarjeta || 0) + (sesion.cierre.ingresos_transferencia || 0)
                            : 0;

                        return (
                            <div
                                key={sesion.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition-all duration-200 ${isOpen ? 'border-green-200' : 'border-gray-100 dark:border-gray-700 dark:border-gray-700'}`}
                            >
                                {/* Session Header - Clickable */}
                                <button
                                    onClick={() => toggleExpand(sesion.id)}
                                    className="w-full p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${isOpen
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {isOpen ? <ArrowUpCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOpen
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {isOpen ? 'Abierta' : 'Cerrada'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(sesion.apertura.fecha_hora)}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white">
                                                Sesión del {formatDate(sesion.apertura.fecha_hora)}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    {sesion.apertura.cajero}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatTime(sesion.apertura.fecha_hora)}
                                                    {sesion.cierre && ` — ${formatTime(sesion.cierre.fecha_hora)}`}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                    Duración: {getDuration(sesion.apertura, sesion.cierre)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fondo Inicial</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">{formatCurrency(sesion.apertura.monto_inicial || 0)}</p>
                                        </div>
                                        {sesion.cierre && (
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Final</p>
                                                <p className="text-lg font-bold text-green-700">{formatCurrency(sesion.cierre.monto_final || 0)}</p>
                                            </div>
                                        )}
                                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                    </div>
                                </button>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Apertura Details */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-1.5 bg-green-100 rounded-lg">
                                                        <ArrowUpCircle className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-wider">Apertura</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                            <CalendarIcon className="w-3.5 h-3.5" /> Fecha
                                                        </span>
                                                        <span className="font-medium text-gray-900 dark:text-white dark:text-white">{formatDate(sesion.apertura.fecha_hora)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" /> Hora
                                                        </span>
                                                        <span className="font-medium text-gray-900 dark:text-white dark:text-white">{formatTime(sesion.apertura.fecha_hora)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                            <User className="w-3.5 h-3.5" /> Cajero
                                                        </span>
                                                        <span className="font-medium text-gray-900 dark:text-white dark:text-white">{sesion.apertura.cajero}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                            <DollarSign className="w-3.5 h-3.5" /> Fondo Inicial
                                                        </span>
                                                        <span className="font-bold text-gray-900 dark:text-white text-base">{formatCurrency(sesion.apertura.monto_inicial || 0)}</span>
                                                    </div>
                                                    {sesion.apertura.notas && (
                                                        <div className="text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1">
                                                                <FileText className="w-3.5 h-3.5" /> Notas
                                                            </span>
                                                            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 mt-1">{sesion.apertura.notas}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cierre Details */}
                                            {sesion.cierre ? (
                                                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="p-1.5 bg-red-100 rounded-lg">
                                                            <ArrowDownCircle className="w-4 h-4 text-red-600" />
                                                        </div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-wider">Cierre</h4>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                                <CalendarIcon className="w-3.5 h-3.5" /> Fecha
                                                            </span>
                                                            <span className="font-medium text-gray-900 dark:text-white dark:text-white">{formatDate(sesion.cierre.fecha_hora)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5" /> Hora
                                                            </span>
                                                            <span className="font-medium text-gray-900 dark:text-white dark:text-white">{formatTime(sesion.cierre.fecha_hora)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                                <User className="w-3.5 h-3.5" /> Cajero
                                                            </span>
                                                            <span className="font-medium text-gray-900 dark:text-white dark:text-white">{sesion.cierre.cajero}</span>
                                                        </div>

                                                        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
                                                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Desglose de Ingresos</p>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                                    <Banknote className="w-3.5 h-3.5 text-green-500" /> Efectivo
                                                                </span>
                                                                <span className="font-medium text-green-700">+{formatCurrency(sesion.cierre.ingresos_efectivo || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                                    <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Tarjeta
                                                                </span>
                                                                <span className="font-medium text-blue-700">+{formatCurrency(sesion.cierre.ingresos_tarjeta || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                                    <Building className="w-3.5 h-3.5 text-purple-500" /> Transferencia
                                                                </span>
                                                                <span className="font-medium text-purple-700">+{formatCurrency(sesion.cierre.ingresos_transferencia || 0)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-2">
                                                            <span className="text-gray-500">Egresos</span>
                                                            <span className="font-medium text-red-600">-{formatCurrency(sesion.cierre.egresos || 0)}</span>
                                                        </div>

                                                        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="font-semibold text-gray-700">Total Ingresos</span>
                                                                <span className="font-bold text-gray-900 dark:text-white dark:text-white">{formatCurrency(totalIngresos)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-bold text-gray-900 dark:text-white dark:text-white">Saldo Final Caja</span>
                                                                <span className="font-bold text-lg text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                                                                    {formatCurrency(sesion.cierre.monto_final || 0)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {sesion.cierre.notas && (
                                                            <div className="text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                                                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1">
                                                                    <FileText className="w-3.5 h-3.5" /> Notas de Cierre
                                                                </span>
                                                                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 mt-1">{sesion.cierre.notas}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-green-50 rounded-xl p-5 border border-green-200 flex flex-col items-center justify-center text-center">
                                                    <div className="p-3 bg-green-100 rounded-full mb-3">
                                                        <AlertCircle className="w-8 h-8 text-green-600" />
                                                    </div>
                                                    <h4 className="font-bold text-green-800 text-lg mb-1">Caja Abierta</h4>
                                                    <p className="text-sm text-green-700">
                                                        Esta sesión aún no ha sido cerrada. El corte de caja se encuentra pendiente.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <AbrirCajaModal
                isOpen={isAbrirCajaOpen}
                onClose={() => setIsAbrirCajaOpen(false)}
                onConfirm={handleAbrirCaja}
            />

            <CorteCajaModal
                isOpen={isCorteCajaOpen}
                resumenDia={resumenDia}
                fecha={new Date().toISOString().split('T')[0]}
                onClose={() => setIsCorteCajaOpen(false)}
                onGenerar={async () => {
                    toast.success('Corte de caja generado (caja cerrada).');
                    setIsCorteCajaOpen(false);
                    await loadCajaState();
                    await loadResumenDia();
                    await loadData();
                }}
            />
        </div>
    );
};

export default HistorialCaja;
