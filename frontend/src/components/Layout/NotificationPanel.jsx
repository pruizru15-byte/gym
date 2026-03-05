import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Bell, BellOff, ChevronRight, CheckCheck, Clock,
    Users, CreditCard, Package, Wrench, AlertTriangle,
    UserPlus, ShoppingCart, Activity, Settings, LogIn, Trash2
} from 'lucide-react'
import { alertsAPI } from '../../services/api'
import './NotificationPanel.css'

/**
 * Get icon component based on notification type
 */
const getNotifIcon = (tipo, referenciaTipo) => {
    if (tipo?.startsWith('audit_')) {
        const action = tipo.replace('audit_', '')
        switch (action) {
            case 'create': return <UserPlus />
            case 'update': return <Settings />
            case 'delete': return <Trash2 />
            case 'login': return <LogIn />
            case 'logout': return <LogIn />
            default: return <Activity />
        }
    }

    switch (tipo) {
        case 'membresia_vence': return <CreditCard />
        case 'stock_bajo': return <Package />
        case 'producto_vence': return <Package />
        case 'mantenimiento_maquina': return <Wrench />
        case 'cliente_inactivo': return <Users />
        default: return <Bell />
    }
}

/**
 * Format relative time in Spanish
 */
const formatRelativeTime = (dateStr) => {
    if (!dateStr) return ''
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin}m`
    if (diffHrs < 24) return `Hace ${diffHrs}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

/**
 * NotificationPanel — Dropdown with notifications that update the bell badge
 * Props:
 *   onClose - closes the panel
 *   onMarkAsRead - marks a notification as read (updates Header badge)
 *   onMarkAllAsRead - marks all as read (badge → 0)
 */
const NotificationPanel = ({ onClose, onMarkAsRead, onMarkAllAsRead }) => {
    const navigate = useNavigate()
    const [feed, setFeed] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('todas')

    // Fetch activity feed + trigger auto-generation
    const fetchFeed = useCallback(async () => {
        setLoading(true)
        try {
            // First, trigger auto-generation of notifications
            try {
                await alertsAPI.generateAutomatic?.()
            } catch (e) {
                // If method doesn't exist, silently skip
            }

            const response = await alertsAPI.getActivityFeed({ limit: 30 })
            setFeed(response.data.actividad || [])
        } catch (err) {
            console.error('Error fetching activity feed:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchFeed()
    }, [fetchFeed])

    // Mark all as read → badge goes to 0
    const handleMarkAllRead = async (e) => {
        e.stopPropagation()
        try {
            if (onMarkAllAsRead) {
                await onMarkAllAsRead()
            }
            setFeed(prev => prev.map(item => ({ ...item, leida: 1 })))
        } catch (err) {
            console.error('Error marking all as read:', err)
        }
    }

    // Click on item → mark as read (badge decreases) + navigate
    const handleItemClick = async (item) => {
        // Only mark notification items as read (not audit logs)
        if (item.source === 'notification' && !item.leida) {
            try {
                if (onMarkAsRead) {
                    await onMarkAsRead(item.id)
                }
                // Update local state
                setFeed(prev =>
                    prev.map(f => f.id === item.id ? { ...f, leida: 1 } : f)
                )
            } catch (err) {
                console.error('Error marking as read:', err)
            }
        }
        // Navigate to link
        if (item.link) {
            navigate(item.link)
        }
        onClose()
    }

    // Filter feed based on active tab
    const filteredFeed = feed.filter(item => {
        if (activeTab === 'notificaciones') return item.source === 'notification'
        if (activeTab === 'actividad') return item.source === 'audit'
        return true
    })

    const unreadCount = feed.filter(item => item.source === 'notification' && !item.leida).length

    // Get icon class
    const getIconClass = (item) => {
        if (item.source === 'audit') return 'notif-icon type-audit'
        return `notif-icon priority-${item.prioridad || 'media'}`
    }

    return (
        <>
            {/* Backdrop */}
            <div className="notif-backdrop" onClick={onClose} />

            {/* Panel */}
            <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="notif-header">
                    <div className="notif-header-left">
                        <h3>Notificaciones</h3>
                        {unreadCount > 0 && (
                            <span className="notif-badge-count">{unreadCount}</span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>
                            <CheckCheck style={{ width: 14, height: 14, marginRight: 4, verticalAlign: 'middle' }} />
                            Marcar leídas
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="notif-tabs">
                    <button
                        className={`notif-tab ${activeTab === 'todas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('todas')}
                    >
                        Todas
                    </button>
                    <button
                        className={`notif-tab ${activeTab === 'notificaciones' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notificaciones')}
                    >
                        Alertas
                    </button>
                    <button
                        className={`notif-tab ${activeTab === 'actividad' ? 'active' : ''}`}
                        onClick={() => setActiveTab('actividad')}
                    >
                        Actividad
                    </button>
                </div>

                {/* List */}
                <div className="notif-list">
                    {loading ? (
                        <div className="notif-loading">
                            <div className="notif-spinner" />
                        </div>
                    ) : filteredFeed.length === 0 ? (
                        <div className="notif-empty">
                            <div className="notif-empty-icon">
                                <BellOff />
                            </div>
                            <h4>Sin notificaciones</h4>
                            <p>Las acciones recientes aparecerán aquí</p>
                        </div>
                    ) : (
                        filteredFeed.map((item, index) => (
                            <div
                                key={item.id || index}
                                className={`notif-item ${(item.source === 'notification' && !item.leida) ? 'unread' : ''}`}
                                onClick={() => handleItemClick(item)}
                            >
                                <div className={getIconClass(item)}>
                                    {getNotifIcon(item.tipo, item.referencia_tipo)}
                                </div>

                                <div className="notif-content">
                                    <p className="notif-title">{item.titulo}</p>
                                    <p className="notif-message">{item.mensaje}</p>
                                </div>

                                <div className="notif-meta">
                                    <span className="notif-time">
                                        {formatRelativeTime(item.fecha_creacion)}
                                    </span>
                                    <ChevronRight className="notif-arrow" size={14} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {filteredFeed.length > 0 && (
                    <div className="notif-footer">
                        <button className="notif-footer-btn" onClick={() => { navigate('/dashboard'); onClose(); }}>
                            Ver panel completo
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default NotificationPanel
