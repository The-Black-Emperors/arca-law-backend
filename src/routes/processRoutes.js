const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, processController.getAllProcesses);
router.post('/', verifyToken, processController.createProcess);
router.get('/:id', verifyToken, processController.getProcessById);
router.delete('/:id', verifyToken, processController.deleteProcess);
router.put('/:id', verifyToken, processController.updateProcess);
router.post('/:id/check-updates', verifyToken, processController.checkProcessUpdates);

module.exports = router;