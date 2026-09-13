const Message = require('../models/Message');
const User = require('../models/User');
const { sendPushNotification } = require('../services/notificationService');

let ioInstance = null;

module.exports = function (io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log('Socket Connected:', socket.id);

    socket.on('joinRoom', (roomId = 'didi_bhai_private') => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('sendMessage', async (data) => {
      const { roomId = 'didi_bhai_private', sender, text } = data;
      if (!sender || !text) return;

      const newMsgData = {
        roomId,
        sender,
        text,
        createdAt: new Date(),
      };

      let savedMessage = {
        _id: Date.now().toString(),
        ...newMsgData,
      };

      try {
        const msgDoc = new Message(newMsgData);
        savedMessage = await msgDoc.save();
      } catch (err) {
        console.error('Error saving message to MongoDB:', err);
      }

      // Broadcast message to room via Socket.IO
      io.to(roomId).emit('receiveMessage', savedMessage);

      // Trigger Push Notification to recipient device
      try {
        const recipientRole = sender === 'bhai' ? 'didi' : 'bhai';
        const recipient = await User.findOne({ role: recipientRole });

        if (recipient && recipient.pushToken) {
          const title = `New message from ${sender === 'bhai' ? 'Bhai 👦' : 'Sanjana Didi 👸'}`;
          await sendPushNotification(recipient.pushToken, title, text, { screen: 'chat' });
        }
      } catch (pushErr) {
        console.error('Error sending push notification trigger:', pushErr);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket Disconnected:', socket.id);
    });
  });
};

module.exports.getIO = function () {
  return ioInstance;
};
