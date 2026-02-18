import { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

/**
 * Income chart component
 * Displays income trend over the last 6 months
 */
const IngresoChart = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6m') // 6 months, 3 months, 1 month

  useEffect(() => {
    fetchIncomeData()
  }, [period])

  const fetchIncomeData = async () => {
    setLoading(true)
    try {
      // Calculate date range based on period
      const endDate = new Date()
      const startDate = new Date()
      
      switch (period) {
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3)
          break
        case '6m':
        default:
          startDate.setMonth(startDate.getMonth() - 6)
          break
      }

      const response = await reportsAPI.getIncome({
        fecha_inicio: startDate.toISOString().split('T')[0],
        fecha_fin: endDate.toISOString().split('T')[0],
        agrupar_por: 'mes'
      })

      // Transform data for chart
      const chartData = response.data.map(item => ({
        mes: item.mes || item.periodo,
        ingresos: parseFloat(item.total_ingresos || item.total || 0)
      }))

      setData(chartData)
    } catch (error) {
      console.error('Error fetching income data:', error)
      toast.error('Error al cargar datos de ingresos')
      
      // Set dummy data for demo
      setData(generateDummyData(period))
    } finally {
      setLoading(false)
    }
  }

  // Generate dummy data for demo purposes
  const generateDummyData = (period) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const count = period === '1m' ? 4 : period === '3m' ? 3 : 6
    const currentMonth = new Date().getMonth()
    
    return Array.from({ length: count }, (_, i) => {
      const monthIndex = (currentMonth - count + i + 1 + 12) % 12
      return {
        mes: months[monthIndex],
        ingresos: Math.floor(Math.random() * 50000) + 30000
      }
    })
  }

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload.mes}
          </p>
          <p className="text-lg font-bold text-primary-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Ingresos
        </h2>
        
        {/* Period selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('1m')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              period === '1m'
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            1M
          </button>
          <button
            onClick={() => setPeriod('3m')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              period === '3m'
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            3M
          </button>
          <button
            onClick={() => setPeriod('6m')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              period === '6m'
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            6M
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="mes" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="ingresos" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default IngresoChart
