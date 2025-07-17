const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const verifyToken = require('../middleware/verifyToken');

router.get('/summary', verifyToken, financialController.getFinancialSummary);
router.post('/process/:processId', verifyToken, financialController.createEntry);
router.get('/process/:processId', verifyToken, financialController.getEntriesByProcessId);

module.exports = router;