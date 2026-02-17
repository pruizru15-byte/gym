import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Dumbbell,
  LogIn,
  AlertCircle
} from 'lucide-react'

/**
 * Navigation sidebar component
 * Displays navigation links and collapses/expands based on state
 */
const Sidebar = ({ isOpen, onToggle }) => {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/check-in', icon: LogIn, label: 'Check-in' },
    { path: '/membresias', icon: CreditCard, label: 'Membresías' },
    { path: '/membresias/vencimientos', icon: AlertCircle, label: 'Vencimientos' },
    { path: '/asistencias', icon: Calendar, label: 'Asistencias' },
    { path: '/pagos', icon: DollarSign, label: 'Pagos' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
    { path: '/configuracion', icon: Settings, label: 'Configuración' },
  ]

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          bg-white border-r border-gray-200 flex flex-col transition-all duration-300
          ${isOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-primary-600" />
            {isOpen && (
              <span className="font-bold text-xl text-gray-900">GymPro</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
          >
            <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              ←
            </span>
            {isOpen && <span className="text-sm">Contraer</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
