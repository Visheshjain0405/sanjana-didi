import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set your Wi-Fi IP address here for physical Android device testing over LAN
// e.g. 'http://192.168.0.187:5002' or fallback to 'http://10.0.2.2:5002'
export const LOCAL_WIFI_IP = '192.168.0.187';

export const BACKEND_URL = Platform.select({
  android: `http://${LOCAL_WIFI_IP}:5002`,
  ios: 'http://localhost:5002',
  default: `http://${LOCAL_WIFI_IP}:5002`,
});

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Error fetching token from storage:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const loginApi = async ({ email, password }) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  } catch (err) {
    // If local Wi-Fi IP fails on emulator, fallback attempt to 10.0.2.2 / localhost
    if (err.message && err.message.includes('Network Error')) {
      console.warn('Network Error on Wi-Fi IP, trying fallback 10.0.2.2...');
      const fallbackRes = await axios.post(`http://10.0.2.2:5002/api/auth/login`, {
        email,
        password,
      });
      return fallbackRes.data;
    }
    throw err;
  }
};

export const fetchMessages = async () => {
  try {
    const response = await api.get('/api/messages');
    return response.data;
  } catch (err) {
    if (err.message && err.message.includes('Network Error')) {
      const fallbackRes = await axios.get(`http://10.0.2.2:5002/api/messages`);
      return fallbackRes.data;
    }
    throw err;
  }
};

export const createReminderApi = async (reminderData) => {
  try {
    const response = await api.post('/api/reminders', reminderData);
    return response.data;
  } catch (err) {
    if (err.message && err.message.includes('Network Error')) {
      const fallbackRes = await axios.post(`http://10.0.2.2:5002/api/reminders`, reminderData);
      return fallbackRes.data;
    }
    throw err;
  }
};

export const fetchRemindersApi = async () => {
  try {
    const response = await api.get('/api/reminders');
    return response.data;
  } catch (err) {
    if (err.message && err.message.includes('Network Error')) {
      const fallbackRes = await axios.get(`http://10.0.2.2:5002/api/reminders`);
      return fallbackRes.data;
    }
    throw err;
  }
};

export const completeReminderApi = async (id) => {
  try {
    const response = await api.patch(`/api/reminders/${id}/complete`);
    return response.data;
  } catch (err) {
    if (err.message && err.message.includes('Network Error')) {
      const fallbackRes = await axios.patch(`http://10.0.2.2:5002/api/reminders/${id}/complete`);
      return fallbackRes.data;
    }
    throw err;
  }
};
