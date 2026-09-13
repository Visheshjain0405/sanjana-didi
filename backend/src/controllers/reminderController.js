const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendPushNotification } = require('../services/notificationService');
const { getIO } = require('../sockets/chatSocket');

// POST /api/reminders
exports.createReminder = async (req, res) => {
  try {
    const { title, note, scheduledAt, repeatInterval, repeatCount, createdBy, targetUser } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title / Task name is required.' });
    }

    const reminder = new Reminder({
      title: title.trim(),
      note: note ? note.trim() : '',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      repeatInterval: typeof repeatInterval === 'number' ? repeatInterval : 0,
      repeatCount: typeof repeatCount === 'number' ? repeatCount : 1,
      currentTriggerCount: 0,
      status: 'pending',
      createdBy: createdBy || 'bhai',
      targetUser: targetUser || 'didi',
    });

    const savedReminder = await reminder.save();

    // Broadcast via Socket.IO
    const io = getIO();
    if (io) {
      io.to('didi_bhai_private').emit('reminderCreated', savedReminder);
    }

    // Trigger initial push notification to target user
    try {
      const recipient = await User.findOne({ role: savedReminder.targetUser });
      if (recipient && recipient.pushToken) {
        const pushTitle = `📌 Bhai ka Nudge: ${savedReminder.title}`;
        const pushBody = savedReminder.note || 'Didi, yeh kaam jaldi khatam karo!';

        await sendPushNotification(recipient.pushToken, pushTitle, pushBody, {
          screen: 'reminder',
          reminderId: savedReminder._id.toString(),
        });
      }
    } catch (pushErr) {
      console.warn('Reminder push notification notice:', pushErr.message);
    }

    return res.status(201).json(savedReminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    return res.status(500).json({ error: 'Failed to create reminder.' });
  }
};

// GET /api/reminders
exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({
      status: { $in: ['pending', 'triggered'] },
    }).sort({ scheduledAt: 1 });
    return res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return res.status(500).json({ error: 'Failed to fetch reminders.' });
  }
};

// PATCH /api/reminders/:id/complete
exports.completeReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedReminder = await Reminder.findByIdAndUpdate(
      id,
      { status: 'completed' },
      { new: true }
    );

    if (!updatedReminder) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }

    // Broadcast via Socket.IO to alert Bhai and dismiss Didi's banner
    const io = getIO();
    if (io) {
      io.to('didi_bhai_private').emit('reminderCompleted', updatedReminder);
    }

    return res.json(updatedReminder);
  } catch (error) {
    console.error('Error completing reminder:', error);
    return res.status(500).json({ error: 'Failed to complete reminder.' });
  }
};
