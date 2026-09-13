import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchRemindersApi, completeReminderApi } from '../src/services/api';

export default function RemindersHistoryScreen({ currentUser, onBack }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await fetchRemindersApi();
      if (Array.isArray(data)) {
        setReminders(data);
      }
    } catch (err) {
      console.warn('Error loading reminder history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      const updated = await completeReminderApi(id);
      setReminders((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
    } catch (err) {
      console.warn('Error completing reminder:', err);
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'completed') return r.status === 'completed';
    return true;
  });

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }) => {
    const isCompleted = item.status === 'completed';

    return (
      <View style={[styles.card, isCompleted && styles.cardCompleted]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'alarm'}
              size={22}
              color={isCompleted ? '#22C55E' : '#DE5462'}
            />
          </View>
          <View style={styles.cardHeaderCol}>
            <View style={styles.tagRow}>
              <Text style={styles.tagText}>
                {item.createdBy === 'bhai' ? 'BHAI 👦' : 'DIDI 👸'}
              </Text>
              <Text style={styles.timeBadge}>{formatDateTime(item.scheduledAt)}</Text>
            </View>
            <Text style={[styles.cardTitle, isCompleted && styles.cardTitleCompleted]}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.statusBadge, isCompleted ? styles.statusBadgeDone : styles.statusBadgePending]}>
            <Text style={[styles.statusBadgeText, isCompleted ? styles.statusBadgeTextDone : styles.statusBadgeTextPending]}>
              {isCompleted ? 'Done' : 'Pending'}
            </Text>
          </View>
        </View>

        {!!item.note && (
          <Text style={styles.cardNote}>{item.note}</Text>
        )}

        {item.repeatInterval > 0 && !isCompleted && (
          <View style={styles.repeatBadgeRow}>
            <MaterialCommunityIcons name="emoticon-devil-outline" size={14} color="#C94F5B" />
            <Text style={styles.repeatBadgeText}>
              Repeats every {item.repeatInterval}m ({item.currentTriggerCount || 0}/{item.repeatCount || 1} triggered)
            </Text>
          </View>
        )}

        {!isCompleted && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionBtn}
            onPress={() => handleComplete(item._id)}
          >
            <Ionicons name="checkmark-done" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.actionBtnText}>Mark Completed</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Reminder History 📌</Text>
          <Text style={styles.headerSub}>All past & active sibling nudges</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'pending', 'completed'].map((tabKey) => {
          const isSelected = filter === tabKey;
          const label = tabKey.charAt(0).toUpperCase() + tabKey.slice(1);
          return (
            <TouchableOpacity
              key={tabKey}
              activeOpacity={0.8}
              style={[styles.filterChip, isSelected && styles.filterChipSelected]}
              onPress={() => setFilter(tabKey)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#DE5462" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : filteredReminders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="notifications-off-outline" size={48} color="#C8B2B2" />
          <Text style={styles.emptyTitle}>No reminders found</Text>
          <Text style={styles.emptySub}>Reminders created by Bhai will appear here!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReminders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadReminders();
              }}
              tintColor="#DE5462"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF9F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2A1B1C',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFDFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F6E4DA',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterChipSelected: {
    backgroundColor: '#DE5462',
    borderColor: '#DE5462',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C4040',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
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
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2A1B1C',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E6E6E',
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFDFB',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardCompleted: {
    backgroundColor: '#F7FAF7',
    borderColor: '#DCFCE7',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF5F6',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardHeaderCol: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DE5462',
  },
  timeBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E6E6E',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2A1B1C',
    marginTop: 2,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeDone: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusBadgeTextPending: {
    color: '#D97706',
  },
  statusBadgeTextDone: {
    color: '#15803D',
  },
  cardNote: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5C4040',
    marginTop: 8,
    backgroundColor: '#FFF8F5',
    padding: 8,
    borderRadius: 12,
  },
  repeatBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEEEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
    gap: 4,
  },
  repeatBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C94F5B',
  },
  actionBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
