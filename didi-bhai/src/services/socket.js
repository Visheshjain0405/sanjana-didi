import { io } from 'socket.io-client';
import { BACKEND_URL } from './api';

const SERVER_URL = process.env.EXPO_PUBLIC_BACKEND_URL || BACKEND_URL;

export const createSocket = () => {
  return io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
  });
};

export default createSocket;
