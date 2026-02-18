# Frontend - Sistema de Gestión de Gimnasio

Frontend moderno desarrollado con React, Vite, TailwindCSS para el sistema de gestión de gimnasio.

## 🚀 Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **TailwindCSS** - Framework de CSS
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos
- **React Hot Toast** - Notificaciones

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          # Componentes React
│   │   ├── Auth/           # Componentes de autenticación
│   │   │   └── Login.jsx
│   │   ├── Dashboard/      # Componentes del dashboard
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── AlertasWidget.jsx
│   │   │   └── IngresoChart.jsx
│   │   └── Layout/         # Componentes de layout
│   │       ├── Layout.jsx
│   │       ├── Sidebar.jsx
│   │       └── Header.jsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.js
│   │   └── useNotifications.js
│   ├── services/           # Servicios API
│   │   └── api.js
│   ├── utils/              # Utilidades
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── App.jsx            # Componente principal
│   ├── main.jsx           # Punto de entrada
│   └── index.css          # Estilos globales
├── public/                 # Archivos estáticos
├── index.html             # HTML principal
├── vite.config.js         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
├── postcss.config.js      # Configuración de PostCSS
└── package.json           # Dependencias
```

## 🛠️ Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con la URL del backend:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Comandos

### Desarrollo
```bash
npm run dev
```
Inicia el servidor de desarrollo en `http://localhost:3000`

### Construcción
```bash
npm run build
```
Genera los archivos optimizados para producción en `dist/`

### Vista Previa
```bash
npm run preview
```
Previsualiza la build de producción localmente

## 🔐 Autenticación

El sistema utiliza JWT para autenticación:

1. El usuario inicia sesión en `/login`
2. El token JWT se almacena en `localStorage`
3. Todas las peticiones incluyen el token en el header `Authorization`
4. El contexto `AuthContext` maneja el estado de autenticación

### Credenciales de Demo
```
Email: admin@gym.com
Password: admin123
```

## 📡 API Service

El servicio API (`src/services/api.js`) proporciona métodos para todas las operaciones:

```javascript
import { membersAPI, membershipsAPI, paymentsAPI } from './services/api'

// Obtener miembros
const members = await membersAPI.getAll()

// Crear membresía
const membership = await membershipsAPI.create(data)

// Registrar pago
const payment = await paymentsAPI.create(data)
```

## 🎨 Componentes Principales

### Layout
- **Layout.jsx**: Wrapper principal con sidebar y header
- **Sidebar.jsx**: Navegación lateral con menú
- **Header.jsx**: Cabecera con notificaciones y menú de usuario

### Dashboard
- **Dashboard.jsx**: Vista principal del dashboard
- **MetricCard.jsx**: Tarjeta reutilizable para métricas
- **AlertasWidget.jsx**: Widget de alertas y notificaciones
- **IngresoChart.jsx**: Gráfico de ingresos con Recharts

### Auth
- **Login.jsx**: Página de inicio de sesión

## 🪝 Custom Hooks

### useAuth
```javascript
const { user, login, logout, loading } = useAuth()
```
Maneja autenticación y estado del usuario.

### useNotifications
```javascript
const { 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead 
} = useNotifications()
```
Maneja alertas y notificaciones.

## 🛠️ Utilidades

### Formatters (`utils/formatters.js`)
```javascript
import { formatDate, formatCurrency, formatPhone } from './utils/formatters'

formatDate(new Date())           // "17 de febrero de 2024"
formatCurrency(1500)             // "$1,500.00"
formatPhone("5551234567")        // "(555) 123-4567"
```

### Validators (`utils/validators.js`)
```javascript
import { isValidEmail, isValidPhone, validateForm } from './utils/validators'

isValidEmail("user@example.com") // true
isValidPhone("5551234567")       // true

const errors = validateForm(values, rules)
```

## 🎨 Estilos con TailwindCSS

El proyecto usa TailwindCSS con clases de utilidad personalizadas:

```css
/* Componentes predefinidos */
.card         /* Tarjeta con bordes y sombra */
.btn          /* Botón base */
.btn-primary  /* Botón primario */
.input        /* Campo de entrada */
.label        /* Etiqueta de campo */
```

## 🔄 Routing

Rutas configuradas con React Router:

- `/login` - Página de inicio de sesión (pública)
- `/dashboard` - Dashboard principal (protegida)
- `/miembros` - Gestión de miembros (protegida)
- `/membresias` - Gestión de membresías (protegida)
- `/asistencias` - Registro de asistencias (protegida)
- `/pagos` - Gestión de pagos (protegida)
- `/reportes` - Reportes y estadísticas (protegida)

Las rutas protegidas requieren autenticación.

## 🔔 Notificaciones

Sistema de notificaciones con `react-hot-toast`:

```javascript
import toast from 'react-hot-toast'

toast.success('Operación exitosa')
toast.error('Error al procesar')
toast.loading('Cargando...')
```

## 🚧 Próximas Funcionalidades

- [ ] Gestión completa de miembros
- [ ] Sistema de pagos integrado
- [ ] Reportes avanzados
- [ ] Gestión de clases y horarios
- [ ] Sistema de reservas
- [ ] Notificaciones en tiempo real
- [ ] Modo oscuro
- [ ] Soporte multiidioma

## 📱 Responsive Design

El diseño es completamente responsive:
- Mobile first approach
- Breakpoints de Tailwind (sm, md, lg, xl)
- Sidebar colapsable en mobile
- Grids adaptables

## 🐛 Troubleshooting

### Error de conexión con el backend
Verifica que:
1. El backend esté corriendo en `http://localhost:5000`
2. La variable `VITE_API_URL` en `.env` sea correcta
3. No haya problemas de CORS

### Error de compilación
```bash
# Limpia cache y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Problemas con Tailwind
```bash
# Regenera los estilos
npm run build
```

## 📄 Licencia

Este proyecto es parte del Sistema de Gestión de Gimnasio.

## 👥 Contribución

Para contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

**Desarrollado con ❤️ para GymPro**
