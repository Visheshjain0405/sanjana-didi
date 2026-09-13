const Message = require('../models/Message');

let memoryMessages = [
  {
    _id: 'm1',
    roomId: 'didi_bhai_private',
    sender: 'didi',
    text: 'Arey Bhai! Aaj chai kaun bana raha hai? ☕',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'm2',
    roomId: 'didi_bhai_private',
    sender: 'bhai',
    text: 'Tumhare haath ki chai ka baat hi alag hai Didi! Main biscuit la raha hu 🍪',
    createdAt: new Date(Date.now() - 3000000).toISOString(),
  },
];

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ roomId: 'didi_bhai_private' })
      .sort({ createdAt: 1 })
      .limit(100);

    if (messages && messages.length > 0) {
      return res.json(messages);
    } else {
      return res.json(memoryMessages);
    }
  } catch (err) {
    console.error('Fetch Messages Error:', err);
    return res.json(memoryMessages);
  }
};
