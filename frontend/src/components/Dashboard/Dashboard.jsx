import { useState, useEffect } from 'react'
import { dashboardAPI } from '../../services/api'
import { Users, CreditCard, TrendingUp, Calendar } from 'lucide-react'
import MetricCard from './MetricCard'
import AlertasWidget from './AlertasWidget'
import IngresoChart from './IngresoChart'
import toast from 'react-hot-toast'

/**
 * Main dashboard component
 * Displays key metrics, alerts, and charts
 */
const Dashboard = () => {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getMetrics()
      const data = response.data

      // Map backend nested structure to frontend flat structure
      setMetrics({
        miembros_activos: data.clientes?.activos || 0,
        membresias_activas: data.clientes?.con_membresia || 0,
        ingresos_mes: data.ventas?.ingresos_mes || 0,
        asistencias_hoy: data.clientes?.asistencias_hoy || 0,
        // Trends are not currently returned by this endpoint
        tendencia_miembros: 0,
        tendencia_ingresos: 0,
        tendencia_asistencias: 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Default metrics if API doesn't return data
  const defaultMetrics = {
    miembros_activos: 0,
    membresias_activas: 0,
    ingresos_mes: 0,
    asistencias_hoy: 0,
    tendencia_miembros: 0,
    tendencia_ingresos: 0,
    tendencia_asistencias: 0
  }

  const data = metrics || defaultMetrics

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Resumen general del gimnasio
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Miembros Activos"
          value={data.miembros_activos || 0}
          icon={Users}
          trend={data.tendencia_miembros}
          color="blue"
        />

        <MetricCard
          title="Membresías Activas"
          value={data.membresias_activas || 0}
          icon={CreditCard}
          trend={data.tendencia_membresias}
          color="green"
        />

        <MetricCard
          title="Ingresos del Mes"
          value={data.ingresos_mes || 0}
          icon={TrendingUp}
          trend={data.tendencia_ingresos}
          color="purple"
          format="currency"
        />

        <MetricCard
          title="Asistencias Hoy"
          value={data.asistencias_hoy || 0}
          icon={Calendar}
          trend={data.tendencia_asistencias}
          color="orange"
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income chart - takes 2 columns */}
        <div className="lg:col-span-2">
          <IngresoChart />
        </div>

        {/* Alerts widget - takes 1 column */}
        <div>
          <AlertasWidget />
        </div>
      </div>

      {/* Recent activity section (placeholder for future) */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Reciente
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>No hay actividad reciente para mostrar</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
