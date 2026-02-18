# Gym Management System - Backend API Documentation

## Controllers and Routes Created

All controllers and routes have been successfully created for the gym management system.

### 1. Clientes (Clients) - `/api/clientes`

**Controller:** `clientesController.js`
**Route:** `clientes.js`

#### Endpoints:
- `GET /` - Get all clients (with pagination and filters)
- `GET /:id` - Get client by ID (with membership and attendance info)
- `GET /codigo/:codigo` - Get client by code (for QR scanning)
- `GET /:id/asistencias` - Get client attendance history
- `GET /:id/membresias` - Get client membership history
- `POST /` - Create new client (with QR code generation)
- `PUT /:id` - Update client
- `DELETE /:id` - Deactivate client
- `POST /:id/regenerar-qr` - Regenerate QR code

**Features:**
- QR code generation for each client
- Search by name, code, email, phone
- Filter by active status
- Pagination support

---

### 2. Membresías (Memberships) - `/api/membresias`

**Controller:** `membresiasController.js`
**Route:** `membresias.js`

#### Endpoints:
- `GET /` - Get all membership plans
- `GET /:id` - Get membership by ID
- `GET /por-vencer` - Get expiring memberships (next 7 days)
- `GET /vencidas` - Get expired memberships
- `GET /cliente/:cliente_id` - Get client's membership history
- `POST /` - Create membership plan
- `POST /asignar` - Assign membership to client
- `PUT /:id` - Update membership plan
- `DELETE /:id` - Deactivate membership plan

**Features:**
- Automatic date calculation for membership expiration
- Payment registration when assigning membership
- Deactivates previous memberships when assigning new one
- Tracks who registered the membership

---

### 3. Asistencias (Attendance/Check-in) - `/api/asistencias`

**Controller:** `asistenciasController.js`
**Route:** `asistencias.js`

#### Endpoints:
- `GET /` - Get all attendance records (with pagination)
- `GET /hoy` - Get today's attendance
- `GET /estadisticas` - Get attendance statistics
- `GET /cliente/:cliente_id` - Get client attendance history
- `POST /checkin` - Check-in client by ID
- `POST /checkin-codigo` - Check-in client by QR code

**Features:**
- Validates active membership before check-in
- Prevents duplicate check-ins on same day
- Peak hours analysis
- Top clients tracking
- Daily and date-range statistics

---

### 4. Tienda (Store/Products) - `/api/tienda`

**Controller:** `tiendaController.js`
**Route:** `tienda.js`

#### Endpoints:
- `GET /` - Get all products (with pagination and filters)
- `GET /:id` - Get product by ID
- `GET /codigo/:codigo` - Get product by barcode
- `GET /stock-bajo` - Get low stock products
- `GET /categorias` - Get product categories
- `POST /` - Create product
- `PUT /:id` - Update product
- `PATCH /:id/stock` - Update product stock (add/subtract)
- `DELETE /:id` - Deactivate product

**Features:**
- Search by name, code, description
- Filter by category, active status, low stock
- Stock management with minimum alerts
- Barcode support
- Expiration date tracking

---

### 5. Ventas (Sales/POS) - `/api/ventas`

**Controller:** `ventasController.js`
**Route:** `ventas.js`

#### Endpoints:
- `GET /` - Get all sales (with pagination)
- `GET /:id` - Get sale by ID (with details)
- `GET /hoy` - Get today's sales
- `GET /rango` - Get sales by date range
- `GET /top-productos` - Get top selling products
- `POST /` - Create new sale (Point of Sale)

**Features:**
- Complete point of sale transaction processing
- Automatic stock reduction
- Payment method tracking (cash, card, transfer)
- Change calculation
- Sales details with product information
- Payment history registration
- Sales statistics by date and payment method

---

### 6. Máquinas (Gym Machines) - `/api/maquinas`

**Controller:** `maquinasController.js`
**Route:** `maquinas.js`

#### Endpoints:
- `GET /` - Get all machines (with pagination and filters)
- `GET /:id` - Get machine by ID (with maintenance history)
- `GET /necesitan-mantenimiento` - Get machines needing maintenance
- `GET /categorias` - Get machine categories
- `GET /:maquina_id/mantenimientos` - Get maintenance history
- `POST /` - Create machine
- `POST /:maquina_id/mantenimientos` - Add maintenance record
- `PUT /:id` - Update machine
- `DELETE /:id` - Deactivate machine

**Features:**
- Machine status tracking (good, maintenance, repair, out of service)
- Automatic maintenance scheduling
- Maintenance history with costs
- Filter by category, status
- Preventive and corrective maintenance tracking

---

### 7. Notificaciones (Notifications) - `/api/notificaciones`

**Controller:** `notificacionesController.js`
**Route:** `notificaciones.js`

#### Endpoints:
- `GET /` - Get all notifications (with pagination and filters)
- `GET /:id` - Get notification by ID
- `GET /no-leidas/contador` - Get unread count
- `POST /` - Create notification
- `POST /generar-automaticas` - Generate automatic notifications
- `PATCH /:id/marcar-leida` - Mark notification as read
- `PATCH /marcar-todas-leidas` - Mark all as read
- `DELETE /:id` - Delete notification
- `DELETE /leidas/todas` - Delete all read notifications

