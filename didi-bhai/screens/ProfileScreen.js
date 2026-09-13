import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen({ currentUser, onLogout, onBack }) {
  const isDidi = currentUser?.role === 'didi';
  const displayName = currentUser?.name || (isDidi ? 'Sanjana Didi' : 'Bhai');
  const email = currentUser?.email || (isDidi ? 'sanjana@gmail.com' : 'bhai@gmail.com');
  const roleLabel = isDidi ? 'Sanjana Didi 👸' : 'Bhai 👦';

  const handleLogoutPress = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to log out of your private space?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FFF9F4', '#FDEBEA', '#FFF9F4']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <Image
                source={require('../assets/sister_illustration.jpg')}
                style={styles.avatarImg}
              />
              <View style={styles.roleBadgePill}>
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
            </View>

            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{email}</Text>

            <View style={styles.spaceBadge}>
              <Ionicons name="heart" size={14} color="#DE5462" style={{ marginRight: 4 }} />
              <Text style={styles.spaceBadgeText}>Private Space Member</Text>
            </View>
          </View>

          {/* Account Details List */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            <View style={styles.infoRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#FDEEEF' }]}>
                <Feather name="user" size={18} color="#DE5462" />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoVal}>{isDidi ? 'Sister (Didi)' : 'Brother (Bhai)'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#F3ECFB' }]}>
                <Feather name="mail" size={18} color="#6B46C1" />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoVal}>{email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#FDF3E7' }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#B45309" />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Security</Text>
                <Text style={styles.infoVal}>Passcode & JWT Encrypted</Text>
              </View>
            </View>
          </View>

          {/* Logout Action */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogoutPress}
            style={styles.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={20} color="#DE5462" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Logout Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF9F4',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2A1B1C',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  avatarImg: {
    width: 96,
    height: 104,
    borderRadius: 28,
  },
  roleBadgePill: {
    backgroundColor: '#FDECE7',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 10,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DE5462',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2A1B1C',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 2,
  },
  spaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F6',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 14,
  },
  spaceBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DE5462',
  },
  sectionWrap: {
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A1B1C',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E6E6E',
  },
  infoVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2A1B1C',
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: '#FFF5F6',
    borderWidth: 1.5,
    borderColor: '#F9D1D5',
    height: 52,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#DE5462',
    fontSize: 15,
    fontWeight: '800',
  },
});
