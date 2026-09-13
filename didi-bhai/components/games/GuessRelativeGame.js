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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../../src/services/api';

export default function GuessRelativeGame({ socket: socketProp, currentUser, onBack }) {
  const insets = useSafeAreaInsets();
  const role = (currentUser?.role || 'bhai').toLowerCase(); // 'didi' or 'bhai'
  const opponentRole = role === 'didi' ? 'bhai' : 'didi';

  const [socket, setSocket] = useState(socketProp);
  const [phase, setPhase] = useState('setup'); // 'setup' | 'waiting' | 'guessing' | 'ended'

  // Phase 1 (Setup) State
  const [personName, setPersonName] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [hints, setHints] = useState(['', '', '']); // Start with 3 empty hints, expandable up to 7
  const [setupTimeLeft, setSetupTimeLeft] = useState(60);
  const [hasSubmittedSetup, setHasSubmittedSetup] = useState(false);

  // Phase 3 (Guessing) State
  const [myChallenge, setMyChallenge] = useState(null); // { imageUri, hints }
  const [unlockedHintCount, setUnlockedHintCount] = useState(1);
  const [blurRadius, setBlurRadius] = useState(25);
  const [guessInput, setGuessInput] = useState('');
  const [wrongGuesses, setWrongGuesses] = useState([]);

  // Phase 4 (Result) State
  const [winner, setWinner] = useState(null);
  const [winningRelative, setWinningRelative] = useState('');

  useEffect(() => {
    let activeSocket = socketProp || socket;
    if (!activeSocket) {
      activeSocket = io(BACKEND_URL, {
        transports: ['websocket'],
      });
      setSocket(activeSocket);
    }

    if (!activeSocket) return;

    activeSocket.emit('relative_game_join');

    const handleStateUpdate = (data) => {
      if (data.phase) setPhase(data.phase);
      if (data.challenges && data.challenges[role]) {
        setMyChallenge(data.challenges[role]);
      }
      if (data.winner) setWinner(data.winner);
      if (data.winningRelative) setWinningRelative(data.winningRelative);
    };

    const handlePlayerSubmitted = (data) => {
      if (data.submittedUser === role) {
        setHasSubmittedSetup(true);
      }
      setPhase('waiting');
    };

    const handleStartGuessing = (data) => {
      setPhase('guessing');
      if (data.challenges && data.challenges[role]) {
        setMyChallenge(data.challenges[role]);
      }
      setUnlockedHintCount(1);
      setBlurRadius(25);
      setWrongGuesses([]);
    };

    const handleGuessWrong = (data) => {
      if (data.guessEntry) {
        setWrongGuesses((prev) => [...prev, data.guessEntry]);
      }
    };

    const handleGameWon = (data) => {
      setPhase('ended');
      setWinner(data.winner);
      setWinningRelative(data.winningRelative);
      setBlurRadius(0);
    };

    const handleResetDone = () => {
      setPhase('setup');
      setPersonName('');
      setImageUri('');
      setHints(['', '', '']);
      setSetupTimeLeft(60);
      setHasSubmittedSetup(false);
      setMyChallenge(null);
      setUnlockedHintCount(1);
      setBlurRadius(25);
      setGuessInput('');
      setWrongGuesses([]);
      setWinner(null);
      setWinningRelative('');
    };

    activeSocket.on('relative_state_update', handleStateUpdate);
    activeSocket.on('relative_player_submitted', handlePlayerSubmitted);
    activeSocket.on('relative_start_guessing', handleStartGuessing);
    activeSocket.on('relative_guess_wrong', handleGuessWrong);
    activeSocket.on('relative_game_won', handleGameWon);
    activeSocket.on('relative_reset_done', handleResetDone);

    return () => {
      if (activeSocket) {
        activeSocket.off('relative_state_update', handleStateUpdate);
        activeSocket.off('relative_player_submitted', handlePlayerSubmitted);
        activeSocket.off('relative_start_guessing', handleStartGuessing);
        activeSocket.off('relative_guess_wrong', handleGuessWrong);
        activeSocket.off('relative_game_won', handleGameWon);
        activeSocket.off('relative_reset_done', handleResetDone);
        if (!socketProp) {
          activeSocket.disconnect();
        }
      }
    };
  }, [socketProp, role]);

  // 60-Second Setup Timer
  useEffect(() => {
    if (phase !== 'setup' || hasSubmittedSetup) return;

    const timer = setInterval(() => {
      setSetupTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitSetup();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, hasSubmittedSetup, personName, hints, imageUri]);

  const handleAutoSubmitSetup = () => {
    if (hasSubmittedSetup) return;
    handleSubmitSetup(true);
  };

  const handlePickImage = async () => {
    try {
      let ImagePicker = null;
      try {
        ImagePicker = require('expo-image-picker');
      } catch (e) {
        // Module not linked natively in current build
      }

      if (!ImagePicker || typeof ImagePicker.requestMediaLibraryPermissionsAsync !== 'function') {
        Alert.alert(
          'Image Picker Notice',
          'Photo picker native module is not compiled in this build. You can add text hints directly!'
        );
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow gallery access to pick relative photo!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error picking image:', err);
    }
  };

  const handleAddHint = () => {
    if (hints.length >= 7) {
      Alert.alert('Limit Reached', 'You can add up to 7 hints per relative!');
      return;
    }
    setHints((prev) => [...prev, '']);
  };

  const handleUpdateHint = (text, index) => {
    const updated = [...hints];
    updated[index] = text;
    setHints(updated);
  };

  const handleSubmitSetup = (isAuto = false) => {
    if (!personName.trim() && !isAuto) {
      Alert.alert('Missing Name', 'Please enter the relative or person name!');
      return;
    }

    const validHints = hints.filter((h) => h.trim());
    if (validHints.length === 0 && !isAuto) {
      Alert.alert('Missing Hints', 'Please enter at least 1 hint about this person!');
      return;
    }

    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('relative_submit_setup', {
        role,
        personName: personName.trim() || (role === 'didi' ? 'Mamu' : 'Chacha'),
        imageUri,
        hints: validHints.length > 0 ? validHints : ['Family relative', 'Met during Diwali'],
      });
      setHasSubmittedSetup(true);
      setPhase('waiting');
    }
  };

  const handleUnlockNextHint = () => {
    if (!myChallenge) return;
    const maxHints = myChallenge.hints ? myChallenge.hints.length : 1;
    if (unlockedHintCount < maxHints) {
      const nextCount = unlockedHintCount + 1;
      setUnlockedHintCount(nextCount);
      // Reduce photo blur progressively
      const newBlur = Math.max(0, 25 - (nextCount / maxHints) * 25);
      setBlurRadius(newBlur);
    }
  };

  const handleSubmitGuess = () => {
    if (!guessInput.trim()) return;

    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('relative_submit_guess', {
        user: role,
        guess: guessInput.trim(),
      });
      setGuessInput('');
    }
  };

  const handleResetGame = () => {
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('relative_reset');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF9F4', '#EBF5FF', '#FFF9F4']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Guess The Person 🎭🕵️</Text>
          <Text style={styles.headerSubtitle}>Family Mystery Showdown</Text>
        </View>
        <TouchableOpacity onPress={handleResetGame} activeOpacity={0.7} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* PHASE 1: SETUP */}
          {phase === 'setup' && (
            <View style={styles.card}>
              <View style={styles.timerHeaderRow}>
                <Text style={styles.cardTitle}>Set Up Your Mystery Person 🕵️</Text>
                <View style={styles.timerBadge}>
                  <Ionicons name="timer-outline" size={16} color="#2563EB" style={{ marginRight: 4 }} />
                  <Text style={styles.timerText}>{setupTimeLeft}s</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>
                Pick a family member, mutual relative, or celebrity and write up to 7 secret clues!
              </Text>

              {/* Name Input */}
              <Text style={styles.inputLabel}>Person / Relative Name (Secret Answer):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Ramesh Chacha, Preeti Bua, SRK"
                placeholderTextColor="#A88B8B"
                value={personName}
                onChangeText={setPersonName}
              />

              {/* Optional Photo Picker */}
              <Text style={styles.inputLabel}>Optional Mystery Photo (Blurred for Sibling):</Text>
              <TouchableOpacity activeOpacity={0.8} style={styles.imagePickBtn} onPress={handlePickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <FontAwesome5 name="user-secret" size={24} color="#2563EB" />
                    <Text style={styles.imagePlaceholderText}>Tap to add relative photo (Optional)</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Dynamic Hint Inputs */}
              <View style={styles.hintsHeaderRow}>
                <Text style={styles.inputLabel}>Progressive Hints (Up to 7):</Text>
                {hints.length < 7 && (
                  <TouchableOpacity style={styles.addHintBtn} onPress={handleAddHint}>
                    <Ionicons name="add-circle" size={16} color="#2563EB" style={{ marginRight: 2 }} />
                    <Text style={styles.addHintText}>Add Hint ({hints.length}/7)</Text>
                  </TouchableOpacity>
                )}
              </View>

              {hints.map((hintText, index) => (
                <View key={index} style={styles.hintInputRow}>
                  <View style={styles.hintBadgeNum}>
                    <Text style={styles.hintBadgeNumText}>#{index + 1}</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                    placeholder={`Hint ${index + 1} (e.g. ${
                      index === 0
                        ? 'Always drinks extra sweet chai'
                        : index === 1
                        ? 'Lives in Jaipur'
                        : 'Famous for his jokes'
                    })`}
                    placeholderTextColor="#A88B8B"
                    value={hintText}
                    onChangeText={(text) => handleUpdateHint(text, index)}
                  />
                </View>
              ))}

              <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={() => handleSubmitSetup(false)}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>Submit Mystery Person 🚀</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PHASE 2: WAITING */}
          {phase === 'waiting' && (
            <View style={styles.card}>
              <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 16 }} />
              <Text style={styles.waitingTitle}>Setup Locked! 🔒</Text>
              <Text style={styles.waitingSub}>
                Waiting for {opponentRole === 'didi' ? 'Sanjana Didi 👸' : 'Vishesh Bhai 👦'} to finish setting up their mystery relative...
              </Text>
            </View>
          )}

          {/* PHASE 3: GUESSING */}
          {phase === 'guessing' && myChallenge && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Guess Sibling’s Mystery Person! 🔍</Text>
              <Text style={styles.cardSub}>
                Unlock hints and unblur the photo to identify who {opponentRole === 'didi' ? 'Didi' : 'Bhai'} selected!
              </Text>

              {/* Blurred Photo Container */}
              {myChallenge.imageUri ? (
                <View style={styles.photoFrame}>
                  <Image
                    source={{ uri: myChallenge.imageUri }}
                    style={styles.relativePhoto}
                    blurRadius={blurRadius}
                    resizeMode="cover"
                  />
                  {blurRadius > 0 && (
                    <View style={styles.blurBadge}>
                      <Ionicons name="eye-off-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.blurBadgeText}>Photo Blurred ({Math.round(blurRadius)}px)</Text>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Hints Unlocking Area */}
              <View style={styles.hintsSection}>
                <View style={styles.hintsTitleRow}>
                  <Text style={styles.sectionHeading}>Unlocked Hints ({unlockedHintCount}/{myChallenge.hints.length}):</Text>
                  {unlockedHintCount < myChallenge.hints.length && (
                    <TouchableOpacity activeOpacity={0.8} style={styles.unlockBtn} onPress={handleUnlockNextHint}>
                      <Ionicons name="key-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.unlockBtnText}>Unlock Hint #{unlockedHintCount + 1}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {myChallenge.hints.map((hintText, idx) => {
                  const isUnlocked = idx < unlockedHintCount;
                  return (
                    <View key={idx} style={[styles.hintCard, isUnlocked ? styles.unlockedHintCard : styles.lockedHintCard]}>
                      <View style={styles.hintCardHeader}>
                        <Text style={styles.hintCardTitle}>Hint #{idx + 1}</Text>
                        <Ionicons
                          name={isUnlocked ? 'lock-open-outline' : 'lock-closed-outline'}
                          size={16}
                          color={isUnlocked ? '#2563EB' : '#8E6E6E'}
                        />
                      </View>
                      <Text style={[styles.hintCardText, !isUnlocked && styles.lockedHintText]}>
                        {isUnlocked ? hintText : 'Tap "Unlock Hint" above to reveal'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Real-time Guess Input */}
              <Text style={styles.inputLabel}>Type Your Relative Guess:</Text>
              <View style={styles.guessRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginBottom: 0, marginRight: 10 }]}
                  placeholder="Enter relative or person name..."
                  placeholderTextColor="#A88B8B"
                  value={guessInput}
                  onChangeText={setGuessInput}
                  onSubmitEditing={handleSubmitGuess}
                />
                <TouchableOpacity activeOpacity={0.85} style={styles.submitGuessBtn} onPress={handleSubmitGuess}>
                  <Ionicons name="send" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Wrong Guesses Log */}
              {wrongGuesses.length > 0 && (
                <View style={styles.wrongLog}>
                  <Text style={styles.wrongLogTitle}>Recent Incorrect Guesses:</Text>
                  {wrongGuesses.map((item, idx) => (
                    <Text key={idx} style={styles.wrongLogItem}>
                      ❌ {item.user === 'didi' ? 'Didi' : 'Bhai'}: "{item.guess}"
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* PHASE 4: RESULT */}
          {phase === 'ended' && (
            <View style={styles.resultCard}>
              <LinearGradient colors={['#EBF5FF', '#FFFDFB']} style={styles.resultGradient}>
                <Text style={styles.resultHeader}>
                  {winner === role ? '🎉 BINGO! YOU GUESSED IT RIGHT! 🏆' : `👑 ${winner === 'didi' ? 'Sanjana Didi' : 'Vishesh Bhai'} WON THE MATCH!`}
                </Text>

                <View style={styles.relativeAnswerBox}>
                  <Text style={styles.relativeAnswerLabel}>The Secret Relative Was:</Text>
                  <Text style={styles.relativeAnswerValue}>{winningRelative}</Text>
                </View>

                <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={handleResetGame}>
                  <Ionicons name="refresh" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>Play Next Round 🔄</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
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
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    padding: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A1B1C',
    flex: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timerText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2563EB',
  },
  cardSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#5C4040',
    marginBottom: 6,
    marginTop: 8,
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
    marginBottom: 10,
  },
  imagePickBtn: {
    height: 140,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    backgroundColor: '#EBF5FF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 6,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  hintsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 6,
  },
  addHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addHintText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  hintInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintBadgeNum: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  hintBadgeNumText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563EB',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#2563EB',
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
  photoFrame: {
    position: 'relative',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F6E4DA',
  },
  relativePhoto: {
    width: '100%',
    height: '100%',
  },
  blurBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  blurBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  hintsSection: {
    marginBottom: 16,
  },
  hintsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5C4040',
  },
  unlockBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  hintCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  unlockedHintCard: {
    backgroundColor: '#EBF5FF',
    borderColor: '#BFDBFE',
  },
  lockedHintCard: {
    backgroundColor: '#FFF8F5',
    borderColor: '#F6E4DA',
  },
  hintCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  hintCardTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#5C4040',
  },
  hintCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A1B1C',
  },
  lockedHintText: {
    color: '#8E6E6E',
    fontStyle: 'italic',
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitGuessBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrongLog: {
    marginTop: 12,
    backgroundColor: '#FFF5F6',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F9D1D5',
  },
  wrongLogTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DE5462',
    marginBottom: 2,
  },
  wrongLogItem: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#5C4040',
  },
  resultCard: {
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#2563EB',
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultGradient: {
    padding: 22,
    alignItems: 'center',
  },
  resultHeader: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#2A1B1C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  relativeAnswerBox: {
    backgroundColor: '#FFFDFB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  relativeAnswerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E6E6E',
    marginBottom: 2,
  },
  relativeAnswerValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2563EB',
    textAlign: 'center',
  },
});
