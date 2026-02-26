import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Printer, Mail, X } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import { paymentsAPI } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import Swal from 'sweetalert2';

const ReciboPagoModal = ({ pago, onClose }) => {
    const [sendingEmail, setSendingEmail] = useState(false);
    const { element: notificationElement, showNotification } = useNotifications();

    const handlePrint = () => {
        window.print();
    };

    const handleEmailReceipt = async () => {
        const result = await Swal.fire({
            title: 'Enviar Recibo por Correo',
            text: 'Ingrese la dirección de correo electrónico:',
            input: 'email',
            inputValue: pago.cliente?.email || '',
            inputPlaceholder: 'correo@ejemplo.com',
            showCancelButton: true,
            confirmButtonText: 'Enviar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#111827',
            cancelButtonColor: '#9ca3af',
        });

        if (result.isConfirmed && result.value) {
            setSendingEmail(true);
            try {
                await paymentsAPI.enviarRecibo(pago.id, { email: result.value });
                showNotification('Recibo enviado exitosamente', 'success');
            } catch (error) {
                console.error("Error enviando recibo:", error);
                showNotification(error.response?.data?.error || 'Error al enviar el correo', 'error');
            } finally {
                setSendingEmail(false);
            }
        }
    };

    const isMembresia = pago.concepto?.toLowerCase().includes('membres') || pago.tipo === 'membresia';
    const isCuotaPago = pago.concepto?.toLowerCase().includes('cuota');

    // Try to extract cuota number and total from concepto like "Pago de Cuota 2 - Membresía Plan X"
    const cuotaMatch = pago.concepto?.match(/cuota\s+(\d+)\/(\d+)/i);
    const cuotaNum = cuotaMatch ? parseInt(cuotaMatch[1]) : null;
    const totalCuotas = cuotaMatch ? parseInt(cuotaMatch[2]) : null;

    return (
        <Transition appear show={true} as={Fragment}>
            <Dialog as="div" className="relative z-50 print:z-0" onClose={onClose}>
                {notificationElement}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm print:hidden" />
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
                            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all print:shadow-none print:max-w-none print:w-auto print:transform-none print:overflow-visible print:bg-transparent">

                                {/* Close Button - Hidden when printing */}
                                <div className="absolute right-4 top-4 print:hidden">
                                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Receipt Content */}
                                <div className="p-8 print:p-0 bg-white font-mono text-sm print:text-xs text-gray-800" id="printable-receipt">

                                    {/* Header */}
                                    <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-6">
                                        <h2 className="text-xl font-bold uppercase tracking-widest mb-2">GET FIT</h2>
                                        <p>Calle Principal 123, Ciudad</p>
                                        <p>Tel: (555) 123-4567</p>
                                        <p className="mt-2 text-xs">RFC: GYM123456XYZ</p>
                                    </div>

                                    {/* Receipt Info */}
                                    <div className="mb-6 space-y-1">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">RECIBO:</span>
                                            <span>#{pago.id.toString().padStart(6, '0')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">FECHA:</span>
                                            <span>{formatDate(pago.fecha_hora)} {formatTime(pago.fecha_hora)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">CAJERO:</span>
                                            <span>Administrador</span> {/* Or from pago.usuario */}
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

                                    {/* Client Info */}
                                    <div className="mb-6 space-y-1">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">CLIENTE:</span>
                                            <span className="text-right">
                                                {pago.cliente ? `${pago.cliente.nombre} ${pago.cliente.apellido}` : 'Público General'}
                                            </span>
                                        </div>
                                        {pago.cliente?.codigo && (
                                            <div className="flex justify-between">
                                                <span className="font-semibold">CÓDIGO:</span>
                                                <span>{pago.cliente.codigo}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

                                    {/* Items */}
                                    <div className="mb-6">
                                        <div className="font-bold mb-2 pb-1 border-b border-gray-200">CONCEPTO</div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="pr-4">
                                                <p className="font-medium whitespace-pre-wrap">{pago.concepto}</p>
                                                {isMembresia && !isCuotaPago && (
                                                    <p className="text-xs text-gray-500 mt-1">Renovación de Plan</p>
                                                )}
                                                {isCuotaPago && cuotaNum && totalCuotas && (
                                                    <p className="text-xs text-gray-500 mt-1">Cuota {cuotaNum} de {totalCuotas}</p>
                                                )}
                                            </div>
                                            <span className="font-medium">{formatCurrency(pago.monto)}</span>
                                        </div>

                                        {/* Cuotas summary section */}
                                        {isCuotaPago && pago.abonado_total !== undefined && (
                                            <div className="mt-3 p-2 bg-gray-50 rounded border border-dashed border-gray-300 text-xs space-y-1">
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Total del Plan:</span>
                                                    <span>{formatCurrency(pago.precio_total || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Total Abonado:</span>
                                                    <span>{formatCurrency(pago.abonado_total || 0)}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-1">
                                                    <span>Saldo Pendiente:</span>
                                                    <span>{formatCurrency((pago.precio_total || 0) - (pago.abonado_total || 0))}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t-2 border-black my-4"></div>

                                    {/* Totals */}
                                    <div className="space-y-1 mb-6">
                                        <div className="flex justify-between text-base font-bold bg-gray-50 p-2 rounded">
                                            <span>TOTAL:</span>
                                            <span>{formatCurrency(pago.monto)}</span>
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                                            <span>MÉTODO DE PAGO:</span>
                                            <span className="uppercase">{pago.metodo_pago}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>RECIBIDO:</span>
                                            <span>{formatCurrency(pago.monto)}</span> {/* Ideally from DB */}
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>CAMBIO:</span>
                                            <span>{formatCurrency(0)}</span> {/* Ideally from DB */}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="text-center mt-8 border-t-2 border-dashed border-gray-300 pt-6">
                                        <p className="font-semibold pb-1">¡GRACIAS POR SU PREFERENCIA!</p>
                                        <p className="text-xs">Conserve este ticket para cualquier aclaración.</p>
                                        <p className="text-xs mt-2 italic">¡Buen entrenamiento!</p>
                                    </div>

                                </div>

                                {/* Print Styles */}
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                    @media print {
                        body * { visibility: hidden !important; }
                        #printable-receipt, #printable-receipt * { visibility: visible !important; }
                        #printable-receipt { 
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

                                {/* Actions - Hidden when printing */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden justify-center rounded-b-2xl">
                                    <button
                                        onClick={handlePrint}
                                        disabled={sendingEmail}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir
                                    </button>
                                    <button
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
                                        onClick={handleEmailReceipt}
                                        disabled={sendingEmail}
                                    >
                                        <Mail className="w-4 h-4" />
                                        {sendingEmail ? 'Enviando...' : 'Email'}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        disabled={sendingEmail}
                                        className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm transition-colors disabled:opacity-50"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ReciboPagoModal;
