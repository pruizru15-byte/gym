import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

/**
 * Reusable metric card component
 * Displays a single metric with icon, value, and trend
 */
const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue',
  format = 'number'
}) => {
  // Color variants
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  }

  // Format the value based on format type
  const formattedValue = format === 'currency' 
    ? formatCurrency(value) 
    : formatNumber(value)

  // Determine trend direction and color
  const isPositive = trend >= 0
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {formattedValue}
          </p>
          
          {/* Trend indicator */}
          {trend !== undefined && trend !== null && (
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-500">
                vs mes anterior
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default MetricCard
