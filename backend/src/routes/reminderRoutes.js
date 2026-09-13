const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.post('/reminders', reminderController.createReminder);
router.get('/reminders', reminderController.getReminders);
router.patch('/reminders/:id/complete', reminderController.completeReminder);

module.exports = router;
