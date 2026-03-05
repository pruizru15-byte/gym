import { useState, useEffect, useRef } from 'react'
import { productsAPI, salesAPI, membersAPI, configuracionAPI } from '../../services/api'
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
  User,
  DollarSign,
  Package,
  Tag
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getCurrencySymbol } from '../../utils/currencyConfig'

/** Format a number for POS display using the configured currency symbol */
const fmtPOS = (val) => `${getCurrencySymbol()}${Number(val).toFixed(2)}`

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
  const [numCuotas, setNumCuotas] = useState(1)
  const [taxRate, setTaxRate] = useState(0.18) // Default 18% IGV Perú

  // Category filter state
  const [categorias, setCategorias] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('todas')

  // Client selection state
  const [clientes, setClientes] = useState([])
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const clientDropdownRef = useRef(null)

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'cuotas') {
      setAmountReceived((total / 2).toFixed(2));
    } else {
      setAmountReceived('');
    }
  }

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const response = await productsAPI.getAll({ limit: 200, activo: 'true' })
      const data = response.data
      // Backend returns { productos: [...], pagination: {...} }
      const lista = Array.isArray(data) ? data : (data.productos || [])
      // Only show products with stock
      setProductos(lista.filter(p => (p.stock_actual || 0) > 0))
    } catch (error) {
      toast.error('Error al cargar productos')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await membersAPI.getAll({ limit: 500, activo: 'true' })
      const data = response.data
      // Backend returns { clientes: [...], pagination: {...} }
      const lista = Array.isArray(data) ? data : (data.clientes || [])
      setClientes(lista)
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await productsAPI.getCategories()
      setCategorias(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchProductos()
    fetchClientes()
    fetchCategorias()
    fetchTaxRate()
  }, [])

  const fetchTaxRate = async () => {
    try {
      const res = await configuracionAPI.getAll()
      const cfg = res.data
      const rate = parseFloat(cfg.impuesto_ventas?.valor || '18')
      setTaxRate(rate / 100)
    } catch (error) {
      console.error('Error fetching tax rate:', error)
      // Keep default 18%
    }
  }

  // Close client dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) {
        setIsClientDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter products by search term and category
  const filteredProductos = productos.filter((producto) => {
    const matchesSearch = !searchTerm ||
      producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'todas' ||
      producto.categoria?.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  // Add product to cart
  const addToCart = (producto) => {
    const existingItem = cart.find(item => item.id === producto.id)
    const stockDisponible = producto.stock_actual || 0

    if (existingItem) {
      if (existingItem.cantidad >= stockDisponible) {
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

    if (newQuantity > (producto?.stock_actual || 0)) {
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

  // Helper to get item price (backend may use precio_venta or precio)
  const getItemPrice = (item) => Number(item.precio_venta || item.precio || 0)

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (getItemPrice(item) * item.cantidad), 0)
  const tax = subtotal * taxRate
  const total = subtotal + tax
  const change = amountReceived && paymentMethod !== 'cuotas' ? parseFloat(amountReceived) - total : 0

  // Handle payment
  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    const isCuotasPlan = paymentMethod === 'cuotas';

    // Validate payment for cash and cuotas (initial payment)
    if (paymentMethod === 'efectivo' || isCuotasPlan) {
      const received = parseFloat(amountReceived)

      if (isCuotasPlan) {
        if (!selectedClient) {
          toast.error('Debe seleccionar un cliente para pago en cuotas')
          return
        }
        if (!numCuotas || numCuotas < 1) {
          toast.error('Debe ingresar un número válido de cuotas')
          return
        }
        if (amountReceived !== '' && (isNaN(received) || received < 0)) {
          toast.error('Monto inicial inválido')
          return
        }
      } else {
        if (!received || received < total) {
          toast.error('El monto recibido es insuficiente')
          return
        }
      }
    }

    try {
      setLoading(true)

      // Prepare sale data
      const saleData = {
        cliente_id: selectedClient ? selectedClient.id : null,
        productos: cart.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: getItemPrice(item),
          subtotal: getItemPrice(item) * item.cantidad
        })),
        metodo_pago: isCuotasPlan ? 'CREDITO' : paymentMethod,
        monto_recibido: amountReceived !== '' ? parseFloat(amountReceived) : (isCuotasPlan ? undefined : total),
        es_cuotas: isCuotasPlan,
        num_cuotas: isCuotasPlan ? parseInt(numCuotas) : 1,
        notas: ''
      }

      const response = await salesAPI.create(saleData)

      toast.success('Venta registrada exitosamente')

      // Print receipt (optional)
      printReceipt(response.data)

      // Reset
      setCart([])
      setShowPaymentModal(false)
      setAmountReceived('')
      setNumCuotas(1)
      setSelectedClient(null)
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

    // Preparar el bloque del cliente
    let clientHTML = '';
    if (sale.cliente_nombre) {
      clientHTML = `
            <div class="client-info" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
                <p style="margin: 2px 0;"><strong>Cliente:</strong> ${sale.cliente_nombre} ${sale.cliente_apellido}</p>
                ${sale.cliente_codigo ? `<p style="margin: 2px 0;"><strong>Código:</strong> ${sale.cliente_codigo}</p>` : ''}
            </div>
        `;
    }

    const isPending = sale.estado_pago === 'pendiente';

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
          <p>Fecha: ${new Date(sale.fecha_hora).toLocaleString()}</p>
          <p>Folio: ${sale.id}</p>
          <p>Método de Pago: ${sale.metodo_pago.toUpperCase()}</p>
        </div>
        
        ${clientHTML}

        <div class="items">
          ${sale.detalles ? sale.detalles.map(item => `
            <div class="item">
              <span>${item.cantidad}x ${item.producto_nombre || 'Producto'}</span>
              <span>${getCurrencySymbol()}${Number(item.subtotal).toFixed(2)}</span>
            </div>
          `).join('') : ''}
        </div>
        
        <div class="totals">
          <div class="item total">
            <span>TOTAL:</span>
            <span>${getCurrencySymbol()}${Number(sale.total).toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Pagado:</span>
            <span>${getCurrencySymbol()}${Number(sale.monto_pagado).toFixed(2)}</span>
          </div>
          ${isPending ? `
             <div class="item" style="color: red;">
               <span>Por Pagar:</span>
               <span>${getCurrencySymbol()}${(Number(sale.total) - Number(sale.monto_pagado)).toFixed(2)}</span>
             </div>
          ` : ''}
          ${sale.monto_recibido && sale.monto_recibido > sale.total ? `
            <div class="item">
              <span>Efectivo Recibido:</span>
              <span>${getCurrencySymbol()}${Number(sale.monto_recibido).toFixed(2)}</span>
            </div>
            <div class="item">
              <span>Cambio:</span>
              <span>${getCurrencySymbol()}${(Number(sale.monto_recibido) - Number(sale.total)).toFixed(2)}</span>
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4 overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter Chips */}
          {categorias.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setSelectedCategory('todas')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${selectedCategory === 'todas'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
              >
                <Package className="w-3 h-3" />
                Todas
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.nombre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${selectedCategory === cat.nombre
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                >
                  <Tag className="w-3 h-3" />
                  {cat.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredProductos.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron productos</p>
              {(searchTerm || selectedCategory !== 'todas') && (
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('todas'); }}
                  className="mt-2 text-primary-600 dark:text-primary-400 hover:underline text-sm"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProductos.map((producto) => {
                const stock = producto.stock_actual || 0
                const stockMin = producto.stock_minimo || 5
                const stockOk = stock > stockMin * 2
                const stockLow = stock <= stockMin
                const precio = Number(producto.precio_venta || producto.precio || 0)
                return (
                  <button
                    key={producto.id}
                    onClick={() => addToCart(producto)}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:shadow-lg transition-all duration-200 text-left group overflow-hidden flex flex-col"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                  >
                    {/* Imagen */}
                    <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-300 group-hover:text-primary-400 transition-colors" />
                        </div>
                      )}
                      {/* Overlay botón agregar */}
                      <div className="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Agregar
                        </span>
                      </div>
                      {/* Badge categoría */}
                      {producto.categoria && (
                        <span className="absolute top-2 left-2 bg-white dark:bg-gray-800 bg-opacity-90 text-gray-600 dark:text-gray-400 text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 truncate max-w-[80%]">
                          {producto.categoria}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 flex flex-col gap-1.5 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight line-clamp-2" title={producto.nombre}>
                        {producto.nombre}
                      </h3>

                      {/* Precio */}
                      <p className="text-base font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">
                        {fmtPOS(precio)}
                      </p>

                      {/* Stock indicator */}
                      <div className="flex items-center gap-1.5 mt-auto">
                        <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${stockOk ? 'bg-green-500' : stockLow ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <span className={`text-[10px] font-medium ${stockOk ? 'text-green-600' : stockLow ? 'text-red-500 font-bold' : 'text-yellow-600'}`}>
                          {stockLow ? `¡Solo ${stock}!` : `Stock: ${stock}`}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="lg:col-span-1 space-y-4 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
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

          {/* Client Selection */}
          <div className="mb-4 relative" ref={clientDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cliente
            </label>
            {selectedClient ? (
              <div className="flex items-center justify-between p-2 border border-primary-200 bg-primary-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {selectedClient.nombre?.charAt(0)}{selectedClient.apellido?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white dark:text-white">{selectedClient.nombre} {selectedClient.apellido}</p>
                    <p className="text-xs text-gray-500">{selectedClient.codigo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-1 hover:bg-primary-100 rounded-full text-primary-600 dark:text-primary-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cliente General (Buscar...)"
                  value={clientSearchTerm}
                  onChange={(e) => {
                    setClientSearchTerm(e.target.value)
                    setIsClientDropdownOpen(true)
                  }}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />

                {/* Dropdown results */}
                {isClientDropdownOpen && clientSearchTerm.length >= 1 && (() => {
                  const filtered = clientes.filter(c =>
                    c.nombre?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                    c.apellido?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                    c.codigo?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                    c.telefono?.includes(clientSearchTerm) ||
                    c.email?.toLowerCase().includes(clientSearchTerm.toLowerCase())
                  )
                  return (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700">
                      {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No se encontraron clientes.
                        </div>
                      ) : (
                        filtered.slice(0, 20).map((cliente) => (
                          <div
                            key={cliente.id}
                            className="cursor-pointer select-none py-2.5 px-3 hover:bg-primary-50 transition-colors"
                            onClick={() => {
                              setSelectedClient(cliente)
                              setClientSearchTerm('')
                              setIsClientDropdownOpen(false)
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-xs flex-shrink-0">
                                {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {cliente.nombre} {cliente.apellido}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {cliente.codigo}{cliente.telefono ? ` · ${cliente.telefono}` : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="space-y-3 max-h-[40vh] overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">El carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex-1 pr-2">
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
                        className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:bg-gray-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 dark:bg-gray-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-primary-600 dark:text-primary-400 dark:text-primary-400">
                      {fmtPOS(getItemPrice(item) * item.cantidad)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals and Checkout */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">{fmtPOS(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IGV ({(taxRate * 100).toFixed(0)}%):</span>
              <span className="font-semibold">{fmtPOS(tax)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
              <span className="text-lg font-bold text-gray-900 dark:text-white dark:text-white">Total:</span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 dark:text-primary-400">
                {fmtPOS(total)}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Procesar Pago</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Total a Pagar</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 dark:text-primary-400">
                    {fmtPOS(total)}
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Método de Pago
              </label>
              <div className={`grid ${selectedClient ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-4`}>
                <button
                  onClick={() => handlePaymentMethodChange('efectivo')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'efectivo'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-xs font-medium">Efectivo</span>
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('tarjeta')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'tarjeta'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-medium">Tarjeta</span>
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('transferencia')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'transferencia'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                >
                  <Wallet className="w-6 h-6" />
                  <span className="text-xs font-medium">Transfer.</span>
                </button>
                {selectedClient && (
                  <button
                    onClick={() => handlePaymentMethodChange('cuotas')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'cuotas'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-medium">Cuotas</span>
                  </button>
                )}
              </div>

              {/* Installment configuration fields */}
              {paymentMethod === 'cuotas' && (
                <div className="mb-4 border border-primary-200 rounded-lg p-4 bg-primary-50/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-3 border-b pb-2">Configuración de Cuotas</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pagos/Plazos</label>
                      <input
                        type="number"
                        value={numCuotas}
                        onChange={(e) => setNumCuotas(e.target.value)}
                        min="2"
                        max="24"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej. 3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Monto Cuota (Calc.)</label>
                      <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600">
                        {numCuotas > 0 ? fmtPOS(total / numCuotas) : fmtPOS(0)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pago Inicial Recibido (Opcional)</label>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      min="0"
                      max={total}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Monto adelanto si lo hay..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Si no abonan hoy, dejar vacío o poner 0.</p>
                  </div>
                </div>
              )}
              {/* Cash payment fields */}
              {paymentMethod === 'efectivo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Efectivo Recibido
                  </label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    min={total}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                    placeholder="0.00"
                  />
                  {amountReceived && change >= 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800 font-medium">Cambio:</span>
                        <span className="text-2xl font-bold text-green-700">
                          {fmtPOS(change)}
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
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors"
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
