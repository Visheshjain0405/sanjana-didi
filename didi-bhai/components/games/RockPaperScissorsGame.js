import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

import { io } from 'socket.io-client';
import { BACKEND_URL } from '../../src/services/api';

const CHOICES = [
  { id: 'rock', title: 'Rock', emoji: '🪨', color: '#8E6E6E', bg: '#FDF3E7', border: '#F5D7B5' },
  { id: 'paper', title: 'Paper', emoji: '📄', color: '#2563EB', bg: '#EBF5FF', border: '#BFDBFE' },
  { id: 'scissors', title: 'Scissors', emoji: '✂️', color: '#DE5462', bg: '#FDEEEF', border: '#F9D1D5' },
];

export default function RockPaperScissorsGame({ socket: socketProp, currentUser, onBack }) {
  const insets = useSafeAreaInsets();
  const role = (currentUser?.role || 'bhai').toLowerCase(); // 'didi' or 'bhai'
  const opponentRole = role === 'didi' ? 'bhai' : 'didi';

  const [scores, setScores] = useState({ didi: 0, bhai: 0 });
  const [myChoice, setMyChoice] = useState(null);
  const [lockedChoices, setLockedChoices] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [roundWinner, setRoundWinner] = useState(null);
  const [matchWinner, setMatchWinner] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [socket, setSocket] = useState(socketProp);
  const [timeLeft, setTimeLeft] = useState(5);

  // 5-Second Round Countdown Effect
  useEffect(() => {
    if (isRevealing || matchWinner) return;

    setTimeLeft(5);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [myChoice, isRevealing, matchWinner, lastResult]);

  const handleTimeUp = () => {
    const activeSocket = socket || socketProp;
    if (activeSocket && !myChoice) {
      activeSocket.emit('rps_time_up', { user: role });
    }
  };

  useEffect(() => {
    let activeSocket = socketProp || socket;
    if (!activeSocket) {
      activeSocket = io(BACKEND_URL, {
        transports: ['websocket'],
      });
      setSocket(activeSocket);
    }

    if (!activeSocket) return;

    // Join RPS room & request initial state
    activeSocket.emit('rps_join');

    const handleStateUpdate = (data) => {
      if (data.scores) setScores(data.scores);
      if (data.choices) setLockedChoices(data.choices);
      if (data.matchWinner) setMatchWinner(data.matchWinner);
    };

    const handlePlayerLocked = (data) => {
      setLockedChoices(data.choicesLocked || []);
    };

    const handleRoundResult = (data) => {
      setIsRevealing(true);
      setLastResult(data);
      setScores(data.scores);
      setRoundWinner(data.winner);
      if (data.matchWinner) {
        setMatchWinner(data.matchWinner);
      }

      setTimeout(() => {
        setIsRevealing(false);
        setMyChoice(null);
        setLockedChoices([]);
        setTimeLeft(5);
      }, 3500);
    };

    const handleMatchReset = (data) => {
      setScores(data.scores || { didi: 0, bhai: 0 });
      setMyChoice(null);
      setLockedChoices([]);
      setLastResult(null);
      setRoundWinner(null);
      setMatchWinner(null);
      setTimeLeft(5);
    };

    activeSocket.on('rps_state_update', handleStateUpdate);
    activeSocket.on('rps_player_locked', handlePlayerLocked);
    activeSocket.on('rps_round_result', handleRoundResult);
    activeSocket.on('rps_match_reset', handleMatchReset);

    return () => {
      if (activeSocket) {
        activeSocket.off('rps_state_update', handleStateUpdate);
        activeSocket.off('rps_player_locked', handlePlayerLocked);
        activeSocket.off('rps_round_result', handleRoundResult);
        activeSocket.off('rps_match_reset', handleMatchReset);
        if (!socketProp) {
          activeSocket.disconnect();
        }
      }
    };
  }, [socketProp]);

  const handleSelectChoice = (choiceId) => {
    if (myChoice || isRevealing || matchWinner) return;
    setMyChoice(choiceId);
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('rps_submit_choice', {
        user: role,
        choice: choiceId,
      });
    }
  };

  const handleResetMatch = () => {
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('rps_reset_match');
    }
  };

  const getEmojiForChoice = (c) => {
    if (c === 'rock') return '🪨';
    if (c === 'paper') return '📄';
    if (c === 'scissors') return '✂️';
    return '❓';
  };

  const isOpponentLocked = lockedChoices.includes(opponentRole);
  const isMyLocked = myChoice !== null || lockedChoices.includes(role);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF9F4', '#FDEBEA', '#FFF9F4']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Rock, Paper, Scissors 🪨📄✂️</Text>
          <Text style={styles.headerSubtitle}>Real-time Sibling Showdown</Text>
        </View>
        <TouchableOpacity onPress={handleResetMatch} activeOpacity={0.7} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={20} color="#DE5462" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Live Scoreboard */}
        <View style={styles.scoreboardContainer}>
          <View style={[styles.playerScoreCard, role === 'didi' && styles.activePlayerCard]}>
            <View style={styles.avatarBadgeCircle}>
              <Text style={styles.avatarEmoji}>👸</Text>
            </View>
            <Text style={styles.playerName}>Sanjana Didi</Text>
            <View style={styles.scorePill}>
              <Text style={styles.scoreNumber}>{scores.didi} / 10</Text>
            </View>
            {role === 'didi' && <Text style={styles.youBadgeText}>YOU</Text>}
          </View>

          <View style={styles.vsBadgeContainer}>
            <LinearGradient colors={['#DE5462', '#C94F5B']} style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
          </View>

          <View style={[styles.playerScoreCard, role === 'bhai' && styles.activePlayerCard]}>
            <View style={styles.avatarBadgeCircle}>
              <Text style={styles.avatarEmoji}>👦</Text>
            </View>
            <Text style={styles.playerName}>Vishesh Bhai</Text>
            <View style={styles.scorePill}>
              <Text style={styles.scoreNumber}>{scores.bhai} / 10</Text>
            </View>
            {role === 'bhai' && <Text style={styles.youBadgeText}>YOU</Text>}
          </View>
        </View>

        {/* 5-Second Timer Bar */}
        <View style={styles.timerBarContainer}>
          <View style={styles.timerBadge}>
            <Ionicons name="timer-outline" size={18} color="#DE5462" style={{ marginRight: 6 }} />
            <Text style={styles.timerText}>
              {myChoice
                ? 'Move Locked 🔒'
                : isRevealing
                ? 'Revealing... ✨'
                : matchWinner
                ? 'Match Ended 🏆'
                : `Time Left: ${timeLeft}s ⚡`}
            </Text>
          </View>
        </View>

        {/* Match Winner Announcement Card */}
        {matchWinner && (
          <View style={styles.matchWinnerCard}>
            <Text style={styles.matchWinnerTitle}>
              {matchWinner === role ? '🏆 VICTORY! YOU REACHED 10 POINTS! 🎉' : `👑 ${matchWinner === 'didi' ? 'Didi' : 'Bhai'} WON THE MATCH!`}
            </Text>
            <Text style={styles.matchWinnerSub}>First to 10 Points Champion of Chai!</Text>
            <TouchableOpacity activeOpacity={0.85} style={styles.rematchBtn} onPress={handleResetMatch}>
              <Ionicons name="refresh" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.rematchBtnText}>Play Rematch 🔄</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Alert Bar */}
        <View style={styles.statusBox}>
          <Ionicons name="sparkles" size={16} color="#DE5462" style={{ marginRight: 8 }} />
          {isRevealing ? (
            <Text style={styles.statusText}>✨ Revealing Moves! ✨</Text>
          ) : isMyLocked && isOpponentLocked ? (
            <Text style={styles.statusText}>🔒 Both moves locked! Calculating winner...</Text>
          ) : isMyLocked ? (
            <Text style={styles.statusText}>⏳ Choice locked! Opponent has {timeLeft}s remaining...</Text>
          ) : isOpponentLocked ? (
            <Text style={styles.statusText}>⚡ Opponent locked move! Quick, {timeLeft}s left!</Text>
          ) : (
            <Text style={styles.statusText}>⏱️ You have 5 seconds per round to pick your move!</Text>
          )}
        </View>

        {/* Reveal Card / Battle Arena */}
        {isRevealing && lastResult && (
          <View style={styles.resultCard}>
            <LinearGradient colors={['#FFF5F6', '#FFFDFB']} style={styles.resultGradient}>
              <Text style={styles.resultTitle}>
                {roundWinner === 'draw'
                  ? '🤝 Match Tied! Great Minds Think Alike!'
                  : roundWinner === role
                  ? '🎉 You Won This Round! Chai for You! ☕'
                  : `💥 ${roundWinner === 'didi' ? 'Didi' : 'Bhai'} Won This Round!`}
              </Text>

              <View style={styles.handsRow}>
                <View style={styles.handBox}>
                  <Text style={styles.handAvatar}>👸</Text>
                  <View style={styles.handEmojiCircle}>
                    <Text style={styles.handChoiceEmoji}>{getEmojiForChoice(lastResult.didiChoice)}</Text>
                  </View>
                  <Text style={styles.handChoiceLabel}>{lastResult.didiChoice?.toUpperCase()}</Text>
                </View>

                <View style={styles.swordsWrap}>
                  <Text style={styles.swordsEmoji}>⚔️</Text>
                </View>

                <View style={styles.handBox}>
                  <Text style={styles.handAvatar}>👦</Text>
                  <View style={styles.handEmojiCircle}>
                    <Text style={styles.handChoiceEmoji}>{getEmojiForChoice(lastResult.bhaiChoice)}</Text>
                  </View>
                  <Text style={styles.handChoiceLabel}>{lastResult.bhaiChoice?.toUpperCase()}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Move Selection Area */}
        <View style={styles.choicesSection}>
          <Text style={styles.sectionHeading}>Make Your Move</Text>
          <View style={styles.choicesRow}>
            {CHOICES.map((item) => {
              const isSelected = myChoice === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  disabled={myChoice !== null || isRevealing}
                  onPress={() => handleSelectChoice(item.id)}
                  style={[
                    styles.choiceCard,
                    { backgroundColor: item.bg, borderColor: item.border },
                    isSelected && { borderColor: item.color, borderWidth: 2.5 },
                    (myChoice !== null && !isSelected) && { opacity: 0.45 },
                  ]}
                >
                  <View style={styles.choiceEmojiBox}>
                    <Text style={styles.choiceEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={[styles.choiceTitle, { color: item.color }]}>{item.title}</Text>
                  {isSelected && (
                    <View style={[styles.lockedBadge, { backgroundColor: item.color }]}>
                      <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Game Rules Note */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesHeaderRow}>
            <MaterialCommunityIcons name="book-open-variant" size={18} color="#DE5462" style={{ marginRight: 6 }} />
            <Text style={styles.rulesTitle}>Chai Battle Rules (10 Points Race)</Text>
          </View>
          <Text style={styles.ruleItem}>• First player to reach 10 points wins the match 🏆</Text>
          <Text style={styles.ruleItem}>• 5 Seconds timer per round to lock your choice ⏱️</Text>
          <Text style={styles.ruleItem}>• Rock beats Scissors, Scissors beats Paper, Paper beats Rock 🪨📄✂️</Text>
          <Text style={styles.ruleItem}>• Loser makes the next cup of hot chai ☕!</Text>
        </View>
      </ScrollView>
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
  scoreboardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    position: 'relative',
  },
  playerScoreCard: {
    flex: 1,
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  activePlayerCard: {
    borderColor: '#DE5462',
    backgroundColor: '#FFF9F4',
    borderWidth: 2,
  },
  avatarBadgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#FFF5F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    marginBottom: 8,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  playerName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2A1B1C',
    marginBottom: 6,
    textAlign: 'center',
  },
  scorePill: {
    backgroundColor: '#DE5462',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DE5462',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  vsBadgeContainer: {
    marginHorizontal: 8,
    zIndex: 10,
  },
  vsBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  vsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  timerBarContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F9D1D5',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DE5462',
  },
  matchWinnerCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#22C55E',
    padding: 18,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  matchWinnerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
    textAlign: 'center',
    marginBottom: 4,
  },
  matchWinnerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5252',
    marginBottom: 12,
  },
  rematchBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rematchBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  statusBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFDFB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C4040',
    textAlign: 'center',
    flexShrink: 1,
  },
  resultCard: {
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#DE5462',
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultGradient: {
    padding: 20,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#2A1B1C',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 21,
  },
  handsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  handBox: {
    alignItems: 'center',
  },
  handAvatar: {
    fontSize: 22,
    marginBottom: 6,
  },
  handEmojiCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#F9D1D5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  handChoiceEmoji: {
    fontSize: 34,
  },
  handChoiceLabel: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#DE5462',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  swordsWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swordsEmoji: {
    fontSize: 20,
  },
  choicesSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5C4040',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  choicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  choiceCard: {
    flex: 1,
    height: 120,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  choiceEmojiBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#FFFDFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  choiceEmoji: {
    fontSize: 28,
  },
  choiceTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  lockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    padding: 18,
  },
  rulesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2A1B1C',
  },
  ruleItem: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B5252',
    marginBottom: 6,
    lineHeight: 18,
  },
});
