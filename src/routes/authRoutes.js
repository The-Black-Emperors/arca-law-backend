const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/debug-login', async (req, res) => {
    const { email, password } = req.body;
    
    let user;
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ step: 'find_user', status: 'failed', message: 'Usuário não encontrado.' });
        }
        user = rows[0];
    } catch (dbError) {
        return res.status(500).json({ step: 'find_user', status: 'error', error_message: dbError.message });
    }

    try {
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ step: 'password_compare', status: 'failed', message: 'Senha incorreta.' });
        }
    } catch (bcryptError) {
        return res.status(500).json({ step: 'password_compare', status: 'error', error_message: bcryptError.message });
    }

    try {
        const payload = { user: { id: user.id, name: user.name } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ step: 'jwt_sign', status: 'success', token: token });
    } catch (jwtError) {
        return res.status(500).json({ step: 'jwt_sign', status: 'error', error_message: jwtError.message });
    }
});

module.exports = router;