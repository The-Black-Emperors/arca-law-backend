const db = require('../database/db');
const scraperService = require('../services/scraperService');
const emailService = require('../services/emailService');

const getAllProcesses = async (req, res) => {
    const limit = req.query.limit;
    try {
        let queryText = 'SELECT * FROM processos WHERE user_id = $1 ORDER BY created_at DESC';
        const queryParams = [req.user.id];
        if (limit) {
            queryText += ` LIMIT $2`;
            queryParams.push(limit);
        }
        const { rows } = await db.query(queryText, queryParams);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro do Servidor.', error_details: error.toString() });
    }
};

const getProcessById = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = 'SELECT * FROM processos WHERE id = $1 AND user_id = $2';
        const { rows } = await db.query(queryText, [id, req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Processo não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro do Servidor.' });
    }
};

const createProcess = async (req, res) => {
    const { numero, autor } = req.body;
    if (!numero || !autor) {
        return res.status(400).json({ message: 'Campos obrigatórios.' });
    }
    try {
        const queryText = 'INSERT INTO processos(numero, autor, user_id) VALUES($1, $2, $3) RETURNING *';
        const { rows } = await db.query(queryText, [numero, autor, req.user.id]);
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Já existe um processo com este número.' });
        }
        res.status(500).json({ message: 'Erro do Servidor.', error_details: error.toString() });
    }
};

const deleteProcess = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = 'DELETE FROM processos WHERE id = $1 AND user_id = $2 RETURNING *';
        const result = await db.query(queryText, [id, req.user.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Processo não encontrado ou não pertence a você.' });
        }
        res.status(200).json({ message: 'Processo deletado.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro do Servidor.', error_details: error.toString() });
    }
};

const updateProcess = async (req, res) => {
    const { id } = req.params;
    const { numero, autor } = req.body;
    if (!numero || !autor) {
        return res.status(400).json({ message: 'Campos obrigatórios.' });
    }
    try {
        const queryText = 'UPDATE processos SET numero = $1, autor = $2 WHERE id = $3 AND user_id = $4 RETURNING *';
        const { rows } = await db.query(queryText, [numero, autor, id, req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Processo não encontrado ou não pertence a você.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Já existe um processo com este novo número.' });
        }
        res.status(500).json({ message: 'Erro do Servidor.', error_details: error.toString() });
    }
};

const checkProcessUpdates = async (req, res) => {
    const { id } = req.params;
    const { processUrl } = req.body;
    if (!processUrl) {
        return res.status(400).json({ message: "URL do processo é obrigatória." });
    }
    try {
        const { rows: processRows } = await db.query('SELECT numero FROM processos WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (processRows.length === 0) {
            return res.status(404).json({ message: 'Processo não encontrado.' });
        }
        const processNumber = processRows[0].numero;

        const updates = await scraperService.scrapeProcessUpdates(processUrl);
        if (updates.length === 0) {
            return res.status(200).json({ message: 'Nenhuma movimentação encontrada para extrair da página.', count: 0 });
        }
        
        const newUpdates = [];
        for (const update of updates) {
            const formattedDate = update.date.split('/').reverse().join('-');
            const queryText = 'INSERT INTO process_updates(process_id, update_date, description) VALUES($1, $2, $3) ON CONFLICT (process_id, update_date, description) DO NOTHING RETURNING *';
            const result = await db.query(queryText, [id, formattedDate, update.description]);
            if (result.rowCount > 0) {
                newUpdates.push(result.rows[0]);
            }
        }
        
        await db.query('UPDATE processos SET last_check_at = NOW() WHERE id = $1', [id]);

        if (newUpdates.length > 0) {
            const { rows: userRows } = await db.query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
            if (userRows.length > 0) {
                await emailService.sendNewUpdateNotification(userRows[0].email, userRows[0].name, processNumber, updates);
            }
        }

        res.status(200).json({ message: `${newUpdates.length} nova(s) movimentação(ões) salva(s).`, count: newUpdates.length });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao verificar movimentações.', error_details: error.toString() });
    }
};

module.exports = {
    getAllProcesses,
    getProcessById,
    createProcess,
    deleteProcess,
    updateProcess,
    checkProcessUpdates
};