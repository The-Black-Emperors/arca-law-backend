const db = require('../database/db');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

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

const createClientInvoice = async (req, res) => {
    const { entryId } = req.params;
    const { clientEmail } = req.body;
    if (!clientEmail) {
        return res.status(400).json({ message: 'Email do cliente é obrigatório.' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM financial_entries WHERE id = $1 AND user_id = $2', [entryId, req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Lançamento financeiro não encontrado.' });
        }
        const entry = rows[0];

        const product = await stripe.products.create({
            name: `Serviços Jurídicos: ${entry.description}`,
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(parseFloat(entry.value) * 100),
            currency: 'brl',
        });

        const invoice = await stripe.invoices.create({
            customer_email: clientEmail,
            collection_method: 'send_invoice',
            days_until_due: 30,
            auto_advance: true,
        });

        await stripe.invoiceItems.create({
            invoice: invoice.id,
            price: price.id,
        });

        const finalInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.sendInvoice(finalInvoice.id);

        res.status(200).json({ message: 'Fatura enviada para o email do cliente com sucesso!', invoiceUrl: finalInvoice.hosted_invoice_url });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar fatura no Stripe.', error_details: error.toString() });
    }
};

module.exports = {
    getEntriesByProcessId,
    createEntry,
    getFinancialSummary,
    createClientInvoice
};