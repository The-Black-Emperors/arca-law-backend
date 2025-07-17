const db = require('../database/db');

const getEntriesByProcessId = async (req, res) => {
    const { processId } = req.params;
    try {
        const queryText = 'SELECT * FROM financial_entries WHERE process_id = $1 AND user_id = $2 ORDER BY created_at DESC';
        const { rows } = await db.query(queryText, [processId, req.user.id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar lançamentos financeiros.', error_details: error.toString() });
    }
};

const createEntry = async (req, res) => {
    const { processId } = req.params;
    const { description, value, type, status, due_date } = req.body;

    if (!description || !value || !type || !status) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const queryText = 'INSERT INTO financial_entries(description, value, type, status, due_date, process_id, user_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const { rows } = await db.query(queryText, [description, value, type, status, due_date, processId, req.user.id]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar lançamento financeiro.', error_details: error.toString() });
    }
};

const getFinancialSummary = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'RECEITA' AND status = 'PAGO' THEN value ELSE 0 END), 0) as total_receitas,
                COALESCE(SUM(CASE WHEN type = 'DESPESA' AND status = 'PAGO' THEN value ELSE 0 END), 0) as total_despesas,
                COALESCE(SUM(CASE WHEN type = 'RECEITA' AND status = 'PENDENTE' THEN value ELSE 0 END), 0) as a_receber
            FROM financial_entries WHERE user_id = $1
        `;
        const { rows } = await db.query(queryText, [req.user.id]);
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar resumo financeiro.', error_details: error.toString() });
    }
};

module.exports = {
    getEntriesByProcessId,
    createEntry,
    getFinancialSummary
};