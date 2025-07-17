const db = require('../database/db');

const getAllContacts = async (req, res) => {
    try {
        const queryText = 'SELECT * FROM contacts WHERE user_id = $1 ORDER BY name ASC';
        const { rows } = await db.query(queryText, [req.user.id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar contatos.', error_details: error.toString() });
    }
};

const createContact = async (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name) { 
        return res.status(400).json({ message: 'O nome do contato é obrigatório.' });
    }
    try {
        const queryText = 'INSERT INTO contacts(name, email, phone, address, user_id) VALUES($1, $2, $3, $4, $5) RETURNING *';
        const { rows } = await db.query(queryText, [name, email, phone, address, req.user.id]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar contato.', error_details: error.toString() });
    }
};

module.exports = {
    getAllContacts,
    createContact
};