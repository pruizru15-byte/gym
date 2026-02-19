import { useState, useEffect, useCallback } from 'react'
import { alertsAPI } from '../services/api'
import toast from 'react-hot-toast'

/**
 * Custom hook for managing notifications/alerts
 * Provides methods to fetch, mark as read, and manage alerts
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const response = await alertsAPI.getAll(params)
      const alerts = response.data.notificaciones || response.data.alertas || response.data || []
      setNotifications(alerts)

      // Count unread notifications
      const unread = alerts.filter(alert => !alert.leida).length
      setUnreadCount(unread)
    } catch (err) {
      setError(err.message)
      toast.error('Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await alertsAPI.markAsRead(id)

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, leida: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      toast.error('Error al marcar como leída')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await alertsAPI.markAllAsRead()

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, leida: true }))
      )
      setUnreadCount(0)
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch (err) {
      toast.error('Error al marcar todas como leídas')
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
