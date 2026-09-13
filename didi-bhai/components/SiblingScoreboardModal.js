import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../src/services/api';

export default function SiblingScoreboardModal({ visible, onClose, socket: providedSocket, currentUser }) {
  const [stats, setStats] = useState({
    didiWins: 0,
    bhaiWins: 0,
    ties: 0,
    chaiOwedBy: 'none',
    chaiCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    let socket = providedSocket;
    let createdSocket = null;

    if (!socket || !socket.connected) {
      createdSocket = io(BACKEND_URL, {
        transports: ['websocket'],
      });
      socket = createdSocket;
    }

    const handleStatsUpdate = (data) => {
      if (data) {
        setStats(data);
      }
      setLoading(false);
    };

    socket.emit('stats_get');
    socket.on('stats_update', handleStatsUpdate);

    return () => {
      if (socket) {
        socket.off('stats_update', handleStatsUpdate);
      }
      if (createdSocket) {
        createdSocket.disconnect();
      }
    };
  }, [visible]);

  const handleSettleChai = () => {
    let socket = providedSocket;
    if (socket && socket.connected) {
      socket.emit('stats_settle_chai');
    } else {
      const created = io(BACKEND_URL, { transports: ['websocket'] });
      created.emit('stats_settle_chai');
      setTimeout(() => created.disconnect(), 1000);
    }
  };

  const totalMatches = stats.didiWins + stats.bhaiWins + stats.ties;

  const getChaiStatusText = () => {
    if (stats.chaiCount === 0 || stats.chaiOwedBy === 'none') {
      return 'No chai debt currently! Both siblings are equal ☕✨';
    }
    if (stats.chaiOwedBy === 'bhai') {
      return `Bhai owes Sanjana Didi ${stats.chaiCount} cup${stats.chaiCount > 1 ? 's' : ''} of Chai! ☕`;
    }
    return `Sanjana Didi owes Bhai ${stats.chaiCount} cup${stats.chaiCount > 1 ? 's' : ''} of Chai! ☕`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Top Handle */}
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Sibling Scoreboard 🏆</Text>
              <Text style={styles.headerSub}>Chai Debt Tracker & Win Stats</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#DE5462" />
              <Text style={styles.loadingText}>Fetching scoreboard stats...</Text>
            </View>
          ) : (
            <View style={styles.bodyContent}>
              {/* Avatars & Score Comparison Card */}
              <View style={styles.scoreboardCard}>
                {/* Didi Side */}
                <View style={styles.playerCol}>
                  <View style={styles.avatarCircleDidi}>
                    <Text style={styles.avatarEmoji}>👸</Text>
                  </View>
                  <Text style={styles.playerName}>Sanjana Didi</Text>
                  <Text style={styles.winCount}>{stats.didiWins}</Text>
                  <Text style={styles.winLabel}>WINS</Text>
                </View>

                {/* VS Badge */}
                <View style={styles.vsWrap}>
                  <Text style={styles.vsText}>VS</Text>
                  <View style={styles.tiesPill}>
                    <Text style={styles.tiesText}>{stats.ties} Draws</Text>
                  </View>
                </View>

                {/* Bhai Side */}
                <View style={styles.playerCol}>
                  <View style={styles.avatarCircleBhai}>
                    <Text style={styles.avatarEmoji}>👦</Text>
                  </View>
                  <Text style={styles.playerName}>Bhai</Text>
                  <Text style={styles.winCount}>{stats.bhaiWins}</Text>
                  <Text style={styles.winLabel}>WINS</Text>
                </View>
              </View>

              {/* Matches Counter Banner */}
              <View style={styles.totalMatchesRow}>
                <Ionicons name="game-controller-outline" size={16} color="#6B7280" />
                <Text style={styles.totalMatchesText}>
                  Total Showdowns Played: <Text style={{ fontWeight: '800', color: '#111827' }}>{totalMatches}</Text>
                </Text>
              </View>

              {/* Chai Debt Balance Box */}
              <View style={styles.chaiDebtBox}>
                <View style={styles.chaiHeaderRow}>
                  <View style={styles.chaiTagPill}>
                    <MaterialCommunityIcons name="coffee" size={16} color="#B45309" style={{ marginRight: 4 }} />
                    <Text style={styles.chaiTagText}>CHAI DEBT BALANCE</Text>
                  </View>
                  {stats.chaiCount > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.settleBtn}
                      onPress={handleSettleChai}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.settleBtnText}>Settled ✅</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.chaiStatusText}>{getChaiStatusText()}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#FFF9F5',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleBar: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1B1C',
  },
  headerSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 8,
  },
  bodyContent: {
    gap: 14,
  },
  scoreboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    elevation: 2,
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  playerCol: {
    alignItems: 'center',
    flex: 1,
  },
  avatarCircleDidi: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#FDEEEF',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarCircleBhai: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  playerName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A1B1C',
  },
  winCount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#DE5462',
    marginTop: 2,
  },
  winLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  vsWrap: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D1B8B8',
  },
  tiesPill: {
    backgroundColor: '#FFF9F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#F6E4DA',
  },
  tiesText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E6E6E',
  },
  totalMatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFDFB',
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F6E4DA',
  },
  totalMatchesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  chaiDebtBox: {
    backgroundColor: '#FDF3E7',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5D7B5',
  },
  chaiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chaiTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chaiTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  settleBtn: {
    backgroundColor: '#B45309',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chaiStatusText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#451A03',
    lineHeight: 19,
  },
});
