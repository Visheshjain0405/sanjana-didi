import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import RockPaperScissorsGame from '../components/games/RockPaperScissorsGame';
import GuessMovieGame from '../components/games/GuessMovieGame';
import GuessRelativeGame from '../components/games/GuessRelativeGame';
import TicTacToeGame from '../components/games/TicTacToeGame';
import MemoryMatchGame from '../components/games/MemoryMatchGame';
import TruthOrDareGame from '../components/games/TruthOrDareGame';
import SiblingScoreboardModal from '../components/SiblingScoreboardModal';

const SIBLING_GAMES = [
  {
    id: 'rps',
    title: 'Rock, Paper, Scissors',
    subtitle: 'Classic 3-round hand battle for chai bragging rights',
    tag: 'Fast Reflex',
    emoji: '🪨📄✂️',
    iconType: 'fa5',
    iconName: 'hand-scissors',
    bg: '#FDEEEF',
    border: '#F9D1D5',
    tagColor: '#DE5462',
    description: 'Best of 3 rounds! Loser has to make the next cup of chai or do the dishes.',
    rules: ['Best 2 out of 3 rounds', 'Didi vs Bhai instant showdown', 'Loser makes chai ☕'],
    badge: 'Ready to Play',
  },
  {
    id: 'guess_person',
    title: 'Guess The Person',
    subtitle: 'Read funny sibling clues and guess who it is',
    tag: 'Family Mystery',
    emoji: '🎭🕵️',
    iconType: 'mci',
    iconName: 'incognito',
    bg: '#EBF5FF',
    border: '#BFDBFE',
    tagColor: '#2563EB',
    description: 'Guess the family member, mutual friend, or celebrity from funny secret clues before time runs out!',
    rules: ['Timer countdown per round', 'Hints unlocked every 10 seconds', 'Point streaks for speed'],
    badge: 'Ready to Play',
  },
  {
    id: 'truth_dare',
    title: 'Truth or Dare',
    subtitle: 'Spill family secrets or perform embarrassing dares',
    tag: 'Masti & Secrets',
    emoji: '🔥🤫',
    iconType: 'ion',
    iconName: 'flame',
    bg: '#FDF3E7',
    border: '#F5D7B5',
    tagColor: '#B45309',
    description: 'Spill childhood secrets, show embarrassing gallery photos, or face hilarious dares from Bhai.',
    rules: ['100+ custom sibling truths & dares', 'No backing out penalty', 'Photo proof upload'],
    badge: 'Ready to Play',
  },
  {
    id: 'dumb_charades',
    title: 'Dumb Charades (डम शराज़)',
    subtitle: 'Act out Bollywood movies and dialogues without speaking',
    tag: 'Bollywood Acting',
    emoji: '🎬🤐',
    iconType: 'mci',
    iconName: 'movie-roll',
    bg: '#F3ECFB',
    border: '#DEC7F7',
    tagColor: '#6B46C1',
    description: 'Pick a movie or dialogue card, set the 60-second timer, and act it out without uttering a single word!',
    rules: ['60-second timer', 'Bollywood movie deck', 'No talking or lip-syncing allowed'],
    badge: 'Coming Soon',
  },
  {
    id: 'guess_movie',
    title: 'Guess The Movie 🎬🍿',
    subtitle: 'Dual-mode Bollywood mystery (Image Scene vs 3 Progressive Clues)',
    tag: 'Cinephile Duel',
    emoji: '🎬🍿',
    iconType: 'ion',
    iconName: 'film-outline',
    bg: '#FFF5F6',
    border: '#F9D1D5',
    tagColor: '#DE5462',
    description: 'Create a secret movie riddle using scene screenshots or 3 progressive plot/dialogue clues!',
    rules: ['Image scene crop or 3 clues', '45s / 60s countdown timer', 'Real-time guess evaluation'],
    badge: 'Ready to Play',
  },
  {
    id: 'tictactoe',
    title: 'Didi vs Bhai Tic-Tac-Toe',
    subtitle: 'Classic 3x3 avatar battle of X and O',
    tag: '2 Players',
    emoji: '👸⚔️👦',
    iconType: 'mci',
    iconName: 'sword-cross',
    bg: '#FDEEEF',
    border: '#F9D1D5',
    tagColor: '#DE5462',
    description: 'Take turns placing your avatar emoji on the 3x3 grid. First one to align 3 symbols horizontally, vertically, or diagonally wins bragging rights!',
    rules: ['Turn-based play', 'Didi plays 👸, Bhai plays 👦', 'Best 2 out of 3 rounds'],
    badge: 'Ready to Play',
  },
  {
    id: 'chaitap',
    title: 'Chai Tap Frenzy',
    subtitle: 'Tap as many chai cups as you can in 15 seconds!',
    tag: 'Speed Blitz',
    emoji: '☕⚡',
    iconType: 'mci',
    iconName: 'coffee',
    bg: '#FDF3E7',
    border: '#F5D7B5',
    tagColor: '#B45309',
    description: 'Test your finger reflexes! Tap popping chai cups before they disappear. Don’t tap empty cups or lose points!',
    rules: ['15 second timer', 'Speed multiplier combos', 'High score leaderboards'],
    badge: 'Coming Soon',
  },
  {
    id: 'didi-quiz',
    title: 'The Didi Quiz',
    subtitle: 'How well do you know Didi & Bhai’s secrets?',
    tag: 'Trivia',
    emoji: '🧠💡',
    iconType: 'ion',
    iconName: 'bulb-outline',
    bg: '#EBF5FF',
    border: '#BFDBFE',
    tagColor: '#2563EB',
    description: 'Answer fun trivia questions about past childhood memories, favorite foods, pet peeves, and sibling secrets.',
    rules: ['10 multiple choice questions', 'Timed bonus points', 'Custom secret answers'],
    badge: 'Coming Soon',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    subtitle: 'Match hidden photo cards & pastel icons',
    tag: 'Brain Puzzle',
    emoji: '🃏✨',
    iconType: 'ion',
    iconName: 'extension-puzzle-outline',
    bg: '#F3ECFB',
    border: '#DEC7F7',
    tagColor: '#6B46C1',
    description: 'Flip pairs of hidden cards to reveal matching pictures, memories, and cute emojis in as few moves as possible.',
    rules: ['Grid card flip engine', 'Move counter tracking', 'Memory time bonus'],
    badge: 'Ready to Play',
  },
  {
    id: 'catch-chai',
    title: 'Catch The Chai',
    subtitle: 'Catch falling chai cups into your basket!',
    tag: 'Reflex Action',
    emoji: '🎯☕',
    iconType: 'ion',
    iconName: 'basket-outline',
    bg: '#EEF7F2',
    border: '#CDEBD7',
    tagColor: '#2D8A5E',
    description: 'Move your tea saucer left and right to catch falling chai cups and biscuits while dodging falling rain drops!',
    rules: ['Tilt or tap controls', 'Don’t drop more than 3 cups', 'Chai frenzy bonus round'],
    badge: 'Coming Soon',
  },
  {
    id: 'guess_location',
    title: 'Guess The Location',
    subtitle: 'Guess famous family trip spots & childhood hangouts',
    tag: 'Travel Mystery',
    emoji: '📍🗺️',
    iconType: 'ion',
    iconName: 'location-outline',
    bg: '#EBF5FF',
    border: '#BFDBFE',
    tagColor: '#0284C7',
    description: 'Identify secret vacation spots, family photo locations, and favorite street food stalls from fun memory clues!',
    rules: ['Photo clue hints', '4 multiple-choice locations', 'Bonus points for rapid guesses'],
    badge: 'Coming Soon',
  },
];

