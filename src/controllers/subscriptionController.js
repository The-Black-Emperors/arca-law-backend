const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const db = require('../database/db');

const createCheckoutSession = async (req, res) => {
    const { priceId } = req.body;
    const userId = req.user.id;
    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card', 'boleto'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.CLIENT_URL}/?subscription_success=true`,
            cancel_url: `${process.env.CLIENT_URL}/billing.html`,
            client_reference_id: userId
        });
        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar sessão de checkout.', error_details: error.toString() });
    }
};

const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const stripeCustomerId = session.customer;
        const subscriptionId = session.subscription;

        if (!userId) {
            return res.status(400).send('Webhook Error: Missing userId in session metadata.');
        }

        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const planType = (subscription.items.data[0].price.recurring.interval === 'month') ? 'monthly' : 'yearly';
            const endsAt = new Date(subscription.current_period_end * 1000);
            const queryText = `
                UPDATE users 
                SET stripe_customer_id = $1, subscription_status = 'active', plan_type = $2, subscription_ends_at = $3
                WHERE id = $4
            `;
            await db.query(queryText, [stripeCustomerId, planType, endsAt, userId]);
        } catch (dbError) {
            console.error("Erro ao atualizar usuário no banco de dados via webhook:", dbError);
        }
    }
    
    res.status(200).json({ received: true });
};

module.exports = {
    createCheckoutSession,
    handleStripeWebhook
};