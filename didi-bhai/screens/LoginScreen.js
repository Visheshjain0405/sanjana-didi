import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi } from '../src/services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginApi({
        email: email.trim(),
        password: password.trim(),
      });

      setLoading(false);

      if (data && data.token && data.user) {
        await AsyncStorage.setItem('user_token', data.token);
        await AsyncStorage.setItem('user_profile', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        Alert.alert('Login Failed', 'Invalid credentials received.');
      }
    } catch (err) {
      setLoading(false);
      const errorMsg =
        err.response?.data?.error || err.message || 'Unable to connect to auth server.';
      Alert.alert('Access Denied', errorMsg);
    }
  };

  const fillDemoCreds = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FFF9F4', '#FDEBEA', '#F9D1D5']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Logo / Header */}
            <View style={styles.headerBox}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../assets/sister_illustration.jpg')}
                  style={styles.logoImg}
                />
              </View>
              <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
              <Text style={styles.welcomeSub}>
                Please sign in to read your smiles ❤️
              </Text>
            </View>

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputFieldWrap}>
                <Ionicons name="mail-outline" size={20} color="#8E6E6E" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="sanjana@gmail.com"
                  placeholderTextColor="#A88B8B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputFieldWrap}>
                <Ionicons name="lock-closed-outline" size={20} color="#8E6E6E" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#A88B8B"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#8E6E6E"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              style={styles.signInBtn}
              disabled={loading}
            >
              <LinearGradient
                colors={['#E05263', '#C94F5B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.signInText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF9F4',
  },
  safeArea: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 26,
    marginTop: 10,
  },
  logoWrap: {
    width: 90,
    height: 95,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFDFB',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2A1B1C',
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 4,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#5C4040',
    marginBottom: 6,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  inputFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#2A1B1C',
  },
  eyeBtn: {
    padding: 6,
  },
  signInBtn: {
    width: '100%',
    borderRadius: 22,
    marginTop: 8,
    marginBottom: 26,
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signInGradient: {
    height: 52,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  demoCard: {
    width: '100%',
    backgroundColor: '#FFFDFB',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1.5,
  },
  demoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C4040',
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoPill: {
    flex: 1,
    backgroundColor: '#FFF5F6',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  demoPillRole: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DE5462',
  },
  demoPillSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 2,
  },
});
