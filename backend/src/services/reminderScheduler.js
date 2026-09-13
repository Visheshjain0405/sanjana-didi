const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendPushNotification } = require('./notificationService');

function initReminderScheduler(io) {
  console.log('⏰ Initializing node-cron Reminder Scheduler (* * * * *)...');

  // Schedule task to run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Query MongoDB for pending reminders due for trigger
      const dueReminders = await Reminder.find({
        status: 'pending',
        scheduledAt: { $lte: now },
      });

      if (dueReminders.length === 0) return;

      for (const reminder of dueReminders) {
        // Emit Socket.IO event reminderTriggered to room didi_bhai_private
        if (io) {
          io.to('didi_bhai_private').emit('reminderTriggered', reminder);
        }

        // Send push notification if target user has pushToken
        try {
          const recipient = await User.findOne({ role: reminder.targetUser });
          if (recipient && recipient.pushToken) {
            const pushTitle = `📌 Bhai ka Nudge: ${reminder.title}`;
            const pushBody =
              reminder.note || `Didi, yeh kaam jaldi khatam karo! (${reminder.currentTriggerCount + 1}/${reminder.repeatCount})`;

            await sendPushNotification(recipient.pushToken, pushTitle, pushBody, {
              screen: 'reminder',
              reminderId: reminder._id.toString(),
            });
          }
        } catch (pushErr) {
          console.warn(`[Cron Push Error for ${reminder._id}]:`, pushErr.message);
        }

        // Handle Masti Mode repeats
        reminder.currentTriggerCount += 1;

        if (reminder.repeatInterval > 0 && reminder.currentTriggerCount < reminder.repeatCount) {
          // Schedule next repeat trigger time
          reminder.scheduledAt = new Date(Date.now() + reminder.repeatInterval * 60 * 1000);
        } else {
          // Mark as triggered once repeat limit is reached
          reminder.status = 'triggered';
        }

        await reminder.save();
      }
    } catch (err) {
      console.error('[node-cron ReminderScheduler Error]:', err);
    }
  });
}

module.exports = { initReminderScheduler };
