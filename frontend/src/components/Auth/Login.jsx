import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Dumbbell, LogIn, Eye, EyeOff } from 'lucide-react'

/**
 * Login page component
 * Handles user authentication
 */
const Login = () => {
  const navigate = useNavigate()
  const { login, user } = useAuth()

  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard')
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'El usuario o email es requerido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // Map identifier to username for backend (backend checks both columns)
      const payload = {
        username: formData.identifier,
        password: formData.password
      }
      const result = await login(payload)

      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GymPro</h1>
          <p className="text-gray-600">Sistema de Gestión de Gimnasio</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identifier field */}
            <div>
              <label htmlFor="identifier" className="label">
                Usuario o Email
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                className={`input ${errors.identifier ? 'border-red-500' : ''}`}
                placeholder="usuario o tu@email.com"
                autoComplete="username"
                disabled={loading}
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Demo credentials info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <strong>Demo:</strong> admin@gym.com / admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 GymPro. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default Login
