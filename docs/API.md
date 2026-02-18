# 📚 Documentación de la API - Sistema de Gestión de Gimnasio

Base URL: `http://localhost:3000/api`

## 🔐 Autenticación

Todas las rutas (excepto `/auth/login`) requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/login`
Login de usuario
```json
Request: { "username": "admin", "password": "admin123" }
Response: { "token": "jwt_token", "user": {...} }
```

#### GET `/api/auth/me`
Obtener usuario actual (requiere auth)

#### POST `/api/auth/change-password`
Cambiar contraseña (requiere auth)

### Usuarios (`/api/usuarios`) - Solo Admin

- GET `/api/usuarios` - Listar usuarios
- GET `/api/usuarios/:id` - Obtener usuario
- POST `/api/usuarios` - Crear usuario
- PUT `/api/usuarios/:id` - Actualizar usuario
- DELETE `/api/usuarios/:id` - Eliminar usuario
- POST `/api/usuarios/:id/reset-password` - Resetear contraseña

### Clientes (`/api/clientes`)

- GET `/api/clientes` - Listar clientes
- GET `/api/clientes/:id` - Obtener cliente
- POST `/api/clientes` - Crear cliente
- PUT `/api/clientes/:id` - Actualizar cliente
- DELETE `/api/clientes/:id` - Eliminar cliente
- GET `/api/clientes/codigo/:codigo` - Buscar por código
- GET `/api/clientes/:id/historial` - Historial completo
- POST `/api/clientes/:id/generar-qr` - Generar código QR

### Membresías (`/api/membresias`)

- GET `/api/membresias` - Listar planes
- POST `/api/membresias` - Crear plan
- PUT `/api/membresias/:id` - Actualizar plan
- DELETE `/api/membresias/:id` - Eliminar plan
- POST `/api/membresias/asignar` - Asignar membresía a cliente
- POST `/api/membresias/renovar/:id` - Renovar membresía
- GET `/api/membresias/cliente/:clienteId` - Membresías de cliente
- GET `/api/membresias/vencimientos` - Próximos vencimientos

### Asistencias (`/api/asistencias`)

- POST `/api/asistencias/checkin` - Registrar check-in
- GET `/api/asistencias/hoy` - Asistencias del día
- GET `/api/asistencias/cliente/:id` - Historial de cliente
- GET `/api/asistencias/estadisticas` - Estadísticas

### Tienda/Productos (`/api/tienda`)

- GET `/api/tienda/productos` - Listar productos
- POST `/api/tienda/productos` - Crear producto
- PUT `/api/tienda/productos/:id` - Actualizar producto
- DELETE `/api/tienda/productos/:id` - Eliminar producto
- GET `/api/tienda/alertas/stock-bajo` - Productos con stock bajo
- GET `/api/tienda/alertas/por-vencer` - Productos por vencer

### Ventas (`/api/ventas`)

- POST `/api/ventas` - Registrar venta
- GET `/api/ventas` - Listar ventas
- GET `/api/ventas/:id` - Detalle de venta
- GET `/api/ventas/estadisticas` - Estadísticas

### Máquinas (`/api/maquinas`)

- GET `/api/maquinas` - Listar máquinas
- POST `/api/maquinas` - Crear máquina
- PUT `/api/maquinas/:id` - Actualizar máquina
- DELETE `/api/maquinas/:id` - Eliminar máquina
- POST `/api/maquinas/:id/mantenimiento` - Registrar mantenimiento
- GET `/api/maquinas/:id/historial` - Historial de mantenimientos

### Notificaciones (`/api/notificaciones`)

- GET `/api/notificaciones` - Listar notificaciones
- GET `/api/notificaciones/no-leidas` - No leídas
- PUT `/api/notificaciones/:id/marcar-leida` - Marcar como leída
- PUT `/api/notificaciones/marcar-todas-leidas` - Marcar todas

### Métricas (`/api/metricas`)

- GET `/api/metricas/dashboard` - Dashboard principal
- GET `/api/metricas/ingresos` - Ingresos por período
- GET `/api/metricas/clientes` - Estadísticas de clientes
- GET `/api/metricas/asistencias` - Estadísticas de asistencias

### Configuración (`/api/configuracion`)

- GET `/api/configuracion` - Obtener toda la configuración
- PUT `/api/configuracion/:clave` - Actualizar configuración
- GET `/api/configuracion/qr` - Generar QR de acceso

## 📝 Códigos de Respuesta

- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
