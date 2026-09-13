import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createReminderApi } from '../src/services/api';

const TIME_CHIPS = [
  { id: '2m', label: '+2 mins (Test)', minutes: 2 },
  { id: '15m', label: '+15 mins', minutes: 15 },
  { id: '1h', label: '+1 hour', minutes: 60 },
  { id: 'custom', label: 'Custom Time', minutes: 30 },
];

const REPEAT_INTERVALS = [
  { id: 0, label: 'One-time', val: 0 },
  { id: 2, label: 'Every 2 min 🚨 (Spam)', val: 2 },
  { id: 5, label: 'Every 5 min 😈', val: 5 },
  { id: 15, label: 'Every 15 min', val: 15 },
];

const REPEAT_COUNTS = [1, 3, 5];

export default function BhaiReminderModal({ visible, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedTimeChip, setSelectedTimeChip] = useState('2m');
  const [customMinutes, setCustomMinutes] = useState('30');
  const [selectedInterval, setSelectedInterval] = useState(0);
  const [selectedRepeatCount, setSelectedRepeatCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const calculateScheduledAt = () => {
    const chip = TIME_CHIPS.find((c) => c.id === selectedTimeChip);
    let mins = chip ? chip.minutes : 2;
    if (selectedTimeChip === 'custom') {
      mins = parseInt(customMinutes, 10) || 30;
    }
    return new Date(Date.now() + mins * 60 * 1000);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'What should Didi do? Please enter task title.');
      return;
    }

    const scheduledAt = calculateScheduledAt();

    setLoading(true);
    try {
      const newReminder = await createReminderApi({
        title: title.trim(),
        note: note.trim(),
        scheduledAt: scheduledAt.toISOString(),
        repeatInterval: selectedInterval,
        repeatCount: selectedInterval > 0 ? selectedRepeatCount : 1,
        createdBy: 'bhai',
        targetUser: 'didi',
      });

      setLoading(false);
      Alert.alert(
        'Reminder Created! 📌',
        `Nudge scheduled for Didi.${selectedInterval > 0 ? ` Will repeat every ${selectedInterval} min (${selectedRepeatCount}x)!` : ''}`
      );
      if (onSuccess) onSuccess(newReminder);
      setTitle('');
      setNote('');
      setSelectedInterval(0);
      setSelectedRepeatCount(1);
      onClose();
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to create reminder.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>+ Remind Didi 📌</Text>
              <Text style={styles.headerSub}>Schedule a custom task & Masti repeat nudges</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#5C4040" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Task Title */}
            <Text style={styles.sectionLabel}>What should Didi do? *</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                placeholder="What should Didi do? e.g. Send project PDF, Call me"
                placeholderTextColor="#A88B8B"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Teasing Note */}
            <Text style={styles.sectionLabel}>Teasing Note / Extra details (Optional)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                placeholder="Extra note... varna mummy ko bol dunga 😂"
                placeholderTextColor="#A88B8B"
                multiline
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Schedule Time Chips */}
            <Text style={styles.sectionLabel}>Schedule Time</Text>
            <View style={styles.chipsRow}>
              {TIME_CHIPS.map((chip) => {
                const isSelected = selectedTimeChip === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    activeOpacity={0.8}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelectedTimeChip(chip.id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedTimeChip === 'custom' && (
              <View style={styles.customMinsRow}>
                <Text style={styles.customMinsLabel}>Minutes from now:</Text>
                <TextInput
                  style={styles.customMinsInput}
                  keyboardType="numeric"
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                />
              </View>
            )}

            {/* Masti Mode Repeat Selector */}
            <View style={styles.mastiHeaderRow}>
              <Text style={styles.sectionLabel}>"Masti Mode" Repeat Selector</Text>
              <MaterialCommunityIcons name="emoticon-devil-outline" size={18} color="#DE5462" />
            </View>
            <View style={styles.chipsRow}>
              {REPEAT_INTERVALS.map((item) => {
                const isSelected = selectedInterval === item.val;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelectedInterval(item.val)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Repeat Count */}
            {selectedInterval > 0 && (
              <View style={styles.repeatCountWrap}>
                <Text style={styles.sectionLabel}>Repeat Count</Text>
                <View style={styles.repeatCountRow}>
                  {REPEAT_COUNTS.map((cnt) => {
                    const isSelected = selectedRepeatCount === cnt;
                    return (
                      <TouchableOpacity
                        key={cnt}
                        activeOpacity={0.8}
                        style={[styles.countChip, isSelected && styles.countChipSelected]}
                        onPress={() => setSelectedRepeatCount(cnt)}
                      >
                        <Text style={[styles.countChipText, isSelected && styles.countChipTextSelected]}>
                          {cnt}x
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Set Reminder & Nudge Didi 🚀</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    backgroundColor: '#FFF9F4',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E6D2C8',
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
    fontSize: 20,
    fontWeight: '900',
    color: '#2A1B1C',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F6',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C4040',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1B1C',
  },
  mastiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#DE5462',
    borderColor: '#DE5462',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C4040',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  customMinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  customMinsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C4040',
  },
  customMinsInput: {
    width: 60,
    height: 40,
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    borderRadius: 12,
    textAlign: 'center',
    fontWeight: '800',
    color: '#2A1B1C',
  },
  repeatCountWrap: {
    marginTop: 4,
  },
  repeatCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countChip: {
    flex: 1,
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  countChipSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  countChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5C4040',
  },
  countChipTextSelected: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#DE5462',
    borderRadius: 22,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
