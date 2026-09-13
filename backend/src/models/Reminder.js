const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    repeatInterval: {
      type: Number,
      default: 0, // In minutes. 0 = One-time, 2, 5, 15, 60
    },
    repeatCount: {
      type: Number,
      default: 1, // Total occurrences
    },
    currentTriggerCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'triggered', 'completed', 'dismissed'],
      default: 'pending',
    },
    createdBy: {
      type: String,
      default: 'bhai',
    },
    targetUser: {
      type: String,
      default: 'didi',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reminder', reminderSchema);
