import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../../src/services/api';

export default function MemoryMatchGame({ socket: socketProp, currentUser, onBack }) {
  const insets = useSafeAreaInsets();
  const role = (currentUser?.role || 'bhai').toLowerCase(); // 'didi' or 'bhai'

  const [socket, setSocket] = useState(socketProp);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('didi');
  const [scores, setScores] = useState({ didi: 0, bhai: 0 });
  const [winner, setWinner] = useState(null); // null | 'didi' | 'bhai' | 'draw'
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    let activeSocket = socketProp || socket;
    if (!activeSocket) {
      activeSocket = io(BACKEND_URL, {
        transports: ['websocket'],
      });
      setSocket(activeSocket);
    }

    if (!activeSocket) return;

    activeSocket.emit('memory_join');

    const handleStateUpdate = (data) => {
      if (data.cards) setCards(data.cards);
      if (data.flippedIndices) setFlippedIndices(data.flippedIndices);
      if (data.currentTurn) setCurrentTurn(data.currentTurn);
      if (data.scores) setScores(data.scores);
      setWinner(data.winner || null);
      setIsEvaluating(!!data.isEvaluating);
      setIsGameOver(!!data.isGameOver);
    };

    const handleCardFlipped = (data) => {
      if (data.cards) setCards(data.cards);
      if (data.flippedIndices) setFlippedIndices(data.flippedIndices);
    };

    const handleMatchResult = (data) => {
      if (data.cards) setCards(data.cards);
      if (data.flippedIndices) setFlippedIndices(data.flippedIndices);
      if (data.currentTurn) setCurrentTurn(data.currentTurn);
      if (data.scores) setScores(data.scores);
      setWinner(data.winner || null);
      setIsEvaluating(!!data.isEvaluating);
      setIsGameOver(!!data.isGameOver);
    };

    activeSocket.on('memory_state_update', handleStateUpdate);
    activeSocket.on('memory_card_flipped', handleCardFlipped);
    activeSocket.on('memory_match_result', handleMatchResult);

    return () => {
      if (activeSocket) {
        activeSocket.off('memory_state_update', handleStateUpdate);
        activeSocket.off('memory_card_flipped', handleCardFlipped);
        activeSocket.off('memory_match_result', handleMatchResult);
        if (!socketProp) {
          activeSocket.disconnect();
        }
      }
    };
  }, [socketProp]);

  const handleCardPress = (index) => {
    if (isGameOver || isEvaluating) return;
    if (currentTurn !== role) return;

    const card = cards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('memory_flip_card', { user: role, index });
    }
  };

  const handleResetGame = () => {
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('memory_reset_game');
    }
  };

  const isMyTurn = currentTurn === role && !isGameOver && !isEvaluating;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF9F4', '#F3ECFB', '#FFF9F4']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Memory Match 🃏✨</Text>
          <Text style={styles.headerSubtitle}>Sibling Memory Duel</Text>
        </View>
        <TouchableOpacity onPress={handleResetGame} activeOpacity={0.7} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={20} color="#6B46C1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Scoreboard */}
        <View style={styles.scoreboardContainer}>
          <View style={[styles.playerCard, role === 'didi' && styles.myPlayerCard, currentTurn === 'didi' && !isGameOver && styles.turnPlayerCard]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>👸</Text>
            </View>
            <Text style={styles.playerName}>Sanjana Didi</Text>
            <View style={styles.scorePillDidi}>
              <Text style={styles.scoreText}>{scores.didi} Pairs</Text>
            </View>
            {role === 'didi' && <Text style={styles.youText}>YOU</Text>}
          </View>

          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={[styles.playerCard, role === 'bhai' && styles.myPlayerCard, currentTurn === 'bhai' && !isGameOver && styles.turnPlayerCard]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>👦</Text>
            </View>
            <Text style={styles.playerName}>Vishesh Bhai</Text>
            <View style={styles.scorePillBhai}>
              <Text style={styles.scoreText}>{scores.bhai} Pairs</Text>
            </View>
            {role === 'bhai' && <Text style={styles.youText}>YOU</Text>}
          </View>
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Ionicons name="sparkles" size={16} color="#6B46C1" style={{ marginRight: 6 }} />
          {isGameOver ? (
            <Text style={styles.statusText}>
              {winner === 'draw'
                ? '🤝 Match Tied! Equal memory skills!'
                : winner === role
                ? '🎉 Victory! You found the most pairs!'
                : `💥 ${winner === 'didi' ? 'Sanjana Didi' : 'Vishesh Bhai'} Won The Match!`}
            </Text>
          ) : isEvaluating ? (
            <Text style={styles.statusText}>✨ Evaluating Pair Match... ✨</Text>
          ) : isMyTurn ? (
            <Text style={styles.statusText}>✨ Your Turn! Tap 2 cards to reveal matching pairs ✨</Text>
          ) : (
            <Text style={styles.statusText}>⏳ Waiting for {currentTurn === 'didi' ? 'Sanjana Didi 👸' : 'Vishesh Bhai 👦'} to flip...</Text>
          )}
        </View>

        {/* 4x3 Grid (12 Cards) */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {cards.map((card, idx) => {
              const isMatchedByDidi = card.isMatched && card.matchedBy === 'didi';
              const isMatchedByBhai = card.isMatched && card.matchedBy === 'bhai';

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  disabled={card.isFlipped || card.isMatched || !isMyTurn}
                  onPress={() => handleCardPress(idx)}
                  style={[
                    styles.cardTile,
                    card.isFlipped && styles.flippedTile,
                    isMatchedByDidi && styles.matchedDidiTile,
                    isMatchedByBhai && styles.matchedBhaiTile,
                  ]}
                >
                  {card.isFlipped || card.isMatched ? (
                    <Text style={styles.cardEmoji}>{card.emoji}</Text>
                  ) : (
                    <View style={styles.faceDownBox}>
                      <Text style={styles.faceDownQuestion}>❓</Text>
                    </View>
                  )}

                  {/* Matched Avatar Badge */}
                  {card.isMatched && (
                    <View style={styles.matchedBadge}>
                      <Text style={{ fontSize: 10 }}>{card.matchedBy === 'didi' ? '👸' : '👦'}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Rematch Button */}
        {isGameOver && (
          <TouchableOpacity activeOpacity={0.85} style={styles.rematchBtn} onPress={handleResetGame}>
            <Ionicons name="refresh" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.rematchBtnText}>Play Rematch 🔄</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: '#F3ECFB',
    borderWidth: 1,
    borderColor: '#DEC7F7',
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
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  myPlayerCard: {
    borderColor: '#6B46C1',
  },
  turnPlayerCard: {
    backgroundColor: '#F3ECFB',
    borderWidth: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#F3ECFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DEC7F7',
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
  scorePillDidi: {
    backgroundColor: '#DE5462',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  scorePillBhai: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  youText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B46C1',
    marginTop: 4,
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
  statusBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFDFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5C4040',
    textAlign: 'center',
  },
  gridContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  cardTile: {
    width: 72,
    height: 90,
    borderRadius: 20,
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#DEC7F7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  flippedTile: {
    backgroundColor: '#FFF9F4',
    borderColor: '#6B46C1',
    borderWidth: 2,
  },
  matchedDidiTile: {
    backgroundColor: '#FDEEEF',
    borderColor: '#DE5462',
    borderWidth: 2.5,
  },
  matchedBhaiTile: {
    backgroundColor: '#EBF5FF',
    borderColor: '#2563EB',
    borderWidth: 2.5,
  },
  cardEmoji: {
    fontSize: 32,
  },
  faceDownBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceDownQuestion: {
    fontSize: 26,
  },
  matchedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFDFB',
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#F6E4DA',
  },
  rematchBtn: {
    backgroundColor: '#6B46C1',
    borderRadius: 18,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  rematchBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
