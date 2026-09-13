import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import DidiReminderBanner from '../components/DidiReminderBanner';
import BhaiReminderModal from '../components/BhaiReminderModal';
import { useReminders } from '../src/hooks/useReminders';

export default function HomeScreen({ currentUser, onNavigateToChat, onNavigateToProfile, onNavigateToReminders, onNavigateToGames, onNavigateToWays, onNavigateToMemories }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Home');
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const { reminders, setReminders } = useReminders(currentUser);

  const isBhai = currentUser?.role === 'bhai';
  const isDidi = currentUser?.role === 'didi';

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Good Morning Didi',
        greetingIcon: <MaterialCommunityIcons name="coffee" size={24} color="#5C4040" style={{ marginLeft: 6 }} />,
        subtitle: 'Aaj ka din tumhare naam!',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: 'Good Afternoon Didi',
        greetingIcon: <MaterialCommunityIcons name="flower" size={24} color="#DE5462" style={{ marginLeft: 6 }} />,
        subtitle: 'Aaj ka din tumhare naam!',
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: 'Good Evening Didi',
        greetingIcon: <Ionicons name="partly-sunny" size={24} color="#F59E0B" style={{ marginLeft: 6 }} />,
        subtitle: 'Chai ka time ho gaya!',
      };
    } else {
      return {
        greeting: 'Raat ho gayi Didi',
        greetingIcon: <Ionicons name="moon" size={22} color="#6B46C1" style={{ marginLeft: 6 }} />,
        subtitle: 'Ab so bhi jao, kal subah baat karenge!',
      };
    }
  };

  const { greeting, greetingIcon, subtitle } = getGreetingData();

  const quickAccessGrid = [
    {
      id: '52ways',
      title: '52 Ways',
      subtitle: 'Special notes for you',
      iconComponent: (
        <MaterialCommunityIcons name="email-heart-outline" size={26} color="#DE5462" />
      ),
      bg: '#FDEEEF',
      border: '#F9D1D5',
    },
    {
      id: 'games',
      title: 'Play Games',
      subtitle: 'Fun & challenges',
      iconComponent: (
        <Ionicons name="game-controller" size={26} color="#6B46C1" />
      ),
      bg: '#F3ECFB',
      border: '#DEC7F7',
    },
    {
      id: 'chai',
      title: 'Chai Corner',
      subtitle: 'Gupshup & daily talks',
      iconComponent: (
        <MaterialCommunityIcons name="coffee" size={26} color="#B45309" />
      ),
      bg: '#FDF3E7',
      border: '#F5D7B5',
    },
    {
      id: 'chat',
      title: 'Private Chat',
      subtitle: 'Our secret corner',
      iconComponent: (
        <Ionicons name="chatbubble-ellipses" size={26} color="#DE5462" />
      ),
      bg: '#FDEEEF',
      border: '#F9D1D5',
    },
  ];

  return (
    <View style={styles.rootContainer}>
      <LinearGradient
        colors={['#F9D0B8', '#FDE7D8', '#FFF6EF', '#FFF9F4']}
        locations={[0, 0.22, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity activeOpacity={0.7} style={styles.topBarBtn}>
            <Feather name="menu" size={20} color="#3A2525" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                Didi & Bhai
              </Text>
              <Ionicons name="heart" size={15} color="#C94F5B" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.headerSub}>
              Our Private Space
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.topBarBtn}
            onPress={() => onNavigateToReminders && onNavigateToReminders()}
          >
            <Feather name="bell" size={20} color="#3A2525" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Didi's Pending Reminder Banner Widget */}
          <DidiReminderBanner
            reminders={reminders}
            onReminderCompleted={(completed) => {
              setReminders((prev) =>
                prev.map((r) => (r._id === completed._id ? completed : r))
              );
            }}
          />

          {/* Bhai's Remind Didi Quick Action Banner */}
          {isBhai && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bhaiRemindBanner}
              onPress={() => setReminderModalVisible(true)}
            >
              <View style={styles.bhaiRemindLeft}>
                <View style={styles.bhaiRemindIconCircle}>
                  <Ionicons name="pin" size={20} color="#DE5462" />
                </View>
                <View>
                  <Text style={styles.bhaiRemindTitle}>Remind Didi 📌</Text>
                  <Text style={styles.bhaiRemindSub}>Schedule call, chai, or doc reminders</Text>
                </View>
              </View>
              <Ionicons name="add-circle" size={24} color="#DE5462" />
            </TouchableOpacity>
          )}

          {/* Greeting Section */}
          <View style={styles.greetingContainer}>
            <View style={styles.greetingTitleRow}>
              <Text style={styles.greetingTitle}>
                {greeting}
              </Text>
              {greetingIcon}
            </View>
            <View style={styles.greetingSubRow}>
              <Text style={styles.greetingSub}>
                {subtitle}
              </Text>
              <Ionicons name="heart" size={13} color="#F59E0B" style={{ marginLeft: 4 }} />
            </View>
          </View>

          {/* 1. SMILE OF THE MOMENT (Featured Card) */}
          <View style={styles.featuredCard}>
            <View style={styles.featuredTopRow}>
              {/* Left Column */}
              <View style={styles.featuredLeftCol}>
                <View style={styles.tagRow}>
                  <Text style={styles.featuredTag}>
                    SMILE OF THE MOMENT
                  </Text>
                  <Ionicons name="happy-outline" size={14} color="#D64545" style={{ marginLeft: 2 }} />
                </View>

                <View style={styles.dailyDosePill}>
                  <Text style={styles.dailyDoseText}>
                    Daily Dose
                  </Text>
                </View>

                <Text style={styles.quoteText}>
                  “Tumhari hasi bina kisi reason ke bhi sabka mood bana deti hai.”
                </Text>
              </View>

              {/* Right Column: Sister Illustration */}
              <View style={styles.illustrationWrap}>
                <Image
                  source={require('../assets/sister_illustration.jpg')}
                  style={styles.illustrationImg}
                  resizeMode="cover"
                />
                {/* Floating vector hearts */}
                <Ionicons name="heart" size={15} color="#F48FB1" style={styles.floatHeart1} />
                <Ionicons name="heart" size={13} color="#F06292" style={styles.floatHeart2} />
              </View>
            </View>

            {/* Doodle Heart Accent */}
            <View style={styles.doodleHeartWrap}>
              <Ionicons name="heart-outline" size={18} color="#E89AA5" />
            </View>

            {/* Bottom Buttons Row */}
            <View style={styles.featuredBottomRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.readMoreBtn}
                onPress={() => onNavigateToWays && onNavigateToWays()}
              >
                <Text style={styles.readMoreText}>
                  Read More
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.surpriseBtn}
                onPress={() => onNavigateToWays && onNavigateToWays()}
              >
                <Feather name="gift" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.surpriseBtnText}>
                  Surprise Me
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. WHAT'S WAITING FOR YOU? (Quick Access) */}
          <View style={styles.sectionHeaderWrap}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>
                What's Waiting For You?
              </Text>
              <Ionicons name="heart" size={15} color="#C94F5B" style={{ marginLeft: 5 }} />
            </View>
          </View>

          {/* 2-Column Grid (4 Cards) */}
          <View style={styles.gridContainer}>
            {quickAccessGrid.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={styles.gridCardVertical}
                onPress={() => {
                  if (item.id === '52ways' && onNavigateToWays) {
                    onNavigateToWays();
                  } else if (item.id === 'games' && onNavigateToGames) {
                    onNavigateToGames();
                  } else if (item.id === 'chat' && onNavigateToChat) {
                    onNavigateToChat();
                  }
                }}
              >
                <View style={[styles.quickIconContainerVertical, { backgroundColor: item.bg, borderColor: item.border }]}>
                  {item.iconComponent}
                </View>
                <Text style={styles.gridCardTitleVertical}>
                  {item.title}
                </Text>
                <Text style={styles.gridCardSubVertical}>
                  {item.subtitle}
                </Text>
                <View style={styles.chevronWrapVertical}>
                  <Ionicons name="chevron-forward" size={13} color="#C94F5B" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Tab Bar */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab('Home')}
            style={styles.navItem}
          >
            <Ionicons
              name={activeTab === 'Home' ? 'home' : 'home-outline'}
              size={22}
              color={activeTab === 'Home' ? '#C94F5B' : '#8E6E6E'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Home' ? styles.navLabelActive : styles.navLabelInactive,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab('Ways');
              if (onNavigateToWays) onNavigateToWays();
            }}
            style={styles.navItem}
          >
            <Ionicons
              name={activeTab === 'Ways' ? 'heart' : 'heart-outline'}
              size={22}
              color={activeTab === 'Ways' ? '#C94F5B' : '#8E6E6E'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Ways' ? styles.navLabelActive : styles.navLabelInactive,
              ]}
            >
              52 Smiles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab('Games');
              if (onNavigateToGames) onNavigateToGames();
            }}
            style={styles.navItem}
          >
            <Ionicons
              name={activeTab === 'Games' ? 'game-controller' : 'game-controller-outline'}
              size={22}
              color={activeTab === 'Games' ? '#C94F5B' : '#8E6E6E'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Games' ? styles.navLabelActive : styles.navLabelInactive,
              ]}
            >
              Arcade
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab('Chat');
              if (onNavigateToChat) onNavigateToChat();
            }}
            style={styles.navItem}
          >
            <Ionicons
              name={activeTab === 'Chat' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              size={22}
              color={activeTab === 'Chat' ? '#C94F5B' : '#8E6E6E'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Chat' ? styles.navLabelActive : styles.navLabelInactive,
              ]}
            >
              Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab('Profile');
              if (onNavigateToProfile) onNavigateToProfile();
            }}
            style={styles.navItem}
          >
            <Ionicons
              name={activeTab === 'Profile' ? 'person' : 'person-outline'}
              size={22}
              color={activeTab === 'Profile' ? '#C94F5B' : '#8E6E6E'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Profile' ? styles.navLabelActive : styles.navLabelInactive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
        {/* Bhai Reminder Schedule Modal */}
        <BhaiReminderModal
          visible={reminderModalVisible}
          onClose={() => setReminderModalVisible(false)}
          onSuccess={(newReminder) => {
            setReminders((prev) => [newReminder, ...prev]);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFF9F4',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 6,
  },
  topBarBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFDFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C94F5B',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 1,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DE5462',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 32,
  },
  greetingContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A1B1C',
    letterSpacing: -0.3,
  },
  greetingSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  greetingSub: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5C4040',
  },
  featuredCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 32,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F7E4DB',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 24,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredTag: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D64545',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  dailyDosePill: {
    backgroundColor: '#FDECE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginVertical: 9,
  },
  dailyDoseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D64545',
  },
  quoteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E1D1E',
    lineHeight: 21,
    marginTop: 4,
  },
  illustrationWrap: {
    width: 140,
    height: 150,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImg: {
    width: 140,
    height: 150,
    borderRadius: 24,
  },
  floatHeart1: {
    position: 'absolute',
    top: 6,
    left: -6,
  },
  floatHeart2: {
    position: 'absolute',
    top: 22,
    right: -6,
  },
  doodleHeartWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  featuredBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  readMoreBtn: {
    flex: 1,
    backgroundColor: '#FFF8F5',
    borderWidth: 1.5,
    borderColor: '#F5C7BC',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readMoreText: {
    color: '#C94F5B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  surpriseBtn: {
    flex: 1.2,
    backgroundColor: '#E15241',
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E15241',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  surpriseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionHeaderWrap: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A1B1C',
    letterSpacing: -0.2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  gridCardVertical: {
    width: '48%',
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  quickIconContainerVertical: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  gridCardTitleVertical: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2A1B1C',
    textAlign: 'center',
  },
  gridCardSubVertical: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 15,
  },
  chevronWrapVertical: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FDECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  chatCardTextCol: {
    flex: 1,
  },
  chatCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A1B1C',
  },
  chatCardSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E6E6E',
    marginTop: 3,
  },
  statsCard: {
    backgroundColor: '#FFFDFB',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F6E4DA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#C94F5B',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F3DBD0',
  },
  bhaiRemindBanner: {
    backgroundColor: '#FFFDFB',
    borderWidth: 1.5,
    borderColor: '#F9D1D5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bhaiRemindLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bhaiRemindIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FDEEEF',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bhaiRemindTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A1B1C',
  },
  bhaiRemindSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 1,
  },
  bottomNav: {
    backgroundColor: '#FFFDFB',
    borderTopWidth: 1,
    borderTopColor: '#F3E2D8',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 6,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#C94F5B',
  },
  navLabelInactive: {
    color: '#8E6E6E',
  },
});
