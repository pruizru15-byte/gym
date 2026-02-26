const axios = require('axios');

async function test() {
    try {
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: '123456'
        });
        console.log('Login returned:', login.status);
        const token = login.data.token;

        const inactivos = await axios.get('http://localhost:5000/api/pagos/inactivos', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Inactivos:', inactivos.data.data.length);

        const pendientes = await axios.get('http://localhost:5000/api/pagos/pendientes', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Pendientes:', pendientes.data.data.length);

    } catch (e) {
        if (e.response) {
            console.error('API Error:', e.response.status, e.response.data);
        } else {
            console.error('Network Error:', e.message);
        }
    }
}

test();