export default function GamesScreen({ onBack, socket, currentUser }) {
  const insets = useSafeAreaInsets();
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeGameId, setActiveGameId] = useState(null);
  const [isScoreboardVisible, setIsScoreboardVisible] = useState(false);

  if (activeGameId === 'rps') {
    return (
      <RockPaperScissorsGame
        socket={socket}
        currentUser={currentUser}
        onBack={() => setActiveGameId(null)}
      />
    );
  }

  if (activeGameId === 'guess_movie') {
    return (
      <GuessMovieGame
        socket={socket}
        currentUser={currentUser}
        onBack={() => setActiveGameId(null)}
      />
    );
  }

  if (activeGameId === 'guess_person') {
    return (
      <GuessRelativeGame
        socket={socket}
        currentUser={currentUser}
        onBack={() => setActiveGameId(null)}
      />
    );
  }

  if (activeGameId === 'tictactoe') {
    return (
      <TicTacToeGame
        socket={socket}
        currentUser={currentUser}
        onBack={() => setActiveGameId(null)}
      />
    );
  }

  if (activeGameId === 'memory-match') {
    return (
      <MemoryMatchGame
        socket={socket}
        currentUser={currentUser}
        onBack={() => setActiveGameId(null)}
      />
    );
  }

  if (activeGameId === 'truth_dare') {
    return (
      <TruthOrDareGame
        socket={socket}
        currentUser={currentUser}
        onBack={() => setActiveGameId(null)}
      />
    );
  }

  const renderGameIcon = (game) => {
    if (game.iconType === 'mci') {
      return <MaterialCommunityIcons name={game.iconName} size={28} color={game.tagColor} />;
    }
    if (game.iconType === 'fa5') {
      return <FontAwesome5 name={game.iconName} size={24} color={game.tagColor} />;
    }
    return <Ionicons name={game.iconName} size={26} color={game.tagColor} />;
  };

  const handleStartGame = (game) => {
    if (
      game.id === 'rps' ||
      game.id === 'guess_movie' ||
      game.id === 'guess_person' ||
      game.id === 'tictactoe' ||
      game.id === 'memory-match' ||
      game.id === 'truth_dare'
    ) {
      setActiveGameId(game.id);
      return;
    }
    Alert.alert(
      'Game Engine Unlocking Soon! 🚀',
      `"${game.title}" gameplay engine will be launched in the next update!`
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
          {onBack && (
            <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#2A1B1C" />
            </TouchableOpacity>
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.heroTitle}>Sanjana's Arcade 🕹️</Text>
            <Text style={styles.heroSub}>Chai-break sibling showdowns</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.headerRightIcon}
            onPress={() => setIsScoreboardVisible(true)}
          >
            <Ionicons name="trophy" size={20} color="#DE5462" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Game Cards List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsContainer}>
            {SIBLING_GAMES.map((game) => {
              const isBuilt = game.badge === 'Ready to Play';
              return (
                <TouchableOpacity
                  key={game.id}
                  activeOpacity={0.85}
                  style={[
                    styles.bannerGameCard,
                    { backgroundColor: game.bg, borderColor: game.border },
                    !isBuilt && styles.disabledCardStyle,
                  ]}
                  onPress={() => setSelectedGame(game)}
                >
                  {/* Left Professional Icon Container */}
                  <View style={[styles.bannerEmojiBox, { borderColor: game.border, backgroundColor: '#FFFDFB' }, !isBuilt && { opacity: 0.6 }]}>
                    {renderGameIcon(game)}
                  </View>

                  {/* Center Content Col */}
                  <View style={styles.bannerCenterCol}>
                    <View style={styles.bannerTagRow}>
                      <View style={[styles.bannerTagPill, { backgroundColor: '#FFFDFB', borderColor: game.border }]}>
                        <Text style={[styles.bannerTagText, { color: isBuilt ? game.tagColor : '#78716C' }]}>{game.tag}</Text>
                      </View>
                      <View style={[styles.bannerBadgePill, isBuilt ? styles.badgeReady : styles.badgeSoon]}>
                        <Text style={[styles.badgeText, isBuilt ? styles.badgeTextReady : styles.badgeTextSoon]}>
                          {game.badge}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.bannerTitle, !isBuilt && { color: '#57534E' }]}>{game.title}</Text>
                    <Text style={[styles.bannerSubtitle, !isBuilt && { color: '#A8A29E' }]} numberOfLines={2}>
                      {game.subtitle}
                    </Text>
                  </View>

                  {/* Right Action Button Pill */}
                  <View style={styles.bannerRightAction}>
                    <View style={[styles.bannerPlayPill, { backgroundColor: isBuilt ? game.tagColor : '#A8A29E' }]}>
                      <Ionicons name={isBuilt ? "play" : "lock-closed-outline"} size={14} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Game Preview Modal */}
      {selectedGame && (
        <Modal
          visible={!!selectedGame}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedGame(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <View style={[styles.previewEmojiCircle, { backgroundColor: selectedGame.bg, borderColor: selectedGame.border }]}>
                  {renderGameIcon(selectedGame)}
                </View>
                <TouchableOpacity onPress={() => setSelectedGame(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#5C4040" />
                </TouchableOpacity>
              </View>

              <Text style={styles.previewTitle}>{selectedGame.title}</Text>
              <Text style={styles.previewSub}>{selectedGame.subtitle}</Text>

              <View style={styles.divider} />

              <Text style={styles.previewSectionTitle}>About The Game</Text>
              <Text style={styles.previewDesc}>{selectedGame.description}</Text>

              <Text style={styles.previewSectionTitle}>Game Rules & Features</Text>
              {selectedGame.rules.map((rule, idx) => (
                <View key={idx} style={styles.ruleRow}>
                  <Ionicons name="sparkles" size={14} color={selectedGame.tagColor} style={{ marginRight: 6 }} />
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.launchBtn, { backgroundColor: selectedGame.tagColor }]}
                onPress={() => {
                  const game = selectedGame;
                  setSelectedGame(null);
                  handleStartGame(game);
                }}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.launchBtnText}>Play ▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {/* Sibling Scoreboard Modal */}
      <SiblingScoreboardModal
        visible={isScoreboardVisible}
        onClose={() => setIsScoreboardVisible(false)}
        socket={socket}
        currentUser={currentUser}
      />
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
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2A1B1C',
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 1,
  },
  headerRightIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFF5F6',
    borderWidth: 1,
    borderColor: '#F9D1D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 32,
  },
  cardsContainer: {
    gap: 14,
  },
  bannerGameCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledCardStyle: {
    opacity: 0.72,
    borderColor: '#E7E5E4',
    backgroundColor: '#F5F5F4',
  },
  bannerEmojiBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 14,
    position: 'relative',
  },
  miniEmojiBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFDFB',
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#F6E4DA',
  },
  miniEmojiText: {
    fontSize: 11,
  },
  bannerCenterCol: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bannerTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  bannerTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  bannerBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeReady: {
    backgroundColor: '#DCFCE7',
  },
  badgeSoon: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextReady: {
    color: '#15803D',
  },
  badgeTextSoon: {
    color: '#D97706',
  },
  bannerTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#2A1B1C',
  },
  bannerSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6B5252',
    marginTop: 2,
    lineHeight: 15,
  },
  bannerRightAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPlayPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewContainer: {
    width: '100%',
    backgroundColor: '#FFF9F4',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#F6E4DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  previewMiniBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFDFB',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#F6E4DA',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: '#F6E4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2A1B1C',
  },
  previewSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8E6E6E',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F6E4DA',
    marginVertical: 14,
  },
  previewSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C4040',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  previewDesc: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2A1B1C',
    lineHeight: 19,
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ruleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C4040',
  },
  launchBtn: {
    borderRadius: 20,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
