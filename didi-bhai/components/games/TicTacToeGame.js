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
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../../src/services/api';

export default function TicTacToeGame({ socket: socketProp, currentUser, onBack }) {
  const insets = useSafeAreaInsets();
  const role = (currentUser?.role || 'bhai').toLowerCase(); // 'didi' or 'bhai'

  const [socket, setSocket] = useState(socketProp);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState('didi');
  const [scores, setScores] = useState({ didi: 0, bhai: 0 });
  const [winner, setWinner] = useState(null); // null | 'didi' | 'bhai' | 'draw'
  const [winningCombo, setWinningCombo] = useState(null);
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

    activeSocket.emit('ttt_join');

    const handleStateUpdate = (data) => {
      if (data.board) setBoard(data.board);
      if (data.currentTurn) setCurrentTurn(data.currentTurn);
      if (data.scores) setScores(data.scores);
      setWinner(data.winner || null);
      setWinningCombo(data.winningCombo || null);
      setIsGameOver(!!data.isGameOver);
    };

    const handleMoveMade = (data) => {
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
      setWinner(null);
      setWinningCombo(null);
      setIsGameOver(false);
    };

    const handleGameOver = (data) => {
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
      setScores(data.scores);
      setWinner(data.winner);
      setWinningCombo(data.winningCombo);
      setIsGameOver(true);
    };

    activeSocket.on('ttt_state_update', handleStateUpdate);
    activeSocket.on('ttt_move_made', handleMoveMade);
    activeSocket.on('ttt_game_over', handleGameOver);

    return () => {
      if (activeSocket) {
        activeSocket.off('ttt_state_update', handleStateUpdate);
        activeSocket.off('ttt_move_made', handleMoveMade);
        activeSocket.off('ttt_game_over', handleGameOver);
        if (!socketProp) {
          activeSocket.disconnect();
        }
      }
    };
  }, [socketProp]);

  const handleTilePress = (index) => {
    if (isGameOver) return;
    if (currentTurn !== role) return;
    if (board[index] !== null) return;

    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('ttt_make_move', { user: role, index });
    }
  };

  const handleResetGame = () => {
    const activeSocket = socket || socketProp;
    if (activeSocket) {
      activeSocket.emit('ttt_reset_game');
    }
  };

  const isMyTurn = currentTurn === role && !isGameOver;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF9F4', '#FDEEEF', '#FFF9F4']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Tic-Tac-Toe 👸⚔️👦</Text>
          <Text style={styles.headerSubtitle}>Real-time Avatar Battle</Text>
        </View>
        <TouchableOpacity onPress={handleResetGame} activeOpacity={0.7} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={20} color="#DE5462" />
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
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{scores.didi} Wins</Text>
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
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{scores.bhai} Wins</Text>
            </View>
            {role === 'bhai' && <Text style={styles.youText}>YOU</Text>}
          </View>
        </View>

        {/* Status Turn Indicator Bar */}
        <View style={styles.statusBar}>
          <Ionicons name="sparkles" size={16} color="#DE5462" style={{ marginRight: 6 }} />
          {isGameOver ? (
            <Text style={styles.statusText}>
              {winner === 'draw'
                ? '🤝 Match Tied! Rematch time!'
                : winner === role
                ? '🎉 Victory! You aligned 3 avatars!'
                : `💥 ${winner === 'didi' ? 'Sanjana Didi' : 'Vishesh Bhai'} Won The Round!`}
            </Text>
          ) : isMyTurn ? (
            <Text style={styles.statusText}>✨ Your Turn! Tap an empty tile to place avatar ✨</Text>
          ) : (
            <Text style={styles.statusText}>⏳ Waiting for {currentTurn === 'didi' ? 'Sanjana Didi 👸' : 'Vishesh Bhai 👦'} to move...</Text>
          )}
        </View>

        {/* 3x3 Grid Board */}
        <View style={styles.boardContainer}>
          <View style={styles.grid}>
            {board.map((cellValue, idx) => {
              const isWinningTile = winningCombo && winningCombo.includes(idx);
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  disabled={cellValue !== null || !isMyTurn}
                  onPress={() => handleTilePress(idx)}
                  style={[
                    styles.gridTile,
                    isWinningTile && styles.winningGridTile,
                    (cellValue !== null || !isMyTurn) && styles.disabledGridTile,
                  ]}
                >
                  {cellValue === 'didi' ? (
                    <Text style={styles.tileEmoji}>👸</Text>
                  ) : cellValue === 'bhai' ? (
                    <Text style={styles.tileEmoji}>👦</Text>
                  ) : (
                    <View style={styles.emptyTileDot} />
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
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  myPlayerCard: {
    borderColor: '#DE5462',
  },
  turnPlayerCard: {
    backgroundColor: '#FFF5F6',
    borderWidth: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FFF5F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F9D1D5',
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
    backgroundColor: '#DE5462',
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
    color: '#DE5462',
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
    marginBottom: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C4040',
    textAlign: 'center',
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  grid: {
    width: 280,
    height: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    alignContent: 'center',
  },
  gridTile: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  winningGridTile: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2.5,
  },
  disabledGridTile: {
    opacity: 0.9,
  },
  tileEmoji: {
    fontSize: 38,
  },
  emptyTileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F6E4DA',
  },
  rematchBtn: {
    backgroundColor: '#DE5462',
    borderRadius: 18,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#DE5462',
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
