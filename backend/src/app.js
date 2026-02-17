require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const { displayServerInfo } = require('./utils/networkUtils');

// Import services
const notificacionesService = require('./services/notificacionesService');
const backupService = require('./services/backupService');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const clientesRoutes = require('./routes/clientes');
const membresiasRoutes = require('./routes/membresias');
const asistenciasRoutes = require('./routes/asistencias');
const tiendaRoutes = require('./routes/tienda');
const ventasRoutes = require('./routes/ventas');
const maquinasRoutes = require('./routes/maquinas');
const notificacionesRoutes = require('./routes/notificaciones');
const metricasRoutes = require('./routes/metricas');
const configuracionRoutes = require('./routes/configuracion');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces for LAN access

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/backups', express.static(path.join(__dirname, '../backups')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/membresias', membresiasRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/tienda', tiendaRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/maquinas', maquinasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/metricas', metricasRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: db ? 'connected' : 'disconnected'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Gym Management System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            usuarios: '/api/usuarios',
            clientes: '/api/clientes',
            membresias: '/api/membresias',
            asistencias: '/api/asistencias',
            tienda: '/api/tienda',
            ventas: '/api/ventas',
            maquinas: '/api/maquinas',
            notificaciones: '/api/notificaciones',
            metricas: '/api/metricas',
            configuracion: '/api/configuracion',
            health: '/api/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, HOST, () => {
    displayServerInfo(PORT);
    
    // Initialize scheduled services
    console.log('🔧 Initializing scheduled services...');
    notificacionesService.startDailyNotifications();
    console.log('✅ Notifications service started (runs daily at midnight)');
    
    backupService.startAutomaticBackups();
    console.log('✅ Backup service started (check configuration for schedule)');
    
    console.log('\n📚 API Documentation: See docs/API.md');
    console.log('👤 Default credentials: username=admin, password=admin123\n');
});

module.exports = app;
