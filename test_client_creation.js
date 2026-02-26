const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testCreateClient() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: '123456' // Assuming default password
        });
        const token = loginRes.data.token;
        console.log('Login successful, token obtained.');

        // 2. Create Client
        console.log('Creating client...');
        const clientData = {
            codigo: 'TEST-' + Date.now(),
            nombre: 'Test',
            apellido: 'User',
            email: 'test@example.com',
            telefono: '1234567890',
            fecha_nacimiento: '1990-01-01',
            direccion: 'Test Address'
        };

        const createRes = await axios.post(`${API_URL}/clientes`, clientData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Client created successfully:', createRes.data);

        // 3. Cleanup (optional, or just leave it)
    } catch (error) {
        console.error('Full Error:', error);
    }
}

testCreateClient();
