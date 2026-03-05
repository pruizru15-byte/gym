import { useState, useEffect } from 'react'
import { Wifi, Globe, QrCode, Copy, Server, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const NetworkSettings = () => {
    const [networkInfo, setNetworkInfo] = useState({
        ip: '...',
        port: '3000',
        url: '...',
    })
    const [showQR, setShowQR] = useState(false)

    useEffect(() => {
        // Get network info from the current browser location
        const hostname = window.location.hostname || 'localhost'
        const port = window.location.port || '3000'
        const protocol = window.location.protocol
        const url = `${protocol}//${hostname}:${port}`

        setNetworkInfo({
            ip: hostname,
            port: port,
            url: url,
        })
    }, [])

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        toast.success('Copiado al portapapeles')
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(networkInfo.url)}`

    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                    <Wifi className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Configuración de Red</h3>
                    <p className="text-sm text-gray-500">Información de red y acceso al sistema</p>
                </div>
            </div>

            {/* Network info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-500" />
                    Información del Servidor
                </h4>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 dark:border-gray-700">
                        <div>
                            <p className="text-xs text-gray-500">IP del Servidor</p>
                            <p className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 dark:text-gray-200">{networkInfo.ip}</p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(networkInfo.ip)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
                            title="Copiar"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 dark:border-gray-700">
                        <div>
                            <p className="text-xs text-gray-500">Puerto</p>
                            <p className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 dark:text-gray-200">{networkInfo.port}</p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(networkInfo.port)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
                            title="Copiar"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                            <p className="text-xs text-blue-600">URL de Acceso</p>
                            <p className="text-sm font-mono font-bold text-blue-800">{networkInfo.url}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => copyToClipboard(networkInfo.url)}
                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Copiar"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            <a
                                href={networkInfo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Abrir"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Access */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-purple-500" />
                    Código QR de Acceso
                </h4>
                <p className="text-xs text-gray-500">
                    Escanea este código QR desde un dispositivo móvil en la misma red para acceder al sistema.
                </p>

                {!showQR ? (
                    <button
                        onClick={() => setShowQR(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
                    >
                        <QrCode className="w-4 h-4" />
                        Generar Código QR
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                        <img
                            src={qrUrl}
                            alt="QR Code de acceso"
                            className="w-48 h-48 rounded-lg shadow-sm"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-mono">{networkInfo.url}</p>
                        <button
                            onClick={() => setShowQR(false)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            Ocultar QR
                        </button>
                    </div>
                )}
            </div>

            {/* Connection info */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex gap-3">
                    <Globe className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">Acceso en Red Local</p>
                        <p className="text-xs text-amber-700 mt-1">
                            Para que otros dispositivos puedan acceder, asegúrate de que estén conectados a la misma red WiFi
                            y que el firewall permita conexiones en el puerto {networkInfo.port}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NetworkSettings
