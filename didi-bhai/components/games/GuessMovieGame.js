import React, { useState, useEffect, useRef } from 'react';
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

export default function GuessMovieGame({ socket: socketProp, currentUser, onBack }) {
  const insets = useSafeAreaInsets();
  const role = (currentUser?.role || 'bhai').toLowerCase(); // 'didi' or 'bhai'

  const [socket, setSocket] = useState(socketProp);
  const [activeChallenge, setActiveChallenge] = useState(null);

  // Creator Creation Form State
  const [creationMode, setCreationMode] = useState('image'); // 'image' | 'clues'
  const [secretTitle, setSecretTitle] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [clue1, setClue1] = useState('');
  const [clue2, setClue2] = useState('');
  const [clue3, setClue3] = useState('');

  // Play Arena Guesser State
  const [guessInput, setGuessInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [unlockedClues, setUnlockedClues] = useState(1); // 1, 2, or 3
  const [wrongGuesses, setWrongGuesses] = useState([]);

  useEffect(() => {
    let activeSocket = socketProp || socket;
    if (!activeSocket) {
      activeSocket = io(BACKEND_URL, {
        transports: ['websocket'],
      });
      setSocket(activeSocket);
    }

    if (!activeSocket) return;

    activeSocket.emit('movie_join');

    const handleStateUpdate = (data) => {
      if (data.activeChallenge) {
        setActiveChallenge(data.activeChallenge);
      }
    };

    const handleNewChallenge = (challenge) => {
      setActiveChallenge(challenge);
      setTimeLeft(challenge.timeLimit || (challenge.mode === 'image' ? 45 : 60));
      setUnlockedClues(1);
      setWrongGuesses([]);
      setGuessInput('');
    };

    const handleGuessResult = (data) => {
      if (data.guessEntry) {
        if (!data.guessEntry.isCorrect) {
          setWrongGuesses((prev) => [...prev, data.guessEntry]);
        }
      }
      if (data.isResolved) {
        setActiveChallenge((prev) =>
          prev ? { ...prev, isResolved: true, winner: data.winner, secretTitle: data.secretTitle || prev.secretTitle } : null
        );
      }
    };

    const handleRoundTimeout = (data) => {
      setActiveChallenge((prev) =>
        prev ? { ...prev, isResolved: true, winner: 'nobody', secretTitle: data.secretTitle || prev.secretTitle } : null
      );
    };

    const handleChallengeCleared = () => {
      setActiveChallenge(null);
      resetCreationForm();
    };

    activeSocket.on('movie_state_update', handleStateUpdate);
    activeSocket.on('movie_new_challenge', handleNewChallenge);
    activeSocket.on('movie_guess_result', handleGuessResult);
    activeSocket.on('movie_round_timeout', handleRoundTimeout);
    activeSocket.on('movie_challenge_cleared', handleChallengeCleared);

    return () => {
      if (activeSocket) {
        activeSocket.off('movie_state_update', handleStateUpdate);
        activeSocket.off('movie_new_challenge', handleNewChallenge);
        activeSocket.off('movie_guess_result', handleGuessResult);
        activeSocket.off('movie_round_timeout', handleRoundTimeout);
        activeSocket.off('movie_challenge_cleared', handleChallengeCleared);
        if (!socketProp) {
          activeSocket.disconnect();
        }
      }
    };
  }, [socketProp]);

  // Countdown timer for active challenge
  useEffect(() => {
    if (!activeChallenge || activeChallenge.isResolved) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        // Clue unlock interval for 3 clues mode
        if (activeChallenge.mode === 'clues') {
          if (prev === 40 && unlockedClues < 2) setUnlockedClues(2);
          if (prev === 20 && unlockedClues < 3) setUnlockedClues(3);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeChallenge, unlockedClues]);

  const handleTimeUp = () => {
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('movie_time_up');
    }
  };

  const resetCreationForm = () => {
    setSecretTitle('');
    setImageUri('');
    setClue1('');
    setClue2('');
    setClue3('');
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
          'Native Picker Unavailable',
          'Expo ImagePicker native module is not compiled in this build. You can use 3 Clues Mystery mode directly!'
        );
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo library access to pick movie scene images!');
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
      Alert.alert(
        'Image Pick Notice',
        'Native image picker requires rebuilding the native Android app. You can use 3 Clues Mystery mode directly!'
      );
    }
  };

  const handleSendChallenge = () => {
    if (!secretTitle.trim()) {
      Alert.alert('Missing Movie Title', 'Please enter the secret Bollywood/Hollywood movie title!');
      return;
    }

    if (creationMode === 'image' && !imageUri) {
      Alert.alert('Missing Image', 'Please select a scene image for your riddle!');
      return;
    }

    if (creationMode === 'clues' && (!clue1.trim() || !clue2.trim() || !clue3.trim())) {
      Alert.alert('Missing Clues', 'Please provide all 3 progressive clues!');
      return;
    }

    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('movie_send_challenge', {
        mode: creationMode,
        creator: role,
        secretTitle: secretTitle.trim(),
        imageUri,
        clues: [clue1.trim(), clue2.trim(), clue3.trim()],
      });
    }
  };

  const handleSubmitGuess = () => {
    if (!guessInput.trim()) return;

    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('movie_submit_guess', {
        user: role,
        guess: guessInput.trim(),
      });
    }
    setGuessInput('');
  };

  const handleResetChallenge = () => {
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('movie_reset_challenge');
    }
  };

  // --- RENDER ARENA CREATION VS PLAY VS RESULT ---
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF9F4', '#FDEBEA', '#FFF9F4']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Guess The Movie 🎬🍿</Text>
          <Text style={styles.headerSubtitle}>Bollywood & Sibling Cinephile Battle</Text>
        </View>
        <TouchableOpacity onPress={handleResetChallenge} activeOpacity={0.7} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={20} color="#DE5462" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!activeChallenge ? (
            /* CREATE CHALLENGE SECTION */
            <View style={styles.createCard}>
              <Text style={styles.createHeaderTitle}>Create A Movie Challenge 🎬</Text>
              <Text style={styles.createHeaderSub}>Challenge your sibling to guess a secret movie title!</Text>

              {/* Mode Switcher */}
              <View style={styles.modeTabRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.modeTab, creationMode === 'image' && styles.activeModeTab]}
                  onPress={() => setCreationMode('image')}
                >
                  <FontAwesome5 name="image" size={14} color={creationMode === 'image' ? '#FFF' : '#5C4040'} style={{ marginRight: 6 }} />
                  <Text style={[styles.modeTabText, creationMode === 'image' && styles.activeModeTabText]}>Image Riddle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.modeTab, creationMode === 'clues' && styles.activeModeTab]}
                  onPress={() => setCreationMode('clues')}
                >
                  <MaterialCommunityIcons name="format-list-numbered" size={16} color={creationMode === 'clues' ? '#FFF' : '#5C4040'} style={{ marginRight: 6 }} />
                  <Text style={[styles.modeTabText, creationMode === 'clues' && styles.activeModeTabText]}>3 Clues Mystery</Text>
                </TouchableOpacity>
              </View>

              {/* Common Field: Secret Movie Title */}
              <Text style={styles.inputLabel}>Secret Movie Title (Answer):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 3 Idiots, Sholay, Dangal"
                placeholderTextColor="#A88B8B"
                value={secretTitle}
                onChangeText={setSecretTitle}
              />

              {creationMode === 'image' ? (
                /* Mode 1: Image Scene Picker */
                <View style={styles.imagePickerSection}>
                  <Text style={styles.inputLabel}>Select Movie Scene Photo / Crop:</Text>
                  <TouchableOpacity activeOpacity={0.8} style={styles.pickImageBtn} onPress={handlePickImage}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.pickedPreviewImage} />
                    ) : (
                      <View style={styles.pickImagePlaceholder}>
                        <Ionicons name="camera-outline" size={32} color="#DE5462" />
                        <Text style={styles.pickImageText}>Tap to pick scene image from gallery</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Mode 2: 3 Progressive Text Clues Form */
                <View style={styles.cluesFormSection}>
                  <Text style={styles.inputLabel}>Clue 1 (General Hint / Genre):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. College comedy directed by Rajkumar Hirani"
                    placeholderTextColor="#A88B8B"
                    value={clue1}
                    onChangeText={setClue1}
                  />

                  <Text style={styles.inputLabel}>Clue 2 (Famous Dialogue / Plot):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 'All Izz Well' and engineering hostel life"
                    placeholderTextColor="#A88B8B"
                    value={clue2}
                    onChangeText={setClue2}
                  />

                  <Text style={styles.inputLabel}>Clue 3 (Cast / Iconic Character):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Aamir Khan as Rancho & Virus Principal"
                    placeholderTextColor="#A88B8B"
                    value={clue3}
                    onChangeText={setClue3}
                  />
                </View>
              )}

              <TouchableOpacity activeOpacity={0.85} style={styles.sendChallengeBtn} onPress={handleSendChallenge}>
                <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.sendChallengeBtnText}>Dispatch Movie Challenge 🚀</Text>
              </TouchableOpacity>
            </View>
          ) : activeChallenge.isResolved ? (
            /* RESULT SCREEN */
            <View style={styles.resultCard}>
              <LinearGradient colors={['#FFF5F6', '#FFFDFB']} style={styles.resultGradient}>
                <Text style={styles.resultHeaderTitle}>
                  {activeChallenge.winner === role
                    ? '🎉 BINGO! YOU GUESSED IT RIGHT! 🍿'
                    : activeChallenge.winner === 'nobody'
                    ? '⌛ TIME UP! NOBODY SOLVED IT IN TIME!'
                    : `👑 ${activeChallenge.winner === 'didi' ? 'Sanjana Didi' : 'Vishesh Bhai'} WON THE ROUND!`}
                </Text>

                <View style={styles.movieTitleBox}>
                  <Text style={styles.movieTitleLabel}>Secret Movie Title Was:</Text>
                  <Text style={styles.movieTitleValue}>{activeChallenge.secretTitle}</Text>
                </View>

                {activeChallenge.mode === 'image' && activeChallenge.imageUri ? (
                  <Image source={{ uri: activeChallenge.imageUri }} style={styles.resultSceneImage} />
                ) : null}

                <TouchableOpacity activeOpacity={0.85} style={styles.newRoundBtn} onPress={handleResetChallenge}>
                  <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.newRoundBtnText}>Create Next Challenge</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            /* PLAY ARENA (GUESSING MODE) */
            <View style={styles.playArenaCard}>
              {/* Challenge Header & Timer Bar */}
              <View style={styles.arenaHeaderRow}>
                <View style={styles.creatorPill}>
                  <Text style={styles.creatorText}>
                    Created by {activeChallenge.creator === 'didi' ? 'Sanjana Didi 👸' : 'Vishesh Bhai 👦'}
                  </Text>
                </View>

                <View style={styles.timerPill}>
                  <Ionicons name="timer-outline" size={16} color="#DE5462" style={{ marginRight: 4 }} />
                  <Text style={styles.timerText}>{timeLeft}s Left</Text>
                </View>
              </View>

              {activeChallenge.mode === 'image' ? (
                /* Mode 1: Image Scene Guessing */
                <View style={styles.imageGuessArea}>
                  <Text style={styles.arenaSectionTitle}>🖼️ Scene Image Riddle</Text>
                  {activeChallenge.imageUri ? (
                    <Image source={{ uri: activeChallenge.imageUri }} style={styles.sceneGuessImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.imagePlaceholderBox}>
                      <Ionicons name="film-outline" size={40} color="#DE5462" />
                      <Text style={styles.imagePlaceholderText}>Movie Scene Image Challenge</Text>
                    </View>
                  )}
                </View>
              ) : (
                /* Mode 2: 3 Progressive Clues Guessing */
                <View style={styles.cluesGuessArea}>
                  <Text style={styles.arenaSectionTitle}>🔍 3 Progressive Clues Mystery</Text>

                  {activeChallenge.clues.map((clueText, index) => {
                    const isUnlocked = index < unlockedClues;
                    return (
                      <View key={index} style={[styles.clueCard, isUnlocked ? styles.unlockedClueCard : styles.lockedClueCard]}>
                        <View style={styles.clueCardHeader}>
                          <Text style={styles.clueNumberText}>Clue #{index + 1}</Text>
                          <Ionicons
                            name={isUnlocked ? 'lock-open-outline' : 'lock-closed-outline'}
                            size={16}
                            color={isUnlocked ? '#15803D' : '#8E6E6E'}
                          />
                        </View>
                        <Text style={[styles.clueBodyText, !isUnlocked && styles.lockedClueText]}>
                          {isUnlocked ? clueText : `Unlocks automatically at ${40 - (index - 1) * 20}s...`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Guesser Input Section */}
              {activeChallenge.creator === role ? (
                <View style={styles.creatorWaitingBox}>
                  <ActivityIndicator size="small" color="#DE5462" style={{ marginBottom: 6 }} />
                  <Text style={styles.creatorWaitingText}>
                    Waiting for {role === 'didi' ? 'Bhai 👦' : 'Didi 👸'} to guess the movie title!
                  </Text>
                </View>
              ) : (
                <View style={styles.guessInputSection}>
                  <Text style={styles.inputLabel}>Type Your Movie Guess:</Text>
                  <View style={styles.guessInputRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginBottom: 0, marginRight: 10 }]}
                      placeholder="Enter movie name..."
                      placeholderTextColor="#A88B8B"
                      value={guessInput}
                      onChangeText={setGuessInput}
                      onSubmitEditing={handleSubmitGuess}
                    />
                    <TouchableOpacity activeOpacity={0.85} style={styles.submitGuessBtn} onPress={handleSubmitGuess}>
                      <Ionicons name="send" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Wrong Guesses Log */}
              {wrongGuesses.length > 0 && (
                <View style={styles.wrongGuessesLog}>
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
    backgroundColor: '#FFF5F6',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  createCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    padding: 20,
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  createHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A1B1C',
    marginBottom: 4,
  },
  createHeaderSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginBottom: 16,
  },
  modeTabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F5',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    marginBottom: 18,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeModeTab: {
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
    marginBottom: 12,
  },
  imagePickerSection: {
    marginBottom: 16,
  },
  pickImageBtn: {
    height: 180,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F9D1D5',
    borderStyle: 'dashed',
    backgroundColor: '#FFF5F6',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickImagePlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DE5462',
    marginTop: 8,
    textAlign: 'center',
  },
  pickedPreviewImage: {
    width: '100%',
    height: '100%',
  },
  cluesFormSection: {
    marginBottom: 12,
  },
  sendChallengeBtn: {
    backgroundColor: '#DE5462',
    height: 48,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  sendChallengeBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  playArenaCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    padding: 18,
  },
  arenaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  creatorPill: {
    backgroundColor: '#FFF5F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F9D1D5',
  },
  creatorText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DE5462',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEEEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F9D1D5',
  },
  timerText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DE5462',
  },
  arenaSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2A1B1C',
    marginBottom: 12,
  },
  imageGuessArea: {
    marginBottom: 18,
  },
  sceneGuessImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F6E4DA',
  },
  imagePlaceholderBox: {
    height: 180,
    borderRadius: 20,
    backgroundColor: '#FFF5F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DE5462',
    marginTop: 8,
  },
  cluesGuessArea: {
    marginBottom: 16,
  },
  clueCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  unlockedClueCard: {
    backgroundColor: '#EEF7F2',
    borderColor: '#CDEBD7',
  },
  lockedClueCard: {
    backgroundColor: '#FFF8F5',
    borderColor: '#F6E4DA',
  },
  clueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clueNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C4040',
  },
  clueBodyText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2A1B1C',
  },
  lockedClueText: {
    color: '#8E6E6E',
    fontStyle: 'italic',
  },
  creatorWaitingBox: {
    backgroundColor: '#FFF8F5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  creatorWaitingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C4040',
  },
  guessInputSection: {
    marginTop: 8,
  },
  guessInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitGuessBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#DE5462',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrongGuessesLog: {
    marginTop: 14,
    backgroundColor: '#FFF5F6',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F9D1D5',
  },
  wrongLogTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#DE5462',
    marginBottom: 4,
  },
  wrongLogItem: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C4040',
    marginTop: 2,
  },
  resultCard: {
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#DE5462',
    overflow: 'hidden',
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultGradient: {
    padding: 22,
    alignItems: 'center',
  },
  resultHeaderTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#2A1B1C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  movieTitleBox: {
    backgroundColor: '#FFFDFB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DE5462',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  movieTitleLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E6E6E',
    marginBottom: 2,
  },
  movieTitleValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#DE5462',
    textAlign: 'center',
  },
  resultSceneImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginBottom: 16,
  },
  newRoundBtn: {
    backgroundColor: '#DE5462',
    borderRadius: 18,
    height: 48,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  newRoundBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
