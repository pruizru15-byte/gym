import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout/Layout'
import Login from './components/Auth/Login'
import ForgotPassword from './components/Auth/ForgotPassword'
import Dashboard from './components/Dashboard/Dashboard'
import PermissionGuard from './components/Auth/PermissionGuard'
import { PERMISSIONS } from './hooks/usePermissions'

// Client components
import ClientesList from './components/Clientes/ClientesList'
import ClienteForm from './components/Clientes/ClienteForm'
import ClienteDetalle from './components/Clientes/ClienteDetalle'
import CheckIn from './components/Clientes/CheckIn'

// Membership components
import MembresiasList from './components/Membresias/MembresiasList'
import MembresiaForm from './components/Membresias/MembresiaForm'
import RenovarMembresia from './components/Membresias/RenovarMembresia'
import VencimientosProximos from './components/Membresias/VencimientosProximos'

// Store/POS components
import ProductosList from './components/Tienda/ProductosList'
import ProductoForm from './components/Tienda/ProductoForm'
import PuntoVenta from './components/Tienda/PuntoVenta'
import AlertasInventario from './components/Tienda/AlertasInventario'

// Machines components
import MaquinasList from './components/Maquinas/MaquinasList'
import MaquinaForm from './components/Maquinas/MaquinaForm'
import MaquinaDetalle from './components/Maquinas/MaquinaDetalle'

// Settings
import UserProfile from './components/Profile/UserProfile'
import Settings from './components/Settings/Settings'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Dashboard */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Clients Routes */}
                <Route path="/clientes" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_VIEW_CLIENTS}>
                    <ClientesList />
                  </PermissionGuard>
                } />
                <Route path="/clientes/nuevo" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_CLIENTS}>
                    <ClienteForm />
                  </PermissionGuard>
                } />
                <Route path="/clientes/:id" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_VIEW_CLIENTS}>
                    <ClienteDetalle />
                  </PermissionGuard>
                } />
                <Route path="/clientes/:id/editar" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_CLIENTS}>
                    <ClienteForm />
                  </PermissionGuard>
                } />
                <Route path="/check-in" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_CHECK_IN}>
                    <CheckIn />
                  </PermissionGuard>
                } />

                {/* Membership Routes */}
                <Route path="/membresias" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_VIEW_CLIENTS}>
                    <MembresiasList />
                  </PermissionGuard>
                } />
                <Route path="/membresias/nuevo" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_CONFIGURE_SYSTEM}>
                    <MembresiaForm />
                  </PermissionGuard>
                } />
                <Route path="/membresias/editar/:id" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_CONFIGURE_SYSTEM}>
                    <MembresiaForm />
                  </PermissionGuard>
                } />
                <Route path="/membresias/renovar/:id" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_RENEW_MEMBERSHIP}>
                    <RenovarMembresia />
                  </PermissionGuard>
                } />
                <Route path="/membresias/Vencimientos" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_RENEW_MEMBERSHIP}>
                    <VencimientosProximos />
                  </PermissionGuard>
                } />

                {/* Store/POS Routes */}
                <Route path="/tienda/productos" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_INVENTORY}>
                    <ProductosList />
                  </PermissionGuard>
                } />
                <Route path="/tienda/productos/nuevo" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_INVENTORY}>
                    <ProductoForm />
                  </PermissionGuard>
                } />
                <Route path="/tienda/productos/:id/editar" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_INVENTORY}>
                    <ProductoForm />
                  </PermissionGuard>
                } />
                <Route path="/tienda/punto-venta" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_POS}>
                    <PuntoVenta />
                  </PermissionGuard>
                } />
                <Route path="/tienda/alertas" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_INVENTORY}>
                    <AlertasInventario />
                  </PermissionGuard>
                } />

                {/* Machines Routes */}
                <Route path="/maquinas" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_MACHINES}>
                    <MaquinasList />
                  </PermissionGuard>
                } />
                <Route path="/maquinas/nueva" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_MACHINES}>
                    <MaquinaForm />
                  </PermissionGuard>
                } />
                <Route path="/maquinas/:id" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_MACHINES}>
                    <MaquinaDetalle />
                  </PermissionGuard>
                } />
                <Route path="/maquinas/:id/editar" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_MACHINES}>
                    <MaquinaForm />
                  </PermissionGuard>
                } />

                {/* User Profile */}
                <Route path="/perfil" element={
                  <PermissionGuard>
                    <UserProfile />
                  </PermissionGuard>
                } />

                {/* Config Routes */}
                <Route path="/configuracion/*" element={
                  <PermissionGuard permission={PERMISSIONS.CAN_MANAGE_USERS}>
                    <Settings />
                  </PermissionGuard>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
