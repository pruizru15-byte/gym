import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Printer, Save, X, AlertTriangle, DollarSign, CreditCard, Building } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { paymentsAPI } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const CorteCajaModal = ({ isOpen, resumenDia, fecha, onClose, onGenerar }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [notas, setNotas] = useState('');
    const { error } = useNotifications();
    const [cajaState, setCajaState] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        // Fetch original box state to get the opening amount
        const fetchState = async () => {
            try {
                const res = await paymentsAPI.getCajaStatus();
                setCajaState(res.data.data);
            } catch (err) {
                console.error('Error fetching caja state', err);
            }
        };
        fetchState();
    }, [isOpen]);

    const fondoInicial = cajaState?.apertura?.monto_inicial || 0;
    const totalIngresos = resumenDia?.total || 0;
    // TODO: Add expenses endpoint/calc later. Mocking $0 according to mockup
    const totalEgresos = 0;

    // Total in the register should be: Initial Foundation + Income in Cash - Expenses in Cash
    // Note: 'resumenDia.efectivo' represents the income paid IN CASH physically entered today.
    const totalEfectivoEnCaja = fondoInicial + (resumenDia?.efectivo || 0) - totalEgresos;

    const handleCerrarCaja = async () => {
        try {
            setLoading(true);
            await paymentsAPI.recordCashCut({
                fecha: new Date().toISOString(),
                notas: notas
            });

            if (onGenerar) await onGenerar();
            onClose();
        } catch (err) {
            console.error(err);
            error(err.response?.data?.error || 'Error al cerrar la caja');
        } finally {
            setLoading(false);
        }
    };

    const currentDateTime = new Date();

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50 print:z-0" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm print:hidden" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto print:relative print:overflow-visible">
                    <div className="flex min-h-full items-center justify-center p-4 text-center print:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all print:shadow-none print:max-w-none print:w-auto print:transform-none print:overflow-visible print:bg-transparent">

                                {/* Header Section */}
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center print:hidden">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-primary-600 dark:text-primary-400 dark:text-primary-400" />
                                        Corte de Caja
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Print Content Area */}
                                <div className="p-6 bg-white dark:bg-gray-800 dark:bg-gray-800" id="printable-corte">

                                    {/* Simplified Header for Print */}
                                    <div className="hidden print:block text-center mb-6 border-b-2 border-dashed border-gray-300 dark:border-gray-600 pb-4">
                                        <h2 className="font-bold text-xl uppercase mb-1">Corte de Caja</h2>
                                        <p className="text-sm">{formatDate(new Date(fecha))} - {currentDateTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>

                                    {/* Top Alert / Date Row */}
                                    <div className="flex justify-between items-center mb-6 print:hidden">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                            {formatDate(new Date(fecha))}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-200">
                                            <AlertTriangle className="w-3 h-3" />
                                            Revisar sumatoria antes de cerrar
                                        </span>
                                    </div>

                                    {/* Content Grids - Display Horizontal on Desktop */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Efectivo Físico */}
                                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl print:p-0 print:border-none border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                                            <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 tracking-wide flex-shrink-0">EFECTIVO FÍSICO</h4>
                                            <div className="space-y-3 flex-grow">
                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>Fondo Inicial (Apertura):</span>
                                                    <span className="font-medium text-gray-900 dark:text-white dark:text-white">{formatCurrency(fondoInicial)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>Ingresos en Efectivo Hoy:</span>
                                                    <span className="font-medium text-green-700">+{formatCurrency(resumenDia.efectivo || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                                                    <span>Egresos en Efectivo Hoy:</span>
                                                    <span className="font-medium text-red-600">-{formatCurrency(totalEgresos)}</span>
                                                </div>
                                                <div className="pt-2 flex justify-between items-center font-bold text-gray-900 dark:text-white text-lg mt-auto">
                                                    <span>Total Caja:</span>
                                                    <span className="text-green-700 bg-green-50 px-2 py-1 rounded">{formatCurrency(totalEfectivoEnCaja)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Otros Métodos - Informativo */}
                                        <div className="flex flex-col h-full">
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider pl-1 font-mono">Movimientos Bancarios</h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div className="flex justify-between text-sm p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                                                        <span className="flex items-center gap-2 font-medium text-gray-700"><CreditCard className="w-4 h-4 text-blue-600" /> Tarjeta:</span>
                                                        <span className="font-bold text-gray-900 dark:text-white dark:text-white">{formatCurrency(resumenDia.tarjeta || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                                                        <span className="flex items-center gap-2 font-medium text-gray-700"><Building className="w-4 h-4 text-purple-600" /> Transferencia:</span>
                                                        <span className="font-bold text-gray-900 dark:text-white dark:text-white">{formatCurrency(resumenDia.transferencia || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-6">
                                                <div className="flex justify-between text-sm p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm font-bold">
                                                    <span className="flex items-center gap-2 text-gray-700">Total Ingresos Día:</span>
                                                    <span className="text-gray-900 dark:text-white dark:text-white">{formatCurrency(totalIngresos)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notas de Cierre */}
                                    <div className="pt-4 print:hidden">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas de Cierre (Opcional)</label>
                                        <textarea
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 border px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                                            rows="2"
                                            placeholder="Ej. Dejé $500 para la caja de mañana..."
                                            value={notas}
                                            onChange={(e) => setNotas(e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* Metadata Footer */}
                                    <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
                                        <div>
                                            <p className="font-medium text-gray-700 dark:text-gray-300 uppercase">CAJERO</p>
                                            <p>{user?.nombre || 'Administrador'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-700 dark:text-gray-300 uppercase">HORA</p>
                                            <p>{currentDateTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Print Styles */}
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                    @media print {
                        body * { visibility: hidden !important; }
                        #printable-corte, #printable-corte * { visibility: visible !important; }
                        #printable-corte { 
                            position: absolute !important; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            padding: 20px !important; 
                            margin: 0 !important; 
                        }
                        @page { margin: 10mm; size: auto; }
                    }
                `}} />

                                {/* Actions */}
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-3 print:hidden">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors font-medium border-dashed"
                                        onClick={() => window.print()}
                                    >
                                        <span className="flex items-center gap-2"><Printer className="w-4 h-4" /> Imprimir</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors font-medium"
                                        onClick={onClose}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="px-6 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium flex items-center justify-center gap-2 disabled:bg-primary-400"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            await handleCerrarCaja();
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <><Save className="w-4 h-4" /> Cerrar Definitivamente</>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition >
    );
};

export default CorteCajaModal;
