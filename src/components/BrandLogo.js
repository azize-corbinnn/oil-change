/**
 * BrandLogo.js
 * ============
 * Tampilkan logo resmi merek kendaraan dari Simple Icons CDN.
 * Fallback otomatis ke inisial merek jika logo tidak tersedia atau gagal load.
 *
 * Props:
 *  - brandId     : string  — id merek misal "honda", "toyota"
 *  - type        : "motor" | "mobil"
 *  - size        : number  — ukuran kotak (default 48)
 *  - tintColor   : string  — hex tanpa '#' (default "C9A75D" = gold)
 *  - variant     : "dark" | "light" | "gold"
 *  - style       : ViewStyle tambahan
 */

import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, StyleSheet, Text } from "react-native";
import { getBrandLogoUrl } from "../data/brandLogos";

const BrandLogo = ({
  brandId = "",
  type = "motor",
  size = 48,
  tintColor = "C9A75D",
  variant = "dark",
  style,
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const logoUrl = getBrandLogoUrl(brandId, tintColor);
  const showImage = !!logoUrl && !imgError;

  // Fallback: ambil 2 huruf pertama nama brand
  const initials = brandId
    ? brandId
        .replace(/[^a-z]/gi, "")
        .substring(0, 2)
        .toUpperCase()
    : type === "motor"
      ? "MT"
      : "MB";

  const gradients = {
    dark: ["#1C1C28", "#141420"],
    light: ["#F0EDE8", "#E0DBD2"],
    gold: ["#2A2210", "#1E1A0A"],
  };

  const borderColors = {
    dark: "rgba(255,255,255,0.08)",
    light: "rgba(0,0,0,0.1)",
    gold: "rgba(201,167,93,0.3)",
  };

  const textColor = variant === "light" ? "#333" : "#C9A75D";
  const fontSize = size * 0.3;

  return (
    <LinearGradient
      colors={gradients[variant] || gradients.dark}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          borderColor: borderColors[variant] || borderColors.dark,
        },
        style,
      ]}
    >
      {/* Logo image — selalu di-render jika ada URL, tapi transparan saat belum load */}
      {showImage && (
        <Image
          source={{ uri: logoUrl }}
          style={[
            { width: size * 0.58, height: size * 0.58 },
            !imgLoaded && { opacity: 0, position: "absolute" },
          ]}
          resizeMode="contain"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}

      {/* Fallback inisial — tampil jika image belum/tidak bisa load */}
      {(!showImage || !imgLoaded) && (
        <Text
          style={{
            fontSize,
            fontWeight: "700",
            color: textColor,
            letterSpacing: -0.5,
          }}
        >
          {initials}
        </Text>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
});

export default BrandLogo;
