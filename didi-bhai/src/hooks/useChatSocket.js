import { useState, useEffect, useCallback } from 'react';
import { INITIAL_MESSAGES, DIDI_AUTO_RESPONSES } from '../data/mockMessages';

export function useChatSocket(roomName = 'didi_bhai_private') {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'bhai',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };

    setMessages((prev) => [...prev, newMsg]);

    // Simulate Didi typing indicator & auto-reply
    setTimeout(() => {
      setIsTyping(true);
    }, 400);

    setTimeout(() => {
      setIsTyping(false);
      const randomResponse =
        DIDI_AUTO_RESPONSES[Math.floor(Math.random() * DIDI_AUTO_RESPONSES.length)];

      const didiReply = {
        id: (Date.now() + 1).toString(),
        sender: 'didi',
        text: randomResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'read' } : m)).concat(didiReply)
      );
    }, 1400);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    roomName,
  };
}
