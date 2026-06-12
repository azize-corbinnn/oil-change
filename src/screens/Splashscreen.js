import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { height } = Dimensions.get("window");

const BG = "#05050A";
const GOLD = "#C9A75D";
const GOLD_DIM = "rgba(201,167,93,0.15)";
const WHITE = "#FFFFFF";
const WHITE_DIM = "rgba(255,255,255,0.22)";

const OilDropIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 30 30" fill="none">
    <Path
      d="M15 4C15 4 8 9 8 16.5C8 20.64 11.13 24 15 24C18.87 24 22 20.64 22 16.5C22 9 15 4 15 4Z"
      fill="rgba(255,255,255,0.95)"
    />
    <Path
      d="M15 10C15 10 11 13.5 11 17.5C11 19.71 12.79 21.5 15 21.5C17.21 21.5 19 19.71 19 17.5C19 13.5 15 10 15 10Z"
      fill="rgba(5,5,10,0.45)"
    />
  </Svg>
);

const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeDotAnim = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(540 - delay),
        ]),
      );

    Animated.parallel([
      makeDotAnim(dot1, 0),
      makeDotAnim(dot2, 180),
      makeDotAnim(dot3, 360),
    ]).start();
  }, []);

  const dotStyle = (dot) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [
      { scale: dot.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
    ],
  });

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, dotStyle(dot1)]} />
      <Animated.View style={[styles.dot, dotStyle(dot2)]} />
      <Animated.View style={[styles.dot, dotStyle(dot3)]} />
    </View>
  );
};

export default function AppSplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(bottomOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <Animated.View
        style={[
          styles.ring,
          styles.ringOuter,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          styles.ringInner,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />

      <View style={styles.glow} />

      <Animated.View
        style={[
          styles.centerGroup,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.iconBox}>
          <OilDropIcon />
        </View>

        <Text style={styles.appName}>CRBN Oil Change</Text>

        <View style={styles.divider} />

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          RAWAT KENDARAAN ANDA
        </Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.bottomArea, { opacity: bottomOpacity }]}>
        <LoadingDots />
        <Text style={styles.byText}>by: azizeee</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: 9999,
    borderColor: GOLD_DIM,
    borderWidth: 0.5,
  },
  ringInner: {
    width: 200,
    height: 200,
  },
  ringOuter: {
    width: 320,
    height: 320,
    borderColor: "rgba(201,167,93,0.05)",
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: GOLD_DIM,
    opacity: 0.6,
    top: height / 2 - 180,
  },
  centerGroup: {
    alignItems: "center",
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: "700",
    color: WHITE,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  divider: {
    width: 36,
    height: 0.8,
    backgroundColor: GOLD,
    opacity: 0.45,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 10,
    fontWeight: "500",
    color: GOLD,
    letterSpacing: 3,
    opacity: 0.85,
  },
  bottomArea: {
    position: "absolute",
    bottom: 44,
    alignItems: "center",
    gap: 10,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  byText: {
    fontSize: 11,
    color: WHITE_DIM,
    letterSpacing: 1,
    marginTop: 4,
  },
});
