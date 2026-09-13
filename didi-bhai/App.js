import './global.css';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import RemindersHistoryScreen from './screens/RemindersHistoryScreen';
import GamesScreen from './screens/GamesScreen';
import WaysScreen from './screens/WaysScreen';
import { usePushNotifications } from './src/hooks/usePushNotifications';

function MainAppShell({ children }) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : insets.top;

  return (
    <View
      style={[
        styles.shellRoot,
        {
          paddingTop: topPadding,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar
        style="dark"
        backgroundColor="#FFF9F5"
        translucent
      />
      {children}
    </View>
  );
}

export default function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { id, name, email, role, avatar }
  const [currentScreen, setCurrentScreen] = useState('Home'); // 'Home' | 'Login' | 'Chat' | 'Profile' | 'Ways'
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sync Expo Push Notification token when authenticated
  usePushNotifications(currentUser);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userProfileStr = await AsyncStorage.getItem('user_profile');

      if (token && userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        setCurrentUser(userProfile);
      }
    } catch (err) {
      console.warn('Error reading stored auth credentials:', err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSplashFinish = () => {
    setIsSplashDone(true);
    if (!currentUser) {
      setCurrentScreen('Login');
    } else {
      setCurrentScreen('Home');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_profile');
    } catch (err) {
      console.warn('Error removing token on logout:', err);
    }
    setCurrentUser(null);
    setCurrentScreen('Login');
  };

  const handleNavigateToChat = () => {
    if (!currentUser) {
      setCurrentScreen('Login');
    } else {
      setCurrentScreen('Chat');
    }
  };

  const handleNavigateToProfile = () => {
    if (!currentUser) {
      setCurrentScreen('Login');
    } else {
      setCurrentScreen('Profile');
    }
  };

  const renderContent = () => {
    if (!isSplashDone || checkingAuth) {
      return <SplashScreen onFinish={handleSplashFinish} />;
    }

    if (!currentUser || currentScreen === 'Login') {
      return (
        <LoginScreen
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setCurrentScreen('Home');
          }}
        />
      );
    }

    if (currentScreen === 'Profile') {
      return (
        <ProfileScreen
          currentUser={currentUser}
          onLogout={handleLogout}
          onBack={() => setCurrentScreen('Home')}
        />
      );
    }

    if (currentScreen === 'Chat') {
      return (
        <ChatScreen
          currentUser={currentUser}
          onBack={() => setCurrentScreen('Home')}
        />
      );
    }

    if (currentScreen === 'Reminders') {
      return (
        <RemindersHistoryScreen
          currentUser={currentUser}
          onBack={() => setCurrentScreen('Home')}
        />
      );
    }

    if (currentScreen === 'Games') {
      return (
        <GamesScreen
          currentUser={currentUser}
          socket={null}
          onBack={() => setCurrentScreen('Home')}
        />
      );
    }

    if (currentScreen === 'Ways') {
      return (
        <WaysScreen
          currentUser={currentUser}
          onBack={() => setCurrentScreen('Home')}
        />
      );
    }

    return (
      <HomeScreen
        currentUser={currentUser}
        onNavigateToChat={handleNavigateToChat}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToReminders={() => setCurrentScreen('Reminders')}
        onNavigateToGames={() => setCurrentScreen('Games')}
        onNavigateToWays={() => setCurrentScreen('Ways')}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <SafeAreaProvider>
      <MainAppShell>{renderContent()}</MainAppShell>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shellRoot: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
});
