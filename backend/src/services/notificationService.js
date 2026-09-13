const { Expo } = require('expo-server-sdk');

const expo = new Expo();

/**
 * Sends a push notification via Expo Push Notification API.
 */
async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`Push token ${pushToken} is not a valid Expo push token.`);
    return;
  }

  const messages = [
    {
      to: pushToken,
      sound: 'default',
      priority: 'high',
      channelId: 'chat-messages',
      title,
      body,
      data,
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push notification tickets sent:', ticketChunk);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

module.exports = {
  sendPushNotification,
};
