const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const db = require('../database/db');
const bcrypt = require('bcryptjs');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/debug-register', async (req, res) => {
    const { name, email, password } = req.body;
    
    // Passo 1: Checar se o usuário já existe
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length > 0) {
            return res.status(409).json({ step: 1, status: 'failed', message: 'Usuário com este email já existe.' });
        }
    } catch (dbError) {
        return res.status(500).json({ step: 1, status: 'error', message: 'Erro ao checar usuário no banco.', error_details: dbError.message });
    }

    // Passo 2: Criptografar a senha
    let password_hash;
    try {
        const salt = await bcrypt.genSalt(10);
        password_hash = await bcrypt.hash(password, salt);
    } catch (bcryptError) {
        return res.status(500).json({ step: 2, status: 'error', message: 'Erro ao criptografar a senha.', error_details: bcryptError.message });
    }

    // Passo 3: Inserir no banco de dados
    try {
        const queryText = 'INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING id, name, email';
        const { rows } = await db.query(queryText, [name, email, password_hash]);
        return res.status(201).json({ step: 3, status: 'success', message: 'Usuário registrado com sucesso!', user: rows[0] });
    } catch (insertError) {
        return res.status(500).json({ step: 3, status: 'error', message: 'Erro ao inserir usuário no banco.', error_details: insertError.message });
    }
});

module.exports = router;