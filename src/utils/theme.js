/**
 * Design System — Oil Change Premium
 * Palette: Near-black base, champagne gold accent, cool slate surfaces
 * Signature: Hairline gold rule + tight tracking uppercase labels
 */

export const Colors = {
  // Base
  bg: "#09090F",
  bgDeep: "#05050A",
  surface: "#111118",
  surfaceUp: "#18181F",
  surfaceBorder: "rgba(255,255,255,0.06)",
  surfaceBorderGold: "rgba(201,167,93,0.25)",

  // Gold accent (premium feel)
  gold: "#C9A75D",
  goldLight: "#E2C27A",
  goldDark: "#9A7A38",
  goldGlow: "rgba(201,167,93,0.15)",

  // Status
  safe: "#3DD68C",
  safeGlow: "rgba(61,214,140,0.15)",
  warn: "#F5A524",
  warnGlow: "rgba(245,165,36,0.15)",
  danger: "#FF4560",
  dangerGlow: "rgba(255,69,96,0.15)",

  // Text
  textPrimary: "#F0EDE8",
  textSecondary: "rgba(240,237,232,0.55)",
  textMuted: "rgba(240,237,232,0.28)",
  textGold: "#C9A75D",

  // Overlays
  overlay: "rgba(9,9,15,0.85)",
};

export const Gradients = {
  bg: ["#09090F", "#0D0D18", "#09090F"],
  card: ["#141420", "#0F0F1A"],
  header: ["#141420", "#0C0C16"],
  gold: ["#C9A75D", "#E2C27A", "#C9A75D"],
  safe: ["#1A4030", "#213A2B"],
  warn: ["#3D2A0A", "#3A2A10"],
  danger: ["#3D0F18", "#2E0B14"],
  button: ["#C9A75D", "#B8923E"],
};

export const Typography = {
  display: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  h1: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  h3: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  body: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: Colors.textMuted,
  },
  mono: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  caption: { fontSize: 12, fontWeight: "500", color: Colors.textMuted },
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  full: 999,
};

export const Shadow = {
  gold: {
    shadowColor: "#C9A75D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
