const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testCreate() {
    try {
        console.log('Testing Create Client on Real Server...');

        // Login first (optional if I can find a token, but let's try without if protected, 
        // wait, routes are protected. I need a token.)
        // I will try to login with default credits.

        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@gym.com',
                password: 'admin' // Attempting default
            });
            token = loginRes.data.token;
            console.log('Login success');
        } catch (e) {
            console.log('Login failed (expected if creds wrong). Skipping auth check (might fail with 401).');
            // If 401, we can't test 400 vs 500 easily without a token.
            // But let's verify if we get 401 or 400 (if 400 comes before auth? No, auth is middleware).
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const payload = {
            nombre: 'TestAPI',
            apellido: 'RealServer',
            email: `testapi${Date.now()}@test.com`,
            telefono: '5555555555',
            // No codigo sent! This should work if backend is updated.
            fechaNacimiento: '1990-01-01'
        };

        const res = await axios.post(`${API_URL}/clientes`, payload, { headers });
        console.log('✅ Status:', res.status);
        console.log('✅ Data:', res.data);

    } catch (error) {
        if (error.response) {
            console.log('❌ Status:', error.response.status);
            console.log('❌ Data:', error.response.data);

            if (error.response.status === 400) {
                console.log('Analysis: 400 Bad Request received.');
                // Check message
                if (error.response.data.error && error.response.data.error.includes('Code')) {
                    console.log('CONCLUSION: Server is running OLD code (expects Code). RESTART NEEDED.');
                } else {
                    console.log('CONCLUSION: Server returned 400 but not about Code. Check validation messages.');
                }
            }
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

testCreate();
