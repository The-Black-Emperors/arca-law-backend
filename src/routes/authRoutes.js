const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/debug-env', (req, res) => {
    res.status(200).json({
        message: "Verificando variáveis de ambiente no servidor Vercel:",
        DATABASE_URL_IS_SET: !!process.env.DATABASE_URL,
        JWT_SECRET_IS_SET: !!process.env.JWT_SECRET,
        STRIPE_API_KEY_IS_SET: !!process.env.STRIPE_API_KEY,
        VERCEL_ENVIRONMENT: process.env.VERCEL_ENV || "Não definido"
    });
});

module.exports = router;