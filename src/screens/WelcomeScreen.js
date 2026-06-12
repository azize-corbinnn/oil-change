import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontScale, isTablet, scale } from "../utils/responsive";
import { Colors } from "../utils/theme";

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 35,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(lineWidth, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const handleStart = async () => {
    await AsyncStorage.setItem("hasLaunched", "true");
    navigation.replace("Home");
  };

  const features = [
    {
      label: "PELACAKAN GPS",
      desc: "Odometer otomatis berbasis lokasi",
      icon: "◈",
    },
    {
      label: "NOTIFIKASI CERDAS",
      desc: "Peringatan sebelum batas servis",
      icon: "◉",
    },
    {
      label: "MULTI-KENDARAAN",
      desc: "Motor & mobil dalam satu aplikasi",
      icon: "◎",
    },
  ];

  return (
    <LinearGradient
      colors={["#05050A", "#0A0A14", "#05050A"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#05050A" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + scale(40),
            paddingBottom: insets.bottom + scale(30),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Mark */}
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: fadeAnim, transform: [{ scale: logoScale }] },
          ]}
        >
          <LinearGradient
            colors={["#1C1A10", "#2A2412", "#1C1A10"]}
            style={styles.logoRing}
          >
            <LinearGradient
              colors={["#C9A75D", "#E2C27A", "#C9A75D"]}
              style={styles.logoInner}
            >
              <Text style={styles.logoIcon}>🛢</Text>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>

        {/* Wordmark */}
        <Animated.View
          style={[
            styles.wordmarkWrap,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.eyebrow}>PREMIUM OIL TRACKER</Text>
          <Text style={styles.title}>OilChange</Text>

          <Animated.View
            style={[
              styles.divider,
              {
                width: lineWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "32%"],
                }),
              },
            ]}
          />

          <Text style={styles.tagline}>
            Jaga mesin, lindungi investasi.{"\n"}Monitoring servis cerdas di
            genggaman Anda.
          </Text>
        </Animated.View>

        {/* Feature list */}
        <Animated.View
          style={[
            styles.featureList,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Text style={styles.featureIconText}>{f.icon}</Text>
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, { opacity: fadeAnim }]}>
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.82}
            style={styles.ctaOuter}
          >
            <LinearGradient
              colors={["#C9A75D", "#E2C27A", "#C9A75D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>MULAI SEKARANG</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.version}>v1.0.0 · Oil Change</Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const MAX_W = isTablet ? 460 : undefined;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(28),
    maxWidth: MAX_W,
    width: "100%",
    alignSelf: "center",
  },

  // Logo
  logoWrap: { marginBottom: scale(36) },
  logoRing: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.3)",
    shadowColor: "#C9A75D",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 18,
  },
  logoInner: {
    width: scale(86),
    height: scale(86),
    borderRadius: scale(43),
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: { fontSize: scale(40) },

  // Wordmark
  wordmarkWrap: {
    alignItems: "center",
    width: "100%",
    marginBottom: scale(40),
  },
  eyebrow: {
    fontSize: fontScale(10),
    fontWeight: "700",
    letterSpacing: 3,
    color: Colors.gold,
    marginBottom: scale(8),
  },
  title: {
    fontSize: fontScale(46),
    fontWeight: "800",
    letterSpacing: -1,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.gold,
    alignSelf: "center",
    marginVertical: scale(18),
    opacity: 0.7,
  },
  tagline: {
    fontSize: fontScale(14),
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: scale(22),
  },

  // Features
  featureList: { width: "100%", marginBottom: scale(36) },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(13),
    paddingHorizontal: scale(16),
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: scale(8),
  },
  featureIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(14),
  },
  featureIconText: {
    color: Colors.gold,
    fontSize: fontScale(16),
    fontWeight: "700",
  },
  featureTextWrap: { flex: 1 },
  featureLabel: {
    fontSize: fontScale(10),
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Colors.gold,
    marginBottom: scale(2),
  },
  featureDesc: { fontSize: fontScale(13), color: Colors.textSecondary },

  // CTA
  ctaWrap: { width: "100%", alignItems: "center" },
  ctaOuter: {
    width: "100%",
    borderRadius: scale(14),
    overflow: "hidden",
    shadowColor: "#C9A75D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: scale(20),
  },
  ctaButton: {
    paddingVertical: scale(18),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(10),
  },
  ctaText: {
    color: "#09090F",
    fontSize: fontScale(14),
    fontWeight: "800",
    letterSpacing: 2,
  },
  ctaArrow: { color: "#09090F", fontSize: fontScale(18), fontWeight: "300" },
  version: {
    fontSize: fontScale(11),
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});

export default WelcomeScreen;
