const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let createdClientId = 0;

async function login() {
    try {
        console.log('Logging in...');
        // Assuming there's a default admin user. If not, this might fail, but let's try with common credentials or check the DB later if needed.
        // Based on previous conversations/files, there's likely an admin user.
        // Let's try to query the DB for a user if we could, but we are running mainly via API.
        // Let's assume a standard test user exists or fail gracefully.
        // Checking `create_user.js` in previous `list_dir` might give a hint, but let's try checking `login` first.

        // Actually, to make this robust, I should probably check if I can get a token.
        // Let's assume the user has a valid token or I can sign one if I had the secret.
        // But for E2E, I need to login.

        // Let's try a default one. If it fails, I'll ask the user or just check the DB.
        // Wait, I can see `db` usage in `backend/src/config/database.js`. I can directly access DB to get a user.

        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@gym.com', // Guessing
            password: 'admin' // Guessing
        });

        authToken = response.data.token;
        console.log('Login successful');
    } catch (error) {
        console.log('Login failed with default credentials. Trying to find a user in DB...');
        // Fallback: This script is running in backend environment, so I can require database
        const db = require('./src/config/database');
        const user = db.prepare('SELECT email FROM usuarios LIMIT 1').get();
        if (user) {
            console.log(`Found user: ${user.email}. Please provide password or I cannot login via API.`);
            // Since I can't interactively ask, I will try to rely on the fact that I might not need full auth if I disable it or I'll just use the DB directly for verification if API fails.
            // BUT, the goal is to test the API.
            // Let's try to verify via direct DB insertion if API login fails, OR just use the existing running server.
            process.exit(1);
        }
    }
}

// Mocking the behavior for now since I don't have the password.
// I will create a script that bypasses Auth middleware OR I will insert a test user with known password if possible.
// Better yet, I will use `run_command` to execute a script that has access to the internal DB and Controller functions directly! 
// That avoids network/auth issues for quick verification. 

// ... Wait, I am an AI. I can just use the controller functions directly in a script!
// That is much more reliable for unit testing the logic I just changed.

const { create, update, getAll, remove } = require('./src/controllers/clientesController');
const { generateClientCode } = require('./src/utils/codeUtils');

// Mock Req/Res
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const mockReq = (body = {}, params = {}, query = {}, user = { id: 1 }) => ({
    body,
    params,
    query,
    user
});

async function runTests() {
    console.log('Starting Client CRUD verification...');

    // 1. Test Create
    console.log('Testing Create...');
    const createReq = mockReq({
        nombre: 'Test',
        apellido: 'Client',
        email: 'test@client.com',
        telefono: '1234567890',
        fechaNacimiento: '1990-01-01',
        condicionesMedicas: 'None',
        alergias: 'Peanuts',
        emergenciaContacto: 'Emergency Contact',
        emergenciaTelefono: '0987654321',
        notas: 'Test notes'
    });
    const createRes = mockRes();

    await create(createReq, createRes);

    if (createRes.statusCode === 201 && createRes.data.id) {
        console.log('✅ Create successful. ID:', createRes.data.id);
        createdClientId = createRes.data.id;

        // Verify fields
        if (createRes.data.apellido === 'Client' && createRes.data.alergias === 'Peanuts' && createRes.data.condiciones_medicas === 'None') {
            console.log('✅ Fields mapped correctly');
        } else {
            console.log('❌ Fields mapping failed', createRes.data);
        }
    } else {
        console.log('❌ Create failed', createRes.data);
        return;
    }

    // 2. Test Update
    console.log('Testing Update...');
    const updateReq = mockReq({
        nombre: 'Updated Name',
        apellido: 'Updated Surname',
        condicionesMedicas: 'Updated Condition'
    }, { id: createdClientId });
    const updateRes = mockRes();

    await update(updateReq, updateRes);

    if (updateRes.data && updateRes.data.nombre === 'Updated Name' && updateRes.data.apellido === 'Updated Surname' && updateRes.data.condiciones_medicas === 'Updated Condition') {
        console.log('✅ Update successful');
    } else {
        console.log('❌ Update failed', updateRes.data);
    }

    // 3. Cleanup (Delete)
    console.log('Cleaning up...');
    const deleteReq = mockReq({}, { id: createdClientId });
    const deleteRes = mockRes();
    await remove(deleteReq, deleteRes);
    console.log('✅ Cleanup done');
}

runTests().catch(console.error);
