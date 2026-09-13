import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // Ignore in environments where expo-notifications is unavailable
}

export function scheduleClientNotification(reminder) {
  if (!Notifications || !reminder) return;

  try {
    const triggerDate = reminder.scheduledAt ? new Date(reminder.scheduledAt) : null;
    const now = new Date();
    const trigger = triggerDate && triggerDate > now ? triggerDate : null;

    Notifications.scheduleNotificationAsync({
      content: {
        title: `📌 Bhai ka Nudge: ${reminder.title}`,
        body: reminder.note || `Didi, yeh kaam jaldi khatam karo!`,
        sound: 'default',
        data: { reminderId: reminder._id },
      },
      trigger,
    });
  } catch (err) {
    console.warn('[reminderClient] Error scheduling local notification:', err.message);
  }
}