**Features:**
- Automatic notification generation for:
  - Expiring memberships (7 days)
  - Low stock products
  - Machines needing maintenance
  - Expiring products
- Priority levels (low, medium, high, critical)
- Type categorization
- Reference tracking to related entities
- Bulk operations

---

### 8. Métricas (Metrics/Dashboard) - `/api/metricas`

**Controller:** `metricasController.js`
**Route:** `metricas.js`

#### Endpoints:
- `GET /dashboard` - Get main dashboard metrics
- `GET /ingresos` - Get revenue statistics
- `GET /egresos` - Get expenses statistics
- `GET /asistencias` - Get attendance statistics
- `GET /membresias` - Get membership statistics
- `GET /productos` - Get products statistics
- `GET /maquinas` - Get machines statistics
- `GET /comparativa` - Get comparative statistics (current vs previous period)

**Features:**
- Real-time dashboard KPIs
- Revenue analysis by period, type, and payment method
- Expense tracking by category
- Attendance patterns and peak hours
- Membership renewal tracking
- Inventory value calculation
- Period comparison (day, week, month)
- Top clients and products

---

### 9. Configuración (Configuration) - `/api/configuracion`

**Controller:** `configuracionController.js`
**Route:** `configuracion.js`

#### Endpoints:
- `GET /` - Get all configuration settings
- `GET /:clave` - Get configuration by key
- `GET /gimnasio` - Get gym information
- `GET /sistema` - Get system settings
- `POST /` - Set or update configuration
- `POST /inicializar` - Initialize default configuration
- `PUT /gimnasio` - Update gym info
- `PUT /multiple` - Update multiple configurations
- `DELETE /:clave` - Delete configuration

**Features:**
- Gym information (name, address, phone, email, hours)
- System settings (currency, timezone, language)
- Alert configurations
- Notification preferences
- Backup settings
- Theme customization
- Default configuration initialization

---

## Common Features Across All Controllers

### Authentication
All endpoints require authentication using JWT token (except health check and root).

### Error Handling
- Proper HTTP status codes
- Descriptive error messages
- Validation of required fields
- Database error handling

### Pagination
Most list endpoints support pagination with:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: varies by endpoint)

### Filters
Search and filter capabilities on list endpoints.

### Database
- Uses SQLite with better-sqlite3
- Transactions for complex operations
- Prepared statements for security
- Soft deletes (activo flag) for most entities

### Date Handling
Uses dateUtils for consistent date formatting and calculations.

### User Tracking
Most operations track which user performed the action (usuario_registro_id, usuario_id).

---

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite with better-sqlite3
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **QR Generation:** qrcode library
- **Date Handling:** Native JavaScript Date with custom utilities

---

## File Structure

```
backend/
├── src/
│   ├── app.js                  # Main application entry point
│   ├── config/
│   │   └── database.js         # Database configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── clientesController.js
│   │   ├── membresiasController.js
│   │   ├── asistenciasController.js
│   │   ├── tiendaController.js
│   │   ├── ventasController.js
│   │   ├── maquinasController.js
│   │   ├── notificacionesController.js
│   │   ├── metricasController.js
│   │   ├── configuracionController.js
│   │   └── usuariosController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clientes.js
│   │   ├── membresias.js
│   │   ├── asistencias.js
│   │   ├── tienda.js
│   │   ├── ventas.js
│   │   ├── maquinas.js
│   │   ├── notificaciones.js
│   │   ├── metricas.js
│   │   ├── configuracion.js
│   │   └── usuarios.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── dateUtils.js
│       ├── qrGenerator.js
│       └── networkUtils.js
├── database/
│   └── migrations/
│       └── init.sql
├── uploads/                    # File uploads
├── backups/                    # Database backups
└── package.json
```

---

## Next Steps

1. **Testing:** Test each endpoint with proper authentication
2. **Documentation:** Add API documentation (Swagger/OpenAPI)
3. **Validation:** Consider adding express-validator for robust input validation
4. **Logging:** Implement proper logging (winston, morgan)
5. **Rate Limiting:** Add rate limiting for API security
6. **File Upload:** Implement file upload for client photos and machine images
7. **Backup Service:** Implement automatic backup service
8. **Email/SMS:** Integrate notification services
9. **Reports:** Add PDF report generation
10. **WebSocket:** Consider real-time updates for dashboard

---

## Database Schema Reference

The controllers follow the database schema defined in `backend/database/migrations/init.sql` with tables for:
- usuarios (users)
- clientes (clients)
- membresias (membership plans)
- clientes_membresias (client memberships)
- asistencias (attendance)
- productos (products)
- ventas (sales)
- ventas_detalle (sales details)
- maquinas (machines)
- mantenimientos (maintenance records)
- notificaciones (notifications)
- configuracion (configuration)
- pagos (payments)
- egresos (expenses)
- caja (cash register)
