import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { completeReminderApi } from '../src/services/api';

export default function DidiReminderBanner({ reminders = [], onReminderCompleted }) {
  const pendingReminders = reminders.filter((r) => r.status === 'pending');

  if (pendingReminders.length === 0) return null;

  const currentReminder = pendingReminders[0];

  const handleMarkDone = async (id) => {
    try {
      const updated = await completeReminderApi(id);
      if (onReminderCompleted) onReminderCompleted(updated);
    } catch (err) {
      console.warn('Error completing reminder:', err);
    }
  };

  const getRepeatBadgeText = () => {
    if (!currentReminder.repeatInterval || currentReminder.repeatInterval === 0) {
      return null;
    }
    return `⚠️ Nudge alert: Repeating every ${currentReminder.repeatInterval} min (${currentReminder.currentTriggerCount || 0}/${currentReminder.repeatCount || 1})`;
  };

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="alarm" size={22} color="#DE5462" />
        </View>
        <View style={styles.textCol}>
          <View style={styles.tagRow}>
            <Text style={styles.tagText}>REMINDER FROM BHAI 📌</Text>
          </View>
          <Text style={styles.titleText}>{currentReminder.title}</Text>
          {!!currentReminder.note && (
            <Text style={styles.descText} numberOfLines={2}>
              {currentReminder.note}
            </Text>
          )}
        </View>
      </View>

      {/* Repeat Badge Alert if Masti Mode is active */}
      {getRepeatBadgeText() && (
        <View style={styles.nudgeBadgeRow}>
          <MaterialCommunityIcons name="emoticon-devil-outline" size={14} color="#C94F5B" />
          <Text style={styles.nudgeBadgeText}>{getRepeatBadgeText()}</Text>
        </View>
      )}

      {/* Complete Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.doneBtn}
        onPress={() => handleMarkDone(currentReminder._id)}
      >
        <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.doneBtnText}>Ho gaya! Done ✅</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FFF5F6',
    borderWidth: 1.5,
    borderColor: '#F9D1D5',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FDEEEF',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#DE5462',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A1B1C',
  },
  descText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5C4040',
    marginTop: 2,
    lineHeight: 17,
  },
  nudgeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEEEF',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  nudgeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C94F5B',
  },
  doneBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 18,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
