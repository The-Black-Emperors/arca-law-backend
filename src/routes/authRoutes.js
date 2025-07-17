const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const db = require('../database/db');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/debug-connection', async (req, res) => {
    let dbClient;
    try {
        dbClient = await db.pool.connect();
        const timeResult = await dbClient.query('SELECT NOW()');
        res.status(200).json({
            status: "SUCESSO",
            message: "A conexão com o banco de dados Supabase foi estabelecida com sucesso.",
            databaseTime: timeResult.rows[0].now
        });
    } catch (error) {
        console.error("ERRO CRÍTICO NA CONEXÃO COM O BANCO:", error);
        res.status(500).json({
            status: "FALHA NA CONEXÃO",
            message: "Não foi possível conectar ao banco de dados.",
            error_name: error.name,
            error_message: error.message,
            error_stack: error.stack
        });
    } finally {
        if (dbClient) {
            dbClient.release();
        }
    }
});

module.exports = router;