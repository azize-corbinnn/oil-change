import { Dimensions, PixelRatio, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const wp = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const hp = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

export const scale = (size, factor = 0.5) => {
  const newSize = size + (wp(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const fontScale = (size) => {
  const newSize = scale(size, 0.3);
  const minSize = size * 0.85;
  const maxSize = size * 1.25;
  return Math.max(minSize, Math.min(maxSize, newSize));
};

export const isSmallDevice = SCREEN_WIDTH < 360;
export const isTablet = SCREEN_WIDTH >= 768;

export const SCREEN = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };

export const getColumns = (minItemWidth = 160) => {
  const usable = SCREEN_WIDTH - scale(40);
  const cols = Math.floor(usable / minItemWidth);
  return Math.max(1, Math.min(cols, 4));
};

export const isAndroid = Platform.OS === "android";
export const isIOS = Platform.OS === "ios";

export default {
  wp,
  hp,
  scale,
  fontScale,
  isSmallDevice,
  isTablet,
  SCREEN,
  getColumns,
  isAndroid,
  isIOS,
};
