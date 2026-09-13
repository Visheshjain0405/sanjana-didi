import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { fetchMessages as getMessagesService, BACKEND_URL } from '../src/services/api';
import Constants from 'expo-constants';
import DidiReminderBanner from '../components/DidiReminderBanner';
import { useReminders } from '../src/hooks/useReminders';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // Ignore
}

const QUICK_REACTIONS = ['☕', '❤️', '😂', '🥊', '👀'];

export default function ChatScreen({ currentUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const { reminders, setReminders } = useReminders(currentUser);

  // Recipient details depending on logged in user
  const isCurrentUserDidi = currentUser?.role === 'didi';
  const recipientName = isCurrentUserDidi ? 'Bhai' : 'Sanjana Didi';
  const recipientAvatar = isCurrentUserDidi ? '👦' : '👸';

  useEffect(() => {
    // 1. Fetch initial message history from backend using API service
    loadInitialMessages();

    // 2. Initialize Socket.IO connection on port 5002
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Chat Socket Server on port 5002');
      socket.emit('joinRoom', 'didi_bhai_private');
    });

    socket.on('receiveMessage', (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();

      // Trigger instant in-app drop-down notification banner with sound if message is from the other person
      if (newMsg.sender !== currentUser?.role && Notifications) {
        try {
          Notifications.scheduleNotificationAsync({
            content: {
              title: newMsg.sender === 'didi' ? '👸 Sanjana Didi' : '👦 Bhai',
              body: newMsg.text,
              sound: 'default',
              data: { messageId: newMsg._id },
            },
            trigger: null, // show drop-down banner immediately
          });
        } catch (err) {
          console.warn('Local notification trigger notice:', err.message);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadInitialMessages = async () => {
    try {
      const data = await getMessagesService();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.warn('Error fetching messages from server, using local fallback', err);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const msgPayload = {
      roomId: 'didi_bhai_private',
      sender: currentUser?.role || 'bhai',
      text: textToSend.trim(),
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', msgPayload);
    } else {
      // Local optimistic fallback if socket disconnected
      const fallbackMsg = {
        _id: Date.now().toString(),
        ...msgPayload,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      scrollToBottom();
    }

    setInputText('');
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.sender === currentUser?.role;

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        {!isMe && (
          <View style={styles.avatarMiniWrap}>
            <Text style={styles.avatarMiniEmoji}>{recipientAvatar}</Text>
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isMe ? styles.myBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myText : styles.otherText,
            ]}
          >
            {item.text}
          </Text>

          <View style={styles.timeRow}>
            <Text
              style={[
                styles.timeText,
                isMe ? styles.myTime : styles.otherTime,
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
            {isMe && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color="#FFE4E6"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FFF9F4', '#FDEBEA', '#FFF9F4']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
          </TouchableOpacity>

          <View style={styles.headerProfileRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarHeaderCircle}>
                <Text style={{ fontSize: 22 }}>{recipientAvatar}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.headerTitleCol}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerName}>{recipientName}</Text>
                <Ionicons name="heart" size={14} color="#DE5462" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.headerStatus}>Online • Ready for bakchodi ☕</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
            <Feather name="more-vertical" size={20} color="#5C4040" />
          </TouchableOpacity>
        </View>

        {/* Message Stream */}
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Active Reminder Banner in Chat Screen */}
          <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
            <DidiReminderBanner
              reminders={reminders}
              onReminderCompleted={(completed) => {
                setReminders((prev) =>
                  prev.map((r) => (r._id === completed._id ? completed : r))
                );
              }}
            />
          </View>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#DE5462" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Quick Emoji Reaction Bar */}
          <View style={styles.reactionBar}>
            {QUICK_REACTIONS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={styles.reactionPill}
                onPress={() => handleSend(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Message ${recipientName}...`}
              placeholderTextColor="#A88B8B"
              multiline
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSend()}
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? '#DE5462' : '#F9C2C8' },
              ]}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F6E4DA',
    backgroundColor: '#FFFDFB',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarHeaderCircle: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#FDEEEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F9D1D5',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTitleCol: {
    marginLeft: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A1B1C',
  },
  headerStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarMiniWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  avatarMiniEmoji: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  myBubble: {
    backgroundColor: '#DE5462',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  myText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#2A1B1C',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  myTime: {
    color: '#FDECE7',
  },
  otherTime: {
    color: '#8E6E6E',
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFDFB',
    borderTopWidth: 1,
    borderTopColor: '#F6E4DA',
  },
  reactionPill: {
    backgroundColor: '#FDEEEF',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFDFB',
    borderTopWidth: 1,
    borderTopColor: '#F6E4DA',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: '#2A1B1C',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
