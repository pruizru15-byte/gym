import { useState, useEffect } from 'react'
import { productsAPI, salesAPI } from '../../services/api'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  CreditCard,
  Banknote,
  Wallet,
  Printer,
  X,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * PuntoVenta - Complete point of sale interface with cart and payments
 */
const PuntoVenta = () => {
  const [productos, setProductos] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [amountReceived, setAmountReceived] = useState('')

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const response = await productsAPI.getAll()
      // Only show products with stock
      setProductos(response.data.filter(p => p.cantidad > 0))
    } catch (error) {
      toast.error('Error al cargar productos')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter products by search term
  const filteredProductos = productos.filter((producto) =>
    producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add product to cart
  const addToCart = (producto) => {
    const existingItem = cart.find(item => item.id === producto.id)
    
    if (existingItem) {
      // Check stock before increasing quantity
      if (existingItem.cantidad >= producto.cantidad) {
        toast.error('No hay suficiente stock')
        return
      }
      setCart(cart.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...producto, cantidad: 1 }])
    }
    toast.success('Producto agregado al carrito')
  }

  // Update item quantity in cart
  const updateQuantity = (id, newQuantity) => {
    const producto = productos.find(p => p.id === id)
    
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }

    if (newQuantity > producto.cantidad) {
      toast.error('No hay suficiente stock')
      return
    }

    setCart(cart.map(item =>
      item.id === id ? { ...item, cantidad: newQuantity } : item
    ))
  }

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  // Clear entire cart
  const clearCart = () => {
    if (cart.length > 0 && window.confirm('¿Deseas vaciar el carrito?')) {
      setCart([])
    }
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
  const tax = subtotal * 0.16 // 16% IVA
  const total = subtotal + tax

  // Handle payment
  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    // Validate payment for cash
    if (paymentMethod === 'efectivo') {
      const received = parseFloat(amountReceived)
      if (!received || received < total) {
        toast.error('El monto recibido es insuficiente')
        return
      }
    }

    try {
      setLoading(true)

      // Prepare sale data
      const saleData = {
        items: cart.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          subtotal: item.precio * item.cantidad
        })),
        metodo_pago: paymentMethod,
        subtotal,
        impuestos: tax,
        total,
        efectivo_recibido: paymentMethod === 'efectivo' ? parseFloat(amountReceived) : null,
      }

      const response = await salesAPI.create(saleData)
      
      toast.success('Venta registrada exitosamente')
      
      // Print receipt (optional)
      printReceipt(response.data)
      
      // Reset
      setCart([])
      setShowPaymentModal(false)
      setAmountReceived('')
      fetchProductos() // Refresh product stock
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la venta')
      console.error('Error processing sale:', error)
    } finally {
      setLoading(false)
    }
  }

  // Print receipt
  const printReceipt = (sale) => {
    const receiptWindow = window.open('', '_blank')
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo de Venta</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
          h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .totals { border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px; }
          .total { font-weight: bold; font-size: 18px; }
          .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>GYMPRO</h1>
        <div class="header">
          <p>Fecha: ${new Date(sale.fecha).toLocaleString()}</p>
          <p>Folio: ${sale.id}</p>
          <p>Método de Pago: ${sale.metodo_pago.toUpperCase()}</p>
        </div>
        
        <div class="items">
          ${sale.items.map(item => `
            <div class="item">
              <span>${item.cantidad}x ${item.producto?.nombre || 'Producto'}</span>
              <span>$${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="item">
            <span>Subtotal:</span>
            <span>$${Number(sale.subtotal).toFixed(2)}</span>
          </div>
          <div class="item">
            <span>IVA (16%):</span>
            <span>$${Number(sale.impuestos).toFixed(2)}</span>
          </div>
          <div class="item total">
            <span>TOTAL:</span>
            <span>$${Number(sale.total).toFixed(2)}</span>
          </div>
          ${sale.efectivo_recibido ? `
            <div class="item">
              <span>Efectivo Recibido:</span>
              <span>$${Number(sale.efectivo_recibido).toFixed(2)}</span>
            </div>
            <div class="item">
              <span>Cambio:</span>
              <span>$${(Number(sale.efectivo_recibido) - Number(sale.total)).toFixed(2)}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>www.gympro.com</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `
    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
  }

  const change = amountReceived ? parseFloat(amountReceived) - total : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4 overflow-hidden flex flex-col">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredProductos.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProductos.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => addToCart(producto)}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="aspect-square bg-white rounded-lg mb-2 overflow-hidden">
                    {producto.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                    {producto.nombre}
                  </h3>
                  <p className="text-lg font-bold text-primary-600">
                    ${Number(producto.precio).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {producto.cantidad}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="lg:col-span-1 space-y-4 flex flex-col overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrito ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="space-y-3 max-h-[40vh] overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">El carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm text-gray-900 flex-1 pr-2">
                      {item.nombre}
                    </h3>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-primary-600">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals and Checkout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (16%):</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-primary-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
          >
            <CreditCard className="w-5 h-5" />
            Procesar Pago
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Procesar Pago</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-1">Total a Pagar</p>
                  <p className="text-3xl font-bold text-primary-600">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'efectivo'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-xs font-medium">Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'tarjeta'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-medium">Tarjeta</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'transferencia'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Wallet className="w-6 h-6" />
                  <span className="text-xs font-medium">Transfer.</span>
                </button>
              </div>

              {/* Cash payment fields */}
              {paymentMethod === 'efectivo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Efectivo Recibido
                  </label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    min={total}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                    placeholder="0.00"
                  />
                  {amountReceived && change >= 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800 font-medium">Cambio:</span>
                        <span className="text-2xl font-bold text-green-700">
                          ${change.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    Confirmar y Imprimir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PuntoVenta
