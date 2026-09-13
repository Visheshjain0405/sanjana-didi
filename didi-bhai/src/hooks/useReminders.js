import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { fetchRemindersApi, BACKEND_URL } from '../services/api';
import { scheduleClientNotification } from '../services/reminderClient';

export function useReminders(currentUser) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();

    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('joinRoom', 'didi_bhai_private');
    });

    socket.on('reminderCreated', (newReminder) => {
      setReminders((prev) => {
        const exists = prev.some((r) => r._id === newReminder._id);
        if (exists) return prev;
        return [newReminder, ...prev];
      });

      if (newReminder.targetUser === currentUser?.role) {
        scheduleClientNotification(newReminder);
      }
    });

    socket.on('reminderTriggered', (triggeredReminder) => {
      setReminders((prev) =>
        prev.map((r) => (r._id === triggeredReminder._id ? triggeredReminder : r))
      );

      if (triggeredReminder.targetUser === currentUser?.role) {
        scheduleClientNotification(triggeredReminder);
      }
    });

    socket.on('reminderCompleted', (completedReminder) => {
      setReminders((prev) =>
        prev.map((r) => (r._id === completedReminder._id ? completedReminder : r))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  const loadReminders = async () => {
    try {
      const data = await fetchRemindersApi();
      if (Array.isArray(data)) {
        setReminders(data);
      }
    } catch (err) {
      console.warn('Error loading reminders in hook:', err);
    } finally {
      setLoading(false);
    }
  };

  return { reminders, setReminders, loading, refreshReminders: loadReminders };
}
