import { createContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser))
          // Optionally verify token with backend
          // const response = await authAPI.getCurrentUser()
          // setUser(response.data)
        } catch (error) {
          console.error('Error initializing auth:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      toast.success(`¡Bienvenido, ${user.nombre}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Error al iniciar sesión'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      toast.success('Sesión cerrada correctamente')
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
