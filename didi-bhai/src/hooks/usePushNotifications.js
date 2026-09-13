import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from '../services/api';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Only load expo-notifications if not running inside Expo Go store client
let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    // Ignore
  }
}

export function usePushNotifications(currentUser) {
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    if (isExpoGo || !Notifications) {
      console.log('[PushNotification] Running in Expo Go: Remote Push Notifications are disabled by Expo SDK 53+. Dynamic sockets remain 100% active.');
      return;
    }

    // Request permission on startup
    requestNotificationPermissionAsync().then((granted) => {
      console.log('[PushNotification] Permission result:', granted);
      if (granted && currentUser && currentUser.id) {
        getPushTokenAsync().then((token) => {
          if (token) {
            api
              .post('/api/auth/push-token', {
                userId: currentUser.id,
                pushToken: token,
              })
              .then((res) => {
                console.log('Push token synced:', res.data);
              })
              .catch((err) => {
                console.warn('Failed to sync push token:', err);
              });
          }
        });
      }
    });

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Foreground notification:', notification);
        }
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log('Notification tapped:', response);
        }
      );
    } catch (e) {
      // Ignore listener attach errors
    }

    return () => {
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (e) {
        // Ignore
      }
    };
  }, [currentUser]);
}

async function requestNotificationPermissionAsync() {
  if (!Notifications) return false;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('chat-messages', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FB7185',
      });
    } catch (e) {
      console.warn('Notification channel error:', e.message);
    }
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    console.log('Notification permission status:', finalStatus);
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permissions:', err);
    return false;
  }
}

async function getPushTokenAsync() {
  if (!Notifications || isExpoGo) {
    return null;
  }
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData?.data || null;
  } catch (error) {
    console.log('[Push] Bypassed remote token generation until google-services.json is added');
    return null;
  }
}
