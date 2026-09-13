import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  // Animated Values
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const numberScale = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(0.7)).current;
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const floatHeart1 = useRef(new Animated.Value(-10)).current;
  const floatHeart2 = useRef(new Animated.Value(-10)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating hearts subtle bounce loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatHeart1, {
          toValue: -18,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(floatHeart1, {
          toValue: -10,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatHeart2, {
          toValue: -20,
          duration: 1400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(floatHeart2, {
          toValue: -10,
          duration: 1400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Pulse animation for loading indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Main Timeline Sequence (Total ~2.8s)
    Animated.sequence([
      // 0.0s: Canvas Fade In
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      // 0.3s: "52" Scale & Spring
      Animated.spring(numberScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),

      // 0.6s: Title Slide & Fade
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),

      // 1.0s: "Has to Smile 😊" Badge Scale In
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),

      // 1.3s: Illustration Image Fade & Scale In
      Animated.parallel([
        Animated.timing(imgOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(imgScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),

      // 1.7s: Subtitle Fade In
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // Hold until ~2.8s
      Animated.delay(700),
    ]).start(() => {
      if (onFinish) {
        onFinish();
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#FFF9F4', '#FDEBEA', '#F9D1D5', '#F5B0B7']}
          locations={[0, 0.3, 0.7, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Decorative Sparkles & Floating Accents */}
      <Animated.View style={[styles.floatAccent1, { transform: [{ translateY: floatHeart1 }] }]}>
        <Ionicons name="sparkles" size={26} color="#F59E0B" />
      </Animated.View>
      <Animated.View style={[styles.floatAccent2, { transform: [{ translateY: floatHeart2 }] }]}>
        <Ionicons name="heart" size={28} color="#DE5462" />
      </Animated.View>
      <Animated.View style={[styles.floatAccent3, { transform: [{ translateY: floatHeart1 }] }]}>
        <MaterialCommunityIcons name="flower-outline" size={26} color="#E05263" />
      </Animated.View>

      <View style={styles.contentWrap}>
        {/* "52" Hero Number */}
        <Animated.View style={{ transform: [{ scale: numberScale }] }}>
          <View style={styles.heroNumberBadge}>
            <Text style={styles.heroNumberText}>52</Text>
          </View>
        </Animated.View>

        {/* Title Lines */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.subTitlePrefix}>WAYS WHY</Text>
          <Text style={styles.mainTitleName}>Sanjana Didi</Text>
        </Animated.View>

        {/* "Has to Smile" Badge */}
        <Animated.View style={[styles.badgeWrap, { transform: [{ scale: badgeScale }] }]}>
          <LinearGradient
            colors={['#E05263', '#C94F5B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badgeGradient}
          >
            <Text style={styles.badgeText}>HAS TO SMILE 😊</Text>
          </LinearGradient>
        </Animated.View>

        {/* Central Illustration Frame */}
        <Animated.View
          style={[
            styles.illustrationContainer,
            {
              opacity: imgOpacity,
              transform: [{ scale: imgScale }],
            },
          ]}
        >
          <Image
            source={require('../assets/sister_illustration.jpg')}
            style={styles.illustrationImg}
            resizeMode="cover"
          />
          <View style={styles.illustrationOverlayBorder} />
        </Animated.View>

        {/* Subtitle & Loading Indicator */}
        <Animated.View style={[styles.footerWrap, { opacity: subtitleOpacity }]}>
          <Text style={styles.taglineText}>
            52 reasons. 52 little smiles. ❤️
          </Text>
          <View style={styles.loadingRow}>
            <Animated.View
              style={[
                styles.pulseDot,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text style={styles.loadingText}>Opening our private space...</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    width: width * 0.88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatAccent1: {
    position: 'absolute',
    top: '12%',
    left: '10%',
  },
  floatAccent2: {
    position: 'absolute',
    top: '14%',
    right: '12%',
  },
  floatAccent3: {
    position: 'absolute',
    bottom: '16%',
    left: '12%',
  },
  heroNumberBadge: {
    backgroundColor: '#FFFDFB',
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F9D1D5',
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 14,
  },
  heroNumberText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#DE5462',
    letterSpacing: -1,
  },
  subTitlePrefix: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8E6E6E',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  mainTitleName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#2A1B1C',
    letterSpacing: -0.5,
  },
  badgeWrap: {
    marginVertical: 14,
    borderRadius: 20,
    shadowColor: '#DE5462',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeGradient: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  illustrationContainer: {
    width: 170,
    height: 180,
    borderRadius: 32,
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#C94F5B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  illustrationImg: {
    width: '100%',
    height: '100%',
  },
  illustrationOverlayBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF80',
  },
  footerWrap: {
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C4040',
    letterSpacing: -0.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DE5462',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E6E6E',
  },
});
