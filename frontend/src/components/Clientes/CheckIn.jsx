import { useState, useEffect } from 'react'
import { Search, QrCode, CheckCircle, XCircle, AlertCircle, User, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { membersAPI, attendanceAPI } from '../../services/api'
import { formatDateTime } from '../../utils/formatters'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'

const CheckIn = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recentCheckIns, setRecentCheckIns] = useState([])
  const [loading, setLoading] = useState(false)
  const [qrScannerActive, setQrScannerActive] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState(null)
  const [checkMode, setCheckMode] = useState('entrada') // 'entrada' | 'salida'
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 8

  // Load recent check-ins on mount
  useEffect(() => {
    loadRecentCheckIns()
  }, [])

  // Search members by name or code as user types with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchMembers(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Get active check-ins count
  const getTodayCount = () => {
    return recentCheckIns.length;
  }

  // Load recent check-ins
  const loadRecentCheckIns = async () => {
    try {
      let response;
      if (typeof attendanceAPI.getToday === 'function') {
        response = await attendanceAPI.getToday();
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        response = await attendanceAPI.getAll({ fecha: todayStr });
      }
      setRecentCheckIns(response.data.asistencias || response.data || [])
      setCurrentPage(1) // Reset to first page on refresh
    } catch (error) {
      console.error('Error loading recent check-ins:', error)
    }
  }

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(recentCheckIns.length / PAGE_SIZE))
  const paginatedRows = recentCheckIns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Search for members
  const searchMembers = async (term) => {
    setLoading(true)
    try {
      const response = await membersAPI.getAll({ search: term, limit: 5 })
      setSearchResults(response.data.clientes || response.data.miembros || response.data.data || [])
    } catch (error) {
      console.error('Error searching members:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check in/out by code depending on mode
  const handleCheckInByCode = async () => {
    if (!searchTerm.trim()) return
    setLoading(true)
    try {
      let response
      if (checkMode === 'salida') {
        response = await attendanceAPI.checkOutByCode({ codigo: searchTerm })
      } else {
        response = await attendanceAPI.checkInByCode({ codigo: searchTerm })
      }
      showConfirmation(response.data)
    } catch (error) {
      handleCheckInError(error)
    } finally {
      setLoading(false)
    }
  }

  // Handle manual check-out from list
  const handleCheckOut = async (clienteId, nombre) => {
    try {
      const response = await attendanceAPI.registerExit({ cliente_id: clienteId })
      showConfirmation(response.data)
    } catch (error) {
      handleCheckInError(error, nombre)
    }
  }

  // Handle manual check-in from list
  const handleCheckIn = async (miembroId, nombre) => {
    try {
      const response = await attendanceAPI.register({ cliente_id: miembroId })
      showConfirmation(response.data)
    } catch (error) {
      handleCheckInError(error, nombre)
    }
  }

  const handleCheckInError = (error, nombre = '') => {
    const message = error.response?.data?.error || error.response?.data?.message || 'Error al registrar asistencia'

    if (error.response?.status === 403) {
      toast.error(
        <div className="flex flex-col gap-1">
          <strong>Membresía inactiva</strong>
          <span>{nombre || error.response?.data?.cliente?.nombre || 'El cliente'} no tiene una membresía activa</span>
        </div>,
        { duration: 5000, icon: '❌' }
      )
    } else {
      toast.error(message)
    }
    console.error('Error checking in:', error)
  }

  const showConfirmation = (data) => {
    setConfirmationModal(data)
    setSearchTerm('')
    setSearchResults([])
    loadRecentCheckIns()
  }

  // Handle QR scanner activation
  const handleQrScan = () => {
    setQrScannerActive(!qrScannerActive)
  }

  // QR Scanner Effect
  useEffect(() => {
    let html5QrCode = null;

    if (qrScannerActive) {
      // Small timeout to ensure the DOM element "qr-reader" is mounted before starting
      setTimeout(() => {
        html5QrCode = new Html5Qrcode("qr-reader");

        html5QrCode.start(
          { facingMode: "environment" }, // Prioritize back camera on mobile
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (html5QrCode && html5QrCode.isScanning) {
              await html5QrCode.stop().catch(console.error);
            }
            setQrScannerActive(false);
            setSearchTerm(decodedText);

            // Auto-submit the scanned code (mode-aware)
            setLoading(true);
            try {
              let response;
              if (checkMode === 'salida') {
                response = await attendanceAPI.checkOutByCode({ codigo: decodedText });
              } else {
                response = await attendanceAPI.checkInByCode({ codigo: decodedText });
              }
              showConfirmation(response.data);
            } catch (error) {
              handleCheckInError(error);
            } finally {
              setLoading(false);
            }
          },
          (errorMessage) => {
            // ignore constant background frame scan errors
          }
        ).catch((err) => {
          console.error("Camera access error:", err);
          toast.error("No se pudo iniciar la cámara. Por favor autoriza los permisos.");
          setQrScannerActive(false);
        });
      }, 100);
    }

    // Cleanup on component unmount or scanner deactivation
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [qrScannerActive]);

  // Helper formatting 
  const calculateDaysLeft = (expiryDate) => {
    if (!expiryDate) return 0
    const diff = new Date(expiryDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('es-ES')
  }

  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col gap-4 p-5 bg-gray-50">
      {/* Principal Header Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-primary-600 rounded-t-xl px-6 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={24} />
            <h1 className="text-xl font-bold">Control de Asistencia</h1>
          </div>
          {/* Live clock placeholder */}
          <div className="text-primary-100 font-medium tracking-wider">
            {new Date().toLocaleDateString('es-ES')}
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-4 max-w-3xl">

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => { setCheckMode('entrada'); setSearchTerm(''); setSearchResults([]); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${checkMode === 'entrada'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <ArrowRight size={16} /> Registrar Entrada
              </button>
              <button
                onClick={() => { setCheckMode('salida'); setSearchTerm(''); setSearchResults([]); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${checkMode === 'salida'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <ArrowLeft size={16} /> Registrar Salida
              </button>
            </div>

            {/* Unified Search Input */}
            <div>
              <label className="block text-gray-700 font-medium mb-3" htmlFor="search_input">
                {checkMode === 'salida' ? 'Busque el cliente para registrar su salida:' : 'Ingrese código, ID o busque por nombre del cliente:'}
              </label>
              <div className="flex gap-3 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="search_input"
                    type="text"
                    placeholder="Ej. Juan Pérez o C-001..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckInByCode()}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg shadow-sm transition-shadow"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('')
                        setSearchResults([])
                      }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
                      title="Cancelar búsqueda"
                    >
                      <XCircle size={24} />
                    </button>
                  )}

                  {/* Search Results Dropdown */}
                  {!loading && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 border border-gray-200 rounded-xl max-h-80 overflow-y-auto bg-white shadow-xl z-50">
                      {searchResults.map((member) => (
                        <div key={member.id} className="p-4 border-b last:border-0 flex items-center justify-between hover:bg-gray-50 transition cursor-default">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 overflow-hidden shrink-0 border border-primary-200">
                              {member.foto ? <img src={member.foto} alt="User" className="h-full w-full object-cover" /> : <User size={24} />}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-lg leading-tight">{member.nombre} {member.apellido}</p>
                              <p className="text-sm font-medium text-gray-500 mt-1">Código: <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{member.codigo}</span></p>
                            </div>
                          </div>
                          <button
                            onClick={() => checkMode === 'salida' ? handleCheckOut(member.id, member.nombre) : handleCheckIn(member.id, member.nombre)}
                            className={`px-5 py-2.5 text-white text-sm font-bold rounded-lg shadow-sm transition transform active:scale-95 ${checkMode === 'salida' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary-600 hover:bg-primary-700'
                              }`}
                          >
                            {checkMode === 'salida' ? 'Salida' : 'Entrada'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckInByCode}
                  disabled={loading || !searchTerm.trim()}
                  className={`flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${checkMode === 'salida' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  title="Registrar usando código exacto"
                >
                  {checkMode === 'salida' ? <ArrowLeft size={20} /> : <CheckCircle size={20} />}
                  {checkMode === 'salida' ? 'Reg. Salida' : 'Ingresar'}
                </button>
                <button
                  onClick={handleQrScan}
                  className={`flex items-center gap-2 px-6 py-3 border-2 font-bold rounded-xl transition shadow-sm ${qrScannerActive ? 'bg-primary-50 border-primary-400 text-primary-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}
                  title="Escanear código QR"
                >
                  <QrCode size={20} className={qrScannerActive ? 'text-primary-600' : ''} />
                  QR
                </button>
              </div>

              {/* QR Scanner View */}
              {qrScannerActive && (
                <div className="mt-4 p-4 border-2 border-primary-200 bg-primary-50 rounded-xl max-w-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-primary-900 flex items-center gap-2">
                      <QrCode size={20} />
                      Cámara Activa
                    </h3>
                    <button
                      onClick={() => setQrScannerActive(false)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <XCircle size={24} />
                    </button>
                  </div>
                  <div id="qr-reader" className="w-full mx-auto overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200"></div>
                  <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                    Apunta al código QR del cliente para registrar su entrada o salida
                  </p>
                </div>
              )}

              {/* Helper text */}
              <p className="text-gray-500 text-sm mt-3 flex items-center gap-1.5 ml-1">
                <AlertCircle size={14} /> Escriba un nombre para ver sugerencias, o escriba el código exacto y presione Enter.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table - fills remaining height */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Asistencias de Hoy — {new Date().toLocaleDateString('es-ES')}
          </h2>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total hoy: {getTodayCount()} asistencias
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                {checkMode === 'salida' && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-orange-500 uppercase tracking-wider">Acción</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    No hay asistencias registradas hoy.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((ci) => (
                  <tr key={ci.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatTimeOnly(ci.fecha_hora || ci.fechaHora)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {ci.cliente_foto ? <img src={ci.cliente_foto} alt="User" className="h-full w-full object-cover" /> : <User size={16} className="text-gray-500" />}
                      </div>
                      {ci.cliente_nombre || ci.miembroNombre} {ci.cliente_apellido || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ci.codigo || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ci.tipo === 'salida' ? (
                        <span className="flex items-center gap-1 text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full w-fit">
                          <ArrowLeft size={14} /> Salida
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full w-fit">
                          <ArrowRight size={14} /> Entrada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-green-700 bg-green-100 flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-semibold">
                        <CheckCircle size={12} /> ✅ Activa
                      </span>
                    </td>
                    {checkMode === 'salida' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ci.tipo === 'entrada' ? (
                          <button
                            onClick={() => handleCheckOut(ci.cliente_id, ci.cliente_nombre)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition shadow-sm"
                          >
                            <ArrowLeft size={12} /> Registrar Salida
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Ya salió</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-3">
            <span className="text-xs text-gray-500">
              Página {currentPage} de {totalPages} &mdash; {recentCheckIns.length} registros
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                &larr; Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${page === currentPage
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className={`${confirmationModal.tipo === 'salida' ? 'bg-orange-500' : 'bg-green-500'} px-6 py-4 text-white flex items-center gap-3`}>
                <CheckCircle size={28} className="text-white" />
                <h2 className="text-lg font-bold">
                  {confirmationModal.tipo === 'salida' ? 'CHECK-OUT EXITOSO' : 'CHECK-IN EXITOSO'}
                </h2>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-20 w-20 bg-gray-100 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                    {confirmationModal.cliente_foto ? (
                      <img src={confirmationModal.cliente_foto} alt="Cliente" className="h-full w-full object-cover" />
                    ) : (
                      <User size={40} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{confirmationModal.cliente_nombre} {confirmationModal.cliente_apellido}</h3>
                    <p className="text-gray-500 font-medium">Código: {confirmationModal.codigo}</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                    <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                    Membresía ACTIVA
                  </div>
                  <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Plan:</span> {confirmationModal.membresia?.nombre || 'General'}
                  </p>
                  <p className="text-gray-700 text-sm">
                    <span className="font-semibold">Vence:</span> {formatDateOnly(confirmationModal.membresia?.fecha_vencimiento)}
                    <span className="text-gray-500 ml-1">
                      ({calculateDaysLeft(confirmationModal.membresia?.fecha_vencimiento)} días)
                    </span>
                  </p>
                </div>

                <div className="mb-6 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                    Asistencia registrada:
                  </p>
                  <p className="text-gray-800 font-medium flex items-center gap-2">
                    <Clock size={16} className="text-primary-500" />
                    {formatDateOnly(confirmationModal.fecha_hora || confirmationModal.fechaHora)} - {formatTimeOnly(confirmationModal.fecha_hora || confirmationModal.fechaHora)}
                  </p>
                </div>

                <button
                  onClick={() => setConfirmationModal(null)}
                  className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition shadow-md flex justify-center items-center gap-2"
                >
                  ✓ Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckIn
