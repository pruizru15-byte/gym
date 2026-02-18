import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout/Layout'
import Login from './components/Auth/Login'
import Dashboard from './components/Dashboard/Dashboard'

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
                <Route path="/clientes" element={<ClientesList />} />
                <Route path="/clientes/nuevo" element={<ClienteForm />} />
                <Route path="/clientes/:id" element={<ClienteDetalle />} />
                <Route path="/clientes/:id/editar" element={<ClienteForm />} />
                <Route path="/check-in" element={<CheckIn />} />
                
                {/* Membership Routes */}
                <Route path="/membresias" element={<MembresiasList />} />
                <Route path="/membresias/nuevo" element={<MembresiaForm />} />
                <Route path="/membresias/editar/:id" element={<MembresiaForm />} />
                <Route path="/membresias/renovar/:id" element={<RenovarMembresia />} />
                <Route path="/membresias/nueva/:id" element={<RenovarMembresia />} />
                <Route path="/membresias/vencimientos" element={<VencimientosProximos />} />
                
                {/* Store/POS Routes */}
                <Route path="/tienda/productos" element={<ProductosList />} />
                <Route path="/tienda/productos/nuevo" element={<ProductoForm />} />
                <Route path="/tienda/productos/:id/editar" element={<ProductoForm />} />
                <Route path="/tienda/punto-venta" element={<PuntoVenta />} />
                <Route path="/tienda/alertas" element={<AlertasInventario />} />
                
                {/* Machines Routes */}
                <Route path="/maquinas" element={<MaquinasList />} />
                <Route path="/maquinas/nueva" element={<MaquinaForm />} />
                <Route path="/maquinas/:id" element={<MaquinaDetalle />} />
                <Route path="/maquinas/:id/editar" element={<MaquinaForm />} />
                
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
