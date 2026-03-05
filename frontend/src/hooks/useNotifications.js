import { useState, useEffect, useCallback, useRef } from 'react'
import { alertsAPI } from '../services/api'
import toast from 'react-hot-toast'

/**
 * Custom hook for managing notifications/alerts
 * Badge count = unread notifications only (decreases when clicked)
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  // Fetch notifications and set unread count
  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const response = await alertsAPI.getActivityFeed({ limit: 30 })
      const data = response.data
      const items = data.actividad || []
      setNotifications(items)

      // Badge = ONLY unread notifications (so it decreases on click)
      setUnreadCount(data.no_leidas || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Lightweight unread count refresh
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await alertsAPI.getUnreadCount()
      setUnreadCount(response.data.no_leidas || 0)
    } catch (err) {
      // Silent fail
    }
  }, [])

  // Mark notification as read → badge decreases
  const markAsRead = async (id) => {
    try {
      await alertsAPI.markAsRead(id)
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, leida: 1 } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      toast.error('Error al marcar como leída')
    }
  }

  // Mark all as read → badge goes to 0
  const markAllAsRead = async () => {
    try {
      await alertsAPI.markAllAsRead()
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, leida: 1 }))
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

  // Auto-refresh every 60 seconds
  useEffect(() => {
    intervalRef.current = setInterval(fetchUnreadCount, 60000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  }
}

