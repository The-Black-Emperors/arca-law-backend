const db = require('../database/db');

const getEvents = async (req, res) => {
    const { start, end } = req.query;
    try {
        const queryText = `
            SELECT 
                id, 
                title, 
                start_time as "start", 
                end_time as "end",
                all_day as "allDay",
                description
            FROM events 
            WHERE user_id = $1 AND start_time < $2 AND end_time > $3
        `;
        const { rows } = await db.query(queryText, [req.user.id, end, start]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar eventos.', error_details: error.toString() });
    }
};

const createEvent = async (req, res) => {
    const { title, start, end, allDay, description, process_id } = req.body;
    if (!title || !start || !end) {
        return res.status(400).json({ message: 'Título, início e fim são obrigatórios.' });
    }
    try {
        const queryText = 'INSERT INTO events(title, start_time, end_time, all_day, description, process_id, user_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, start_time as "start", end_time as "end", all_day as "allDay"';
        const { rows } = await db.query(queryText, [title, start, end, allDay, description, process_id, req.user.id]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar evento.', error_details: error.toString() });
    }
};

const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, start, end, allDay, description, process_id } = req.body;
    try {
        const queryText = 'UPDATE events SET title = $1, start_time = $2, end_time = $3, all_day = $4, description = $5, process_id = $6 WHERE id = $7 AND user_id = $8 RETURNING id';
        const { rows } = await db.query(queryText, [title, start, end, allDay, description, process_id, id, req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar evento.', error_details: error.toString() });
    }
};

const deleteEvent = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = 'DELETE FROM events WHERE id = $1 AND user_id = $2';
        await db.query(queryText, [id, req.user.id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar evento.', error_details: error.toString() });
    }
};

module.exports = {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent
};