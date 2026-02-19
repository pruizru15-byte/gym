
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetCode } = require('../services/emailService');
const crypto = require('crypto');

/**
 * Login user
 */
const login = (req, res) => {
    try {
        console.log('Login request body:', JSON.stringify(req.body));
        const { username, email, password } = req.body;

        // Allow login with either username or email
        const identifier = username || email;
        console.log('Login identifier:', identifier);

        if (!identifier || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ error: 'Username/Email and password are required' });
        }

        // Find user by username or email
        console.log('Querying database for user...');
        let user;
        try {
            // Using a simpler query first to debug
            const stmt = db.prepare('SELECT * FROM usuarios WHERE (username = ? OR email = ?) AND activo = 1');
            user = stmt.get(identifier, identifier);
            console.log('User found in DB:', user ? user.username : 'null');
        } catch (err) {
            console.error('Database query error:', err);
            throw err;
        }

        if (!user) {
            console.log('User not found or inactive');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        console.log('Verifying password...');
        const isValidPassword = bcrypt.compareSync(password, user.password_hash);
        console.log('Password valid:', isValidPassword);

        if (!isValidPassword) {
            console.log('Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        console.log('Generating token...');
        const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_should_be_in_env';
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                rol: user.rol,
                nombre: user.nombre,
                foto: user.foto
            },
            secret,
            { expiresIn: '24h' }
        );

        // Return user info and token
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                foto: user.foto
            }
        });
        console.log('Login successful');
    } catch (error) {
        console.error('Login error details:', error);
        res.status(500).json({ error: 'Error during login', details: error.message });
    }
};

/**
 * Get current user info
 */
const getMe = (req, res) => {
    try {
        const user = db.prepare(
            'SELECT id, username, nombre, email, rol, activo, foto, fecha_creacion FROM usuarios WHERE id = ?'
        ).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Error getting user info' });
    }
};

/**
 * Change password
 */
const changePassword = (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Get user
        const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);

        // Verify current password
        const isValidPassword = bcrypt.compareSync(currentPassword, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // Update password
        db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashedPassword, req.user.id);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Error changing password' });
    }
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user by email
        const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1').get(email);

        if (!user) {
            // Should not reveal if user exists or not for security, but for UX in this app maybe we do?
            // Let's return success generic message usually.
            // But user asked "salga el correo que le pertenece a la cuenta" implies they might input username?
            // "cuando no recuerde la contraseña , permita en el inicio de sesión ver la opción de restablecer contraseña,
            // y salga el correo que le pertenece a la cuenta pero que no pueda editarlo" -> This sounds like they are logged in? 
            // Or they enter username and we show email?
            // "esta es la contraseña para que puedas enviar correo: izdt ckar rull gumv, el correo es: getfitsullana2019@gmail.com"
            // Let's stick to standard flow: Enter email -> verify. 
            // The user said "y salga el correo que le pertenece a la cuenta pero que no pueda editarlo" - this might mean 
            // if they input username, we show the email? 
            // Let's implement looking up by username OR email for flexibility.
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiry to 15 mins from now
        const expires = Date.now() + 15 * 60 * 1000;

        // Update user
        db.prepare('UPDATE usuarios SET reset_code = ?, reset_code_expires = ? WHERE id = ?')
            .run(code, expires, user.id);

        // Send email
        const sent = await sendResetCode(user.email, code);

        if (sent) {
            res.json({ message: 'Reset code sent to email', email: user.email }); // Returning email so frontend can show it masked if needed
        } else {
            res.status(500).json({ error: 'Error sending email' });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Verify code and reset password
 */
const resetPassword = (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: 'Email, code and new password are required' });
        }

        // Validate password complexity
        // "más de 8 caracteres, 1 caracter especial, mayusculas, y numeros"
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                error: 'Password must be more than 8 characters, contain at least 1 uppercase, 1 number, and 1 special character.'
            });
        }

        // Find user with matching email and code, and code not expired
        const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND reset_code = ?').get(email, code);

        if (!user) {
            return res.status(400).json({ error: 'Invalid code or email' });
        }

        if (user.reset_code_expires < Date.now()) {
            return res.status(400).json({ error: 'Code expired' });
        }

        // Hash new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // Update password and clear reset code
        db.prepare('UPDATE usuarios SET password_hash = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?')
            .run(hashedPassword, user.id);

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    login,
    getMe,
    changePassword,
    forgotPassword,
    resetPassword
};
