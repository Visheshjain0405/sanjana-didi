import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../../src/services/api';

const SIBLING_TRUTHS = [
  'What is the most embarrassing thing you did in front of relatives?',
  'Who is Mom & Dad’s real favorite child?',
  'What is one secret you hid from me during school?',
  'Which childhood memory makes you laugh out loud every single time?',
  'If you had to trade me for a pet, which animal would you choose?',
  'What is one habit of mine that secretly annoys you the most?',
];

const SIBLING_DARES = [
  'Send an embarrassing selfie right now or upload proof photo!',
  'Do 10 jumping jacks while chanting "Didi is always right"!',
  'Mimic Mom yelling at us when we were kids!',
  'Sing the chorus of your favorite Bollywood song out loud!',
  'Make the funniest face you can and take a photo proof!',
  'Type a 1-line sweet compliment about your sibling without laughing!',
];

export default function TruthOrDareGame({ socket: socketProp, currentUser, onBack }) {
  const insets = useSafeAreaInsets();
  const role = (currentUser?.role || 'bhai').toLowerCase(); // 'didi' or 'bhai'

  const [socket, setSocket] = useState(socketProp);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [currentChallenger, setCurrentChallenger] = useState('didi');
  const [scores, setScores] = useState({ didi: 0, bhai: 0 });

  // Creation Form State
  const [challengeMode, setChallengeMode] = useState('truth'); // 'truth' or 'dare'
  const [challengeText, setChallengeText] = useState('');

  // Proof Submission State
  const [proofText, setProofText] = useState('');
  const [proofImageUri, setProofImageUri] = useState('');

  useEffect(() => {
    let activeSocket = socketProp || socket;
    if (!activeSocket) {
      activeSocket = io(BACKEND_URL, {
        transports: ['websocket'],
      });
      setSocket(activeSocket);
    }

    if (!activeSocket) return;

    activeSocket.emit('tod_join');

    const handleStateUpdate = (data) => {
      if (data.activeChallenge) setActiveChallenge(data.activeChallenge);
      if (data.currentChallenger) setCurrentChallenger(data.currentChallenger);
      if (data.scores) setScores(data.scores);
    };

    const handleNewChallenge = (data) => {
      setActiveChallenge(data.activeChallenge);
      if (data.currentChallenger) setCurrentChallenger(data.currentChallenger);
      setProofText('');
      setProofImageUri('');
    };

    const handleProofSubmitted = (data) => {
      setActiveChallenge(data.activeChallenge);
    };

    const handleVerdictAnnounced = (data) => {
      setActiveChallenge(data.activeChallenge);
      if (data.currentChallenger) setCurrentChallenger(data.currentChallenger);
      if (data.scores) setScores(data.scores);
    };

    activeSocket.on('tod_state_update', handleStateUpdate);
    activeSocket.on('tod_new_challenge', handleNewChallenge);
    activeSocket.on('tod_proof_submitted', handleProofSubmitted);
    activeSocket.on('tod_verdict_announced', handleVerdictAnnounced);

    return () => {
      if (activeSocket) {
        activeSocket.off('tod_state_update', handleStateUpdate);
        activeSocket.off('tod_new_challenge', handleNewChallenge);
        activeSocket.off('tod_proof_submitted', handleProofSubmitted);
        activeSocket.off('tod_verdict_announced', handleVerdictAnnounced);
        if (!socketProp) {
          activeSocket.disconnect();
        }
      }
    };
  }, [socketProp]);

  const handlePickRandomPreset = () => {
    const list = challengeMode === 'truth' ? SIBLING_TRUTHS : SIBLING_DARES;
    const randomItem = list[Math.floor(Math.random() * list.length)];
    setChallengeText(randomItem);
  };

  const handlePickImage = async () => {
    try {
      let ImagePicker = null;
      try {
        ImagePicker = require('expo-image-picker');
      } catch (e) {
        // Safe fallback
      }

      if (!ImagePicker || typeof ImagePicker.requestMediaLibraryPermissionsAsync !== 'function') {
        Alert.alert(
          'Photo Upload Notice',
          'Gallery photo picker native module is not compiled in this build. You can write text proof directly!'
        );
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow gallery access to upload dare proof photo!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProofImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error picking image:', err);
    }
  };

  const handleSendChallenge = () => {
    if (!challengeText.trim()) {
      Alert.alert('Missing Task', 'Please enter a truth question or dare task!');
      return;
    }

    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('tod_send_challenge', {
        creator: role,
        mode: challengeMode,
        text: challengeText.trim(),
      });
      setChallengeText('');
    }
  };

  const handleSubmitProof = () => {
    if (!proofText.trim() && !proofImageUri) {
      Alert.alert('Missing Proof', 'Please write a text response or attach a photo proof!');
      return;
    }

    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('tod_submit_proof', {
        user: role,
        proofText: proofText.trim(),
        proofImageUri,
      });
    }
  };

  const handleJudgeVerdict = (accepted) => {
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('tod_judge_verdict', {
        user: role,
        accepted,
      });
    }
  };

  const handleResetMatch = () => {
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('tod_reset_match');
    }
  };

  const isMyTurnToChallenge = !activeChallenge || activeChallenge.status === 'accepted' || activeChallenge.status === 'rejected';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF9F4', '#FDF3E7', '#FFF9F4']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Truth or Dare 🔥🤫</Text>
          <Text style={styles.headerSubtitle}>Masti & Sibling Secrets</Text>
        </View>
        <TouchableOpacity onPress={handleResetMatch} activeOpacity={0.7} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={20} color="#B45309" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Scoreboard */}
          <View style={styles.scoreboardContainer}>
            <View style={[styles.playerCard, role === 'didi' && styles.myPlayerCard]}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>👸</Text>
              </View>
              <Text style={styles.playerName}>Sanjana Didi</Text>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{scores.didi} Pts</Text>
              </View>
            </View>

            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={[styles.playerCard, role === 'bhai' && styles.myPlayerCard]}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>👦</Text>
              </View>
              <Text style={styles.playerName}>Vishesh Bhai</Text>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{scores.bhai} Pts</Text>
              </View>
            </View>
          </View>

          {/* CHALLENGER FORM */}
          {isMyTurnToChallenge ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create Sibling Challenge 😈</Text>
              <Text style={styles.cardSub}>Select Truth or Dare, then write or pick a task for your sibling!</Text>

              {/* Mode Switcher */}
              <View style={styles.modeRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.modeTab, challengeMode === 'truth' && styles.activeTruthTab]}
                  onPress={() => setChallengeMode('truth')}
                >
                  <Ionicons name="heart" size={16} color={challengeMode === 'truth' ? '#FFF' : '#B45309'} style={{ marginRight: 6 }} />
                  <Text style={[styles.modeTabText, challengeMode === 'truth' && styles.activeModeTabText]}>Truth 😇</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.modeTab, challengeMode === 'dare' && styles.activeDareTab]}
                  onPress={() => setChallengeMode('dare')}
                >
                  <Ionicons name="flame" size={16} color={challengeMode === 'dare' ? '#FFF' : '#B45309'} style={{ marginRight: 6 }} />
                  <Text style={[styles.modeTabText, challengeMode === 'dare' && styles.activeModeTabText]}>Dare 😈</Text>
                </TouchableOpacity>
              </View>

              {/* Random Preset Generator Button */}
              <TouchableOpacity activeOpacity={0.8} style={styles.randomPresetBtn} onPress={handlePickRandomPreset}>
                <Ionicons name="dice-outline" size={16} color="#B45309" style={{ marginRight: 6 }} />
                <Text style={styles.randomPresetText}>Generate Random Sibling {challengeMode.toUpperCase()}</Text>
              </TouchableOpacity>

              {/* Task Text Area */}
              <Text style={styles.inputLabel}>Challenge Question / Task:</Text>
              <TextInput
                style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
                placeholder={`Enter your ${challengeMode} task...`}
                placeholderTextColor="#A88B8B"
                multiline
                value={challengeText}
                onChangeText={setChallengeText}
              />

              <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={handleSendChallenge}>
                <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Send Challenge To Sibling 🚀</Text>
              </TouchableOpacity>
            </View>
          ) : activeChallenge.status === 'pending' ? (
            /* RECEIVER INCOMING CHALLENGE OR WAITING */
            activeChallenge.receiver === role ? (
              <View style={styles.card}>
                <View style={styles.taskTypeBadge}>
                  <Text style={styles.taskTypeBadgeText}>
                    {activeChallenge.mode === 'truth' ? '😇 TRUTH QUESTION' : '😈 DARE TASK'}
                  </Text>
                </View>

                <Text style={styles.incomingTitle}>
                  {activeChallenge.creator === 'didi' ? 'Sanjana Didi 👸' : 'Vishesh Bhai 👦'} Challenged You!
                </Text>

                <View style={styles.promptCard}>
                  <Text style={styles.promptText}>"{activeChallenge.text}"</Text>
                </View>

                {/* Proof Response Inputs */}
                <Text style={styles.inputLabel}>Your Response / Answer:</Text>
                <TextInput
                  style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Write your secret truth answer or dare response..."
                  placeholderTextColor="#A88B8B"
                  multiline
                  value={proofText}
                  onChangeText={setProofText}
                />

                {/* Optional Photo Upload */}
                <Text style={styles.inputLabel}>Optional Photo Proof (For Dares):</Text>
                <TouchableOpacity activeOpacity={0.8} style={styles.imagePickBtn} onPress={handlePickImage}>
                  {proofImageUri ? (
                    <Image source={{ uri: proofImageUri }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={24} color="#B45309" />
                      <Text style={styles.imagePlaceholderText}>Upload photo proof (Optional)</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={handleSubmitProof}>
                  <Ionicons name="checkmark-done" size={20} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>Submit Proof & Complete (+10 Pts) ✅</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                <ActivityIndicator size="large" color="#B45309" style={{ marginVertical: 16 }} />
                <Text style={styles.waitingTitle}>Challenge Sent! 🚀</Text>
                <Text style={styles.waitingSub}>
                  Waiting for {activeChallenge.receiver === 'didi' ? 'Sanjana Didi 👸' : 'Vishesh Bhai 👦'} to respond to your {activeChallenge.mode}...
                </Text>
              </View>
            )
          ) : activeChallenge.status === 'submitted' ? (
            /* REVIEW & JUDGING MODE */
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Review Sibling Proof 🕵️</Text>
              <Text style={styles.cardSub}>
                {activeChallenge.receiver === 'didi' ? 'Sanjana Didi 👸' : 'Vishesh Bhai 👦'} submitted proof for your {activeChallenge.mode}!
              </Text>

              <View style={styles.promptCard}>
                <Text style={styles.promptText}>Task: "{activeChallenge.text}"</Text>
              </View>

              {activeChallenge.proofText ? (
                <View style={styles.responseBox}>
                  <Text style={styles.responseLabel}>Response:</Text>
                  <Text style={styles.responseText}>"{activeChallenge.proofText}"</Text>
                </View>
              ) : null}

              {activeChallenge.proofImageUri ? (
                <Image source={{ uri: activeChallenge.proofImageUri }} style={styles.proofImage} resizeMode="cover" />
              ) : null}

              {activeChallenge.creator === role ? (
                <View style={styles.judgeActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.judgeBtn, styles.acceptBtn]}
                    onPress={() => handleJudgeVerdict(true)}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.judgeBtnText}>Accept (+10 Pts) ✅</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.judgeBtn, styles.rejectBtn]}
                    onPress={() => handleJudgeVerdict(false)}
                  >
                    <Ionicons name="close-circle" size={18} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.judgeBtnText}>Chickened Out 🐔</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.waitingBox}>
                  <ActivityIndicator size="small" color="#B45309" style={{ marginBottom: 6 }} />
                  <Text style={styles.waitingText}>
                    Waiting for {activeChallenge.creator === 'didi' ? 'Sanjana Didi 👸' : 'Vishesh Bhai 👦'} to verify your proof...
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F6E4DA',
    backgroundColor: '#FFFDFB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2A1B1C',
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 1,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#FDF3E7',
    borderWidth: 1,
    borderColor: '#F5D7B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  scoreboardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  playerCard: {
    flex: 1,
    backgroundColor: '#FFFDFB',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  myPlayerCard: {
    borderColor: '#B45309',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FDF3E7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5D7B5',
    marginBottom: 6,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2A1B1C',
    marginBottom: 4,
    textAlign: 'center',
  },
  scorePill: {
    backgroundColor: '#B45309',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  vsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  vsText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    padding: 20,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A1B1C',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginBottom: 16,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F5',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTruthTab: {
    backgroundColor: '#2563EB',
  },
  activeDareTab: {
    backgroundColor: '#DE5462',
  },
  modeTabText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#5C4040',
  },
  activeModeTabText: {
    color: '#FFFFFF',
  },
  randomPresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF3E7',
    borderWidth: 1,
    borderColor: '#F5D7B5',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  randomPresetText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#5C4040',
    marginBottom: 6,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: '#FFF9F4',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2A1B1C',
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#B45309',
    height: 48,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  taskTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF3E7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F5D7B5',
    marginBottom: 8,
  },
  taskTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  incomingTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2A1B1C',
    marginBottom: 12,
  },
  promptCard: {
    backgroundColor: '#FFF8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    padding: 16,
    marginBottom: 14,
  },
  promptText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2A1B1C',
    lineHeight: 20,
  },
  imagePickBtn: {
    height: 140,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F5D7B5',
    borderStyle: 'dashed',
    backgroundColor: '#FDF3E7',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 6,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A1B1C',
    textAlign: 'center',
  },
  waitingSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E6E6E',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  responseBox: {
    backgroundColor: '#EEF7F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDEBD7',
    padding: 14,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 2,
  },
  responseText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2A1B1C',
  },
  proofImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 14,
  },
  judgeActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  judgeBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: '#15803D',
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  judgeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  waitingBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  waitingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C4040',
  },
});
