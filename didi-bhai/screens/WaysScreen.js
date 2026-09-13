import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WAYS_DATA, CATEGORIES } from '../src/data/ways';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FAVORITES_STORAGE_KEY = '@sanjana_favorite_ways';

const UNFOLD_PHOTOS = [
  require('../assets/sister_illustration.jpg'),
  require('../assets/goa_memory.jpg'),
];

export default function WaysScreen({ currentUser, onBack }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [surpriseWay, setSurpriseWay] = useState(null);
  const [isSurpriseVisible, setIsSurpriseVisible] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to load favorites:', err);
    }
  };

  const toggleFavorite = async (wayId) => {
    try {
      let updatedFavorites;
      if (favorites.includes(wayId)) {
        updatedFavorites = favorites.filter((id) => id !== wayId);
      } else {
        updatedFavorites = [...favorites, wayId];
      }
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    } catch (err) {
      console.warn('Failed to update favorites:', err);
    }
  };

  const handleSurpriseMe = () => {
    const randomIndex = Math.floor(Math.random() * WAYS_DATA.length);
    setSurpriseWay(WAYS_DATA[randomIndex]);
    setIsSurpriseVisible(true);
  };

  const filteredWays = WAYS_DATA.filter((way) => {
    if (selectedCategory === 'Favorites ❤️') {
      return favorites.includes(way.id);
    }
    if (selectedCategory === 'All') {
      return true;
    }
    return way.category === selectedCategory;
  });

  const categoryList = [...CATEGORIES, 'Favorites ❤️'];

  useEffect(() => {
    setCurrentIndex(0);
    if (flatListRef.current && filteredWays.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedCategory]);

  const handleMomentumScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index >= 0 && index < filteredWays.length) {
      setCurrentIndex(index);
    }
  };

  const renderEditorialCard = ({ item, index }) => {
    const isFav = favorites.includes(item.id);
    const photoSource = UNFOLD_PHOTOS[index % UNFOLD_PHOTOS.length];

    // Editorial Tag pills mapped from sibling categories
    const secondaryTag =
      item.category === 'Pure Love ❤️'
        ? 'Real Talks'
        : item.category === 'Chai & Food ☕'
        ? 'Chai Breaks'
        : item.category === 'Queen Energy 👑'
        ? 'Queen Energy'
        : 'Pure Bakchodi';

    return (
      <View style={styles.cardSlide}>
        <View style={styles.unfoldCard}>
          {/* Top Image Section (48% of card height) */}
          <View style={styles.imageContainer}>
            <Image
              source={photoSource}
              style={styles.cardPhoto}
              resizeMode="cover"
            />
            {/* Top Overlay Badge & Heart Button */}
            <View style={styles.photoHeaderOverlay}>
              <View style={styles.reasonBadgePill}>
                <Text style={styles.reasonBadgeText}>#{item.id}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.heartBtn}
                onPress={() => toggleFavorite(item.id)}
              >
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFav ? '#E11D48' : '#374151'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Content Body */}
          <View style={styles.cardBody}>
            {/* Tag Pills Row */}
            <View style={styles.tagPillRow}>
              <View style={styles.primaryTagPill}>
                <Text style={styles.primaryTagText}>{item.category}</Text>
              </View>
              <View style={styles.secondaryTagPill}>
                <Text style={styles.secondaryTagText}>{secondaryTag}</Text>
              </View>
            </View>

            {/* Editorial Serif Headline Quote */}
            <Text style={styles.editorialTitle} numberOfLines={2}>
              "{item.title}"
            </Text>

            {/* Thoughtful Description */}
            <ScrollView
              style={styles.descScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <Text style={styles.editorialDescription}>{item.description}</Text>
            </ScrollView>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.footerLine} />
              <View style={styles.footerBottomRow}>
                <Text style={styles.appIdentifierText}>sanjana.didismiles</Text>
                <View style={styles.footerRightBranding}>
                  <FontAwesome5 name="crown" size={11} color="#9CA3AF" style={{ marginRight: 4 }} />
                  <Text style={styles.brandingText}>Sanjana</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.rootContainer}>
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Screen Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerBackBtn}
            onPress={() => onBack && onBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleText}>52 Ways Why</Text>
            <Text style={styles.headerSubtitleText}>Sanjana Didi Has to Smile ❤️</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.surpriseBtn}
            onPress={handleSurpriseMe}
          >
            <Feather name="gift" size={15} color="#111827" style={{ marginRight: 4 }} />
            <Text style={styles.surpriseBtnText}>Surprise! 🎁</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Category Pill Filter Bar */}
        <View style={styles.categoryCarouselWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categoryList.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Progress Badge */}
        {filteredWays.length > 0 && (
          <View style={styles.progressTrackerRow}>
            <Text style={styles.progressTrackerText}>
              REASON {currentIndex + 1} OF {filteredWays.length}
            </Text>
          </View>
        )}

        {/* Horizontal Editorial Photo-Card Swiper */}
        {filteredWays.length > 0 ? (
          <View style={styles.swiperContainer}>
            <FlatList
              ref={flatListRef}
              data={filteredWays}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderEditorialCard}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Reasons Found</Text>
            <Text style={styles.emptySub}>
              {selectedCategory === 'Favorites ❤️'
                ? "You haven't saved any favorite reasons yet!"
                : 'Try picking another category tab above!'}
            </Text>
          </View>
        )}

        {/* Surprise Me Modal */}
        <Modal
          visible={isSurpriseVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSurpriseVisible(false)}
        >
          {surpriseWay && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalCardContent}>
                <View style={styles.modalCelebrationBanner}>
                  <Text style={styles.modalCelebrationText}>🎉 Surprise Smile Reason! 🎁</Text>
                </View>

                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalReasonNumber}>Reason #{surpriseWay.id}</Text>
                  <TouchableOpacity
                    onPress={() => setIsSurpriseVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color="#374151" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalEmoji}>{surpriseWay.emoji}</Text>
                <Text style={styles.modalEditorialTitle}>"{surpriseWay.title}"</Text>

                <View style={styles.modalTagPill}>
                  <Text style={styles.modalTagText}>{surpriseWay.category}</Text>
                </View>

                <ScrollView style={styles.modalDescScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalDescText}>{surpriseWay.description}</Text>
                </ScrollView>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.modalRollBtn}
                    onPress={handleSurpriseMe}
                  >
                    <Ionicons name="dice" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.modalRollText}>Another One 🎲</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.modalFavBtn}
                    onPress={() => toggleFavorite(surpriseWay.id)}
                  >
                    <Ionicons
                      name={favorites.includes(surpriseWay.id) ? 'heart' : 'heart-outline'}
                      size={22}
                      color={favorites.includes(surpriseWay.id) ? '#E11D48' : '#6B7280'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 1,
  },
  surpriseBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  surpriseBtnText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryCarouselWrap: {
    marginVertical: 4,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: {
    backgroundColor: '#4C1D95',
    borderColor: '#4C1D95',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  progressTrackerRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  progressTrackerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
  },
  swiperContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardSlide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  unfoldCard: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.64,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    height: '46%',
    width: '100%',
    position: 'relative',
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  photoHeaderOverlay: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonBadgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  reasonBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  tagPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  primaryTagPill: {
    backgroundColor: '#4C1D95',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  primaryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryTagPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  secondaryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B21A8',
  },
  editorialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 27,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  descScroll: {
    maxHeight: 90,
  },
  editorialDescription: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 21,
  },
  cardFooter: {
    marginTop: 8,
    gap: 10,
  },
  footerLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  footerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appIdentifierText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  footerRightBranding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCardContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
  },
  modalCelebrationBanner: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  modalCelebrationText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B21A8',
  },
  modalHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalReasonNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 48,
    marginVertical: 10,
  },
  modalEditorialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalTagPill: {
    backgroundColor: '#4C1D95',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginVertical: 8,
  },
  modalTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalDescScroll: {
    maxHeight: 120,
    marginVertical: 8,
  },
  modalDescText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 21,
    textAlign: 'center',
  },
  modalActionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalRollBtn: {
    flex: 1,
    backgroundColor: '#4C1D95',
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRollText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalFavBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
