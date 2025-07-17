const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const verifyToken = require('../middleware/verifyToken');

router.post('/create-checkout-session', verifyToken, subscriptionController.createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleStripeWebhook);

module.exports = router;