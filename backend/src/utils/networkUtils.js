const os = require('os');

/**
 * Get local IP address of the machine
 */
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    
    return 'localhost';
}

/**
 * Display server access information
 */
function displayServerInfo(port) {
    const localIP = getLocalIPAddress();
    
    console.log('\n=================================================');
    console.log('🏋️  SISTEMA DE GESTIÓN DE GIMNASIO');
    console.log('=================================================');
    console.log(`✅ Servidor corriendo en puerto ${port}`);
    console.log('\n📡 URLs de acceso:');
    console.log(`   Local:    http://localhost:${port}`);
    console.log(`   Red Local: http://${localIP}:${port}`);
    console.log('\n📱 Para acceder desde otros dispositivos:');
    console.log(`   1. Asegúrate de estar en la misma red WiFi`);
    console.log(`   2. Usa la URL: http://${localIP}:${port}`);
    console.log(`   3. O escanea el código QR generado`);
    console.log('=================================================\n');
    
    return localIP;
}

module.exports = {
    getLocalIPAddress,
    displayServerInfo
};
