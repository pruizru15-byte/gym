import { useRef, useState, useEffect } from 'react'
import { X, FileText, Image, Download } from 'lucide-react'
import { configuracionAPI } from '../../services/api'
import { formatDate } from '../../utils/formatters'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import './CarnetCliente.css'

/**
 * CarnetCliente — Renders a 26×32 mm ID card (front & back)
 * and provides export to PDF / IMG.
 *
 * Props:
 *   cliente       – client object (nombre, apellido, codigo, qr_code, email, telefono, foto, …)
 *   membresia     – active membership object or null
 *   visible       – boolean controlling modal
 *   onClose       – callback to close
 */
const CarnetCliente = ({ cliente, membresia, visible, onClose }) => {
    const frontRef = useRef(null)
    const backRef = useRef(null)
    const [gymName, setGymName] = useState('MI GIMNASIO')
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        configuracionAPI.getGymInfo()
            .then(res => {
                if (res.data?.nombre_gimnasio) setGymName(res.data.nombre_gimnasio)
            })
            .catch(() => { })
    }, [])

    if (!visible || !cliente) return null

    const initials = `${(cliente.nombre || '')[0] || ''}${(cliente.apellido || '')[0] || ''}`.toUpperCase()

    const fechaVenc = membresia?.fecha_vencimiento || membresia?.fechaVencimiento
    const planNombre = membresia?.membresia_nombre || membresia?.planNombre || membresia?.nombre || ''

    // ---- helpers ----
    const captureCard = async (ref, scale = 4) => {
        return html2canvas(ref.current, {
            scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
        })
    }

    // 26×32 mm in points (1 mm ≈ 2.835 pt)
    const W_MM = 26
    const H_MM = 32

    const exportAsPDF = async () => {
        setExporting(true)
        try {
            const [frontCanvas, backCanvas] = await Promise.all([
                captureCard(frontRef),
                captureCard(backRef),
            ])

            // PDF page = A4, card centered
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            const pageW = pdf.internal.pageSize.getWidth()
            const pageH = pdf.internal.pageSize.getHeight()

            // Center the card
            const x = (pageW - W_MM) / 2
            const y = (pageH - H_MM) / 2

            // Front
            const frontImg = frontCanvas.toDataURL('image/png')
            pdf.addImage(frontImg, 'PNG', x, y, W_MM, H_MM)

            // Add label above
            pdf.setFontSize(8)
            pdf.setTextColor(100)
            pdf.text('CARA FRONTAL', pageW / 2, y - 3, { align: 'center' })

            // Back  – new page
            pdf.addPage()
            const backImg = backCanvas.toDataURL('image/png')
            pdf.addImage(backImg, 'PNG', x, y, W_MM, H_MM)
            pdf.setFontSize(8)
            pdf.setTextColor(100)
            pdf.text('CARA TRASERA', pageW / 2, y - 3, { align: 'center' })

            pdf.save(`Carnet_${cliente.nombre}_${cliente.apellido}.pdf`)
        } catch (err) {
            console.error('PDF export error:', err)
        } finally {
            setExporting(false)
        }
    }

    const exportAsImage = async () => {
        setExporting(true)
        try {
            const [frontCanvas, backCanvas] = await Promise.all([
                captureCard(frontRef, 6),
                captureCard(backRef, 6),
            ])

            // Combine front + back side-by-side with a small gap
            const gap = 30
            const combinedCanvas = document.createElement('canvas')
            combinedCanvas.width = frontCanvas.width + backCanvas.width + gap
            combinedCanvas.height = Math.max(frontCanvas.height, backCanvas.height)
            const ctx = combinedCanvas.getContext('2d')
            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)
            ctx.drawImage(frontCanvas, 0, 0)
            ctx.drawImage(backCanvas, frontCanvas.width + gap, 0)

            const link = document.createElement('a')
            link.download = `Carnet_${cliente.nombre}_${cliente.apellido}.png`
            link.href = combinedCanvas.toDataURL('image/png')
            link.click()
        } catch (err) {
            console.error('Image export error:', err)
        } finally {
            setExporting(false)
        }
    }

    return (
        <>
            {/* Hidden render area – cards at 4× for capture */}
            <div className="carnet-render-area">
                {/* FRONT */}
                <div ref={frontRef} className="carnet-face carnet-front">
                    <div className="carnet-top-stripe" />
                    <div className="carnet-gym-name">{gymName}</div>
                    <div className="carnet-avatar">
                        {cliente.foto ? (
                            <img src={cliente.foto} alt={cliente.nombre} />
                        ) : (
                            <span className="carnet-avatar-initials">{initials}</span>
                        )}
                    </div>
                    <div className="carnet-client-name">{cliente.nombre} {cliente.apellido}</div>
                    <div className="carnet-client-code">{cliente.codigo || cliente.id}</div>
                    {cliente.qr_code && (
                        <div className="carnet-qr-container">
                            <img src={cliente.qr_code} alt="QR" />
                        </div>
                    )}
                    <div className="carnet-member-label">— Miembro —</div>
                </div>

                {/* BACK */}
                <div ref={backRef} className="carnet-face carnet-back">
                    <div className="carnet-back-header">{gymName}</div>

                    {/* Personal Data */}
                    <div className="carnet-back-section">
                        <div className="carnet-back-section-title">Datos Personales</div>
                        {cliente.email && (
                            <div className="carnet-back-row">
                                <span className="carnet-back-label">Email</span>
                                <span className="carnet-back-value">{cliente.email}</span>
                            </div>
                        )}
                        {cliente.telefono && (
                            <div className="carnet-back-row">
                                <span className="carnet-back-label">Teléfono</span>
                                <span className="carnet-back-value">{cliente.telefono}</span>
                            </div>
                        )}
                        <div className="carnet-back-row">
                            <span className="carnet-back-label">Código</span>
                            <span className="carnet-back-value">{cliente.codigo || cliente.id}</span>
                        </div>
                    </div>

                    {/* Membership */}
                    <div className="carnet-back-section">
                        <div className="carnet-back-section-title">Membresía</div>
                        {membresia ? (
                            <>
                                <div className="carnet-back-row">
                                    <span className="carnet-back-label">Estado</span>
                                    <span className="carnet-status-badge activa">Activa</span>
                                </div>
                                <div className="carnet-back-row">
                                    <span className="carnet-back-label">Plan</span>
                                    <span className="carnet-back-value">{planNombre}</span>
                                </div>
                                <div className="carnet-back-row">
                                    <span className="carnet-back-label">Vence</span>
                                    <span className="carnet-back-value">{formatDate(fechaVenc)}</span>
                                </div>
                            </>
                        ) : (
                            <div className="carnet-back-row">
                                <span className="carnet-back-label">Estado</span>
                                <span className="carnet-status-badge inactiva">Sin membresía</span>
                            </div>
                        )}
                    </div>

                    <div className="carnet-back-footer">
                        Presentar este carnet para acceso al gimnasio
                    </div>
                    <div className="carnet-back-bottom-stripe" />
                </div>
            </div>

            {/* Preview Modal */}
            <div className="carnet-modal-overlay" onClick={onClose}>
                <div className="carnet-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="carnet-modal-header">
                        <h2>🪪 Carnet del Cliente</h2>
                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="carnet-modal-body">
                        <div className="carnet-preview-wrapper">
                            <div className="carnet-preview-label">Frontal</div>
                            <div className="carnet-preview-card">
                                <div className="carnet-face carnet-front" style={{ pointerEvents: 'none' }}>
                                    <div className="carnet-top-stripe" />
                                    <div className="carnet-gym-name">{gymName}</div>
                                    <div className="carnet-avatar">
                                        {cliente.foto ? (
                                            <img src={cliente.foto} alt={cliente.nombre} />
                                        ) : (
                                            <span className="carnet-avatar-initials">{initials}</span>
                                        )}
                                    </div>
                                    <div className="carnet-client-name">{cliente.nombre} {cliente.apellido}</div>
                                    <div className="carnet-client-code">{cliente.codigo || cliente.id}</div>
                                    {cliente.qr_code && (
                                        <div className="carnet-qr-container">
                                            <img src={cliente.qr_code} alt="QR" />
                                        </div>
                                    )}
                                    <div className="carnet-member-label">— Miembro —</div>
                                </div>
                            </div>
                        </div>

                        <div className="carnet-preview-wrapper">
                            <div className="carnet-preview-label">Trasera</div>
                            <div className="carnet-preview-card">
                                <div className="carnet-face carnet-back" style={{ pointerEvents: 'none' }}>
                                    <div className="carnet-back-header">{gymName}</div>
                                    <div className="carnet-back-section">
                                        <div className="carnet-back-section-title">Datos Personales</div>
                                        {cliente.email && (
                                            <div className="carnet-back-row">
                                                <span className="carnet-back-label">Email</span>
                                                <span className="carnet-back-value">{cliente.email}</span>
                                            </div>
                                        )}
                                        {cliente.telefono && (
                                            <div className="carnet-back-row">
                                                <span className="carnet-back-label">Teléfono</span>
                                                <span className="carnet-back-value">{cliente.telefono}</span>
                                            </div>
                                        )}
                                        <div className="carnet-back-row">
                                            <span className="carnet-back-label">Código</span>
                                            <span className="carnet-back-value">{cliente.codigo || cliente.id}</span>
                                        </div>
                                    </div>
                                    <div className="carnet-back-section">
                                        <div className="carnet-back-section-title">Membresía</div>
                                        {membresia ? (
                                            <>
                                                <div className="carnet-back-row">
                                                    <span className="carnet-back-label">Estado</span>
                                                    <span className="carnet-status-badge activa">Activa</span>
                                                </div>
                                                <div className="carnet-back-row">
                                                    <span className="carnet-back-label">Plan</span>
                                                    <span className="carnet-back-value">{planNombre}</span>
                                                </div>
                                                <div className="carnet-back-row">
                                                    <span className="carnet-back-label">Vence</span>
                                                    <span className="carnet-back-value">{formatDate(fechaVenc)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="carnet-back-row">
                                                <span className="carnet-back-label">Estado</span>
                                                <span className="carnet-status-badge inactiva">Sin membresía</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="carnet-back-footer">
                                        Presentar este carnet para acceso al gimnasio
                                    </div>
                                    <div className="carnet-back-bottom-stripe" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="carnet-modal-footer">
                        <button className="carnet-btn-pdf" onClick={exportAsPDF} disabled={exporting}>
                            <FileText size={16} />
                            {exporting ? 'Exportando…' : 'Descargar PDF'}
                        </button>
                        <button className="carnet-btn-img" onClick={exportAsImage} disabled={exporting}>
                            <Image size={16} />
                            {exporting ? 'Exportando…' : 'Descargar IMG'}
                        </button>
                        <button className="carnet-btn-close" onClick={onClose}>
                            <X size={16} />
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CarnetCliente
