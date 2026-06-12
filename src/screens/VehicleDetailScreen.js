/**
 * VehicleDetailScreen.js
 * ======================
 * Detail kendaraan dengan:
 * - Status oli (gauge + progress bar)
 * - Input odometer & KM ganti oli terakhir
 * - Pilih tipe oli
 * - Tombol buka TrackingScreen (GPS tracking terpisah)
 * - Simpan data & reset oli
 * - Hapus kendaraan
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandLogo from "../components/BrandLogo";
import { isTrackingActive } from "../services/TrackingService";
import { fontScale, isTablet, scale } from "../utils/responsive";
import { Colors } from "../utils/theme";

const VehicleDetailScreen = ({ route, navigation }) => {
  const [vehicle, setVehicle] = useState(route.params.vehicle);
  const [currentKm, setCurrentKm] = useState(
    route.params.vehicle.currentKm?.toString() || "",
  );
  const [lastOilChange, setLastOilChange] = useState(
    route.params.vehicle.lastOilChange?.toString() || "",
  );
  const [oilType, setOilType] = useState(
    route.params.vehicle.oilType || "mineral",
  );
  const [trackingActive, setTrackingActive] = useState(false);
  const [showOilModal, setShowOilModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const insets = useSafeAreaInsets();
  const brandId = (vehicle.brand || "").toLowerCase().replace(/[^a-z]/g, "");

  // Cek status tracking saat screen difokus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refreshVehicle();
      checkTracking();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (trackingActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [trackingActive]);

  const refreshVehicle = async () => {
    const raw = await AsyncStorage.getItem("userVehicles");
    if (!raw) return;
    const vehicles = JSON.parse(raw);
    const updated = vehicles.find((v) => v.id === vehicle.id);
    if (updated) {
      setVehicle(updated);
      setCurrentKm(updated.currentKm?.toString() || "");
      setLastOilChange(updated.lastOilChange?.toString() || "");
      setOilType(updated.oilType || "mineral");
    }
  };

  const checkTracking = async () => {
    const active = await isTrackingActive(vehicle.id);
    setTrackingActive(active);
  };

  // ─── Kalkulasi oli ────────────────────────────────────────────────────────
  const oilIntervals = {
    motor: { mineral: 2000, semiSintetis: 3500, fullSintetis: 5000 },
    mobil: { mineral: 5000, semiSintetis: 7500, fullSintetis: 10000 },
  };
  const interval = oilIntervals[vehicle.type]?.[oilType] || 5000;
  const traveled =
    (parseFloat(currentKm) || 0) - (parseFloat(lastOilChange) || 0);
  const remaining = Math.max(0, interval - traveled);
  const pct = Math.min(100, Math.max(0, (traveled / interval) * 100));

  const statusColor =
    pct >= 100 ? Colors.danger : pct >= 80 ? Colors.warn : Colors.safe;
  const statusGlow =
    pct >= 100
      ? Colors.dangerGlow
      : pct >= 80
        ? Colors.warnGlow
        : Colors.safeGlow;
  const statusText =
    pct >= 100
      ? "KRITIS — SEGERA GANTI"
      : pct >= 80
        ? "PERHATIAN — HAMPIR HABIS"
        : "KONDISI BAIK";

  // ─── Simpan data ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const raw = await AsyncStorage.getItem("userVehicles");
      if (!raw) {
        Alert.alert("Error", "Data tidak ditemukan");
        return;
      }
      const vehicles = JSON.parse(raw);
      const idx = vehicles.findIndex((v) => v.id === vehicle.id);
      if (idx !== -1) {
        vehicles[idx] = {
          ...vehicles[idx],
          currentKm: parseFloat(currentKm) || 0,
          lastOilChange: parseFloat(lastOilChange) || 0,
          oilType,
        };
        await AsyncStorage.setItem("userVehicles", JSON.stringify(vehicles));
        setVehicle(vehicles[idx]);
        Alert.alert("Tersimpan", "Data kendaraan berhasil diperbarui.");
      }
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan data.");
    }
    setSaving(false);
  };

  // ─── Reset oli ────────────────────────────────────────────────────────────
  const handleResetOil = () => {
    const km = parseFloat(currentKm);
    if (!km) {
      Alert.alert(
        "Data Belum Lengkap",
        "Masukkan odometer saat ini terlebih dahulu.",
      );
      return;
    }
    Alert.alert(
      "Konfirmasi Ganti Oli",
      `Tandai bahwa ${vehicle.brand} ${vehicle.model} sudah ganti oli di ${km.toLocaleString("id-ID")} km?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Sudah Ganti",
          onPress: async () => {
            try {
              const raw = await AsyncStorage.getItem("userVehicles");
              if (!raw) return;
              const vehicles = JSON.parse(raw);
              const idx = vehicles.findIndex((v) => v.id === vehicle.id);
              if (idx !== -1) {
                vehicles[idx].lastOilChange = km;
                vehicles[idx].currentKm = km;
                vehicles[idx].oilType = oilType;
                vehicles[idx].lastOilChangeDate = new Date().toISOString();
                await AsyncStorage.setItem(
                  "userVehicles",
                  JSON.stringify(vehicles),
                );
                setLastOilChange(km.toString());
                setVehicle(vehicles[idx]);
                Alert.alert("Berhasil", "Data ganti oli telah direset.");
              }
            } catch (e) {
              Alert.alert("Error", "Gagal mereset data oli.");
            }
          },
        },
      ],
    );
  };

  // ─── Hapus kendaraan ──────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      "Hapus Kendaraan",
      `Hapus ${vehicle.brand} ${vehicle.model} dari garasi? Semua data termasuk histori tracking akan hilang.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const raw = await AsyncStorage.getItem("userVehicles");
            const vehicles = JSON.parse(raw || "[]");
            const filtered = vehicles.filter((v) => v.id !== vehicle.id);
            await AsyncStorage.setItem(
              "userVehicles",
              JSON.stringify(filtered),
            );
            navigation.goBack();
          },
        },
      ],
    );
  };

  // ─── Opsi tipe oli ────────────────────────────────────────────────────────
  const oilOptions = [
    {
      id: "mineral",
      name: "Mineral",
      km: oilIntervals[vehicle.type]?.mineral || 2000,
      desc: "Oli standar, cocok untuk pemakaian harian",
    },
    {
      id: "semiSintetis",
      name: "Semi Sintetis",
      km: oilIntervals[vehicle.type]?.semiSintetis || 3500,
      desc: "Performa lebih baik, harga terjangkau",
    },
    {
      id: "fullSintetis",
      name: "Full Sintetis",
      km: oilIntervals[vehicle.type]?.fullSintetis || 5000,
      desc: "Proteksi mesin maksimal, interval terpanjang",
    },
  ];

  const oilTypeLabel =
    oilType === "fullSintetis"
      ? "Full Sintetis"
      : oilType === "semiSintetis"
        ? "Semi Sintetis"
        : "Mineral";

  return (
    <LinearGradient
      colors={["#05050A", "#0A0A14", "#05050A"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + scale(14),
          paddingBottom: insets.bottom + scale(30),
        }}
      >
        {/* Nav */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inner, { maxWidth: isTablet ? 620 : undefined }]}>
          {/* ── Hero card ───────────────────────────────────────────────── */}
          <LinearGradient
            colors={["#141420", "#0C0C18"]}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <BrandLogo
                brandId={brandId}
                type={vehicle.type}
                size={scale(72)}
                tintColor="C9A75D"
                variant="gold"
              />
              <View style={styles.heroMeta}>
                <Text style={styles.heroEyebrow}>
                  {vehicle.type === "motor" ? "MOTOR" : "MOBIL"} ·{" "}
                  {vehicle.year || new Date().getFullYear()}
                </Text>
                <Text style={styles.heroName} numberOfLines={2}>
                  {vehicle.brand} {vehicle.model}
                </Text>
              </View>
            </View>

            {/* Status banner */}
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: statusGlow,
                  borderColor: statusColor + "40",
                },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </LinearGradient>

          {/* ── Oil gauge ────────────────────────────────────────────────── */}
          <LinearGradient
            colors={["#141420", "#0C0C18"]}
            style={styles.gaugeCard}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>STATUS OLI</Text>
              <Text style={[styles.gaugePercent, { color: statusColor }]}>
                {pct.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.gaugeCenter}>
              <View style={styles.gaugeDial}>
                <View
                  style={[
                    styles.gaugeDialInner,
                    { borderColor: statusColor + "55" },
                  ]}
                >
                  <Text style={[styles.gaugeValue, { color: statusColor }]}>
                    {pct.toFixed(0)}
                    <Text style={styles.gaugeUnit}>%</Text>
                  </Text>
                  <Text style={styles.gaugeSubLabel}>terpakai</Text>
                </View>
              </View>
            </View>

            <View style={styles.linearTrack}>
              <View
                style={[
                  styles.linearFill,
                  { width: `${pct}%`, backgroundColor: statusColor },
                ]}
              />
            </View>

            <View style={styles.statsGrid}>
              {[
                {
                  label: "SISA JARAK",
                  value: `${Math.floor(remaining).toLocaleString("id-ID")} km`,
                  color: statusColor,
                },
                {
                  label: "INTERVAL",
                  value: `${interval.toLocaleString("id-ID")} km`,
                  color: Colors.textPrimary,
                },
                {
                  label: "DITEMPUH",
                  value: `${Math.max(0, Math.floor(traveled)).toLocaleString("id-ID")} km`,
                  color: Colors.textPrimary,
                },
              ].map((s, i) => (
                <View key={i} style={styles.statCell}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={[styles.statValue, { color: s.color }]}>
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* ── Input data ───────────────────────────────────────────────── */}
          <LinearGradient
            colors={["#141420", "#0C0C18"]}
            style={styles.dataCard}
          >
            <Text style={styles.sectionLabel}>DATA KILOMETER</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>ODOMETER SAAT INI</Text>
                <TextInput
                  style={styles.input}
                  value={currentKm}
                  onChangeText={setCurrentKm}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>KM GANTI OLI TERAKHIR</Text>
                <TextInput
                  style={styles.input}
                  value={lastOilChange}
                  onChangeText={setLastOilChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Oil type selector */}
            <Text style={[styles.inputLabel, { marginBottom: scale(8) }]}>
              TIPE OLI
            </Text>
            <TouchableOpacity
              style={styles.oilSelector}
              onPress={() => setShowOilModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.oilSelectorLeft}>
                <View style={styles.oilDot} />
                <Text style={styles.oilSelectorText}>{oilTypeLabel}</Text>
              </View>
              <Text style={styles.oilSelectorInterval}>
                {interval.toLocaleString("id-ID")} km
              </Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* ── GPS Tracking card ────────────────────────────────────────── */}
          <LinearGradient
            colors={["#141420", "#0C0C18"]}
            style={styles.trackCard}
          >
            <View style={styles.trackRow}>
              <View style={styles.trackLeft}>
                <Text style={styles.sectionLabel}>GPS TRACKING</Text>
                <Text style={styles.trackDesc}>
                  Rekam & histori perjalanan otomatis
                </Text>
                {trackingActive && (
                  <Animated.View
                    style={[
                      styles.trackActiveBadge,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <View style={styles.trackActiveDot} />
                    <Text style={styles.trackActiveText}>SEDANG AKTIF</Text>
                  </Animated.View>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.trackBtn,
                  trackingActive ? styles.trackBtnActive : styles.trackBtnIdle,
                ]}
                onPress={() => navigation.navigate("Tracking", { vehicle })}
                activeOpacity={0.82}
              >
                <Text
                  style={[
                    styles.trackBtnText,
                    {
                      color: trackingActive ? Colors.safe : Colors.gold,
                    },
                  ]}
                >
                  {trackingActive ? "Lihat Live" : "Buka"}
                </Text>
              </TouchableOpacity>
            </View>

            {vehicle.totalDistance > 0 && (
              <View style={styles.trackStatRow}>
                <View style={styles.trackStatItem}>
                  <Text style={styles.trackStatVal}>
                    {vehicle.totalDistance < 1
                      ? `${Math.round(vehicle.totalDistance * 1000)} m`
                      : `${vehicle.totalDistance.toFixed(1)} km`}
                  </Text>
                  <Text style={styles.trackStatLabel}>TOTAL TEREKAM</Text>
                </View>
                {vehicle.lastTrackingDate && (
                  <>
                    <View style={styles.trackStatSep} />
                    <View style={styles.trackStatItem}>
                      <Text style={styles.trackStatVal}>
                        {new Date(vehicle.lastTrackingDate).toLocaleDateString(
                          "id-ID",
                          { day: "2-digit", month: "short" },
                        )}
                      </Text>
                      <Text style={styles.trackStatLabel}>TERAKHIR</Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </LinearGradient>

          {/* ── Action buttons ───────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.82}
            style={styles.saveOuter}
            disabled={saving}
          >
            <LinearGradient
              colors={["#C9A75D", "#E2C27A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>
                {saving ? "MENYIMPAN..." : "SIMPAN DATA"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetOil}
            style={styles.resetBtn}
            activeOpacity={0.82}
          >
            <Text style={styles.resetBtnText}>✓ Tandai Sudah Ganti Oli</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Oil type modal ─────────────────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={showOilModal}
        onRequestClose={() => setShowOilModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#14141F", "#0F0F18"]}
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + scale(20) },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Tipe Oli</Text>

            {oilOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.oilOpt,
                  oilType === opt.id && styles.oilOptSelected,
                ]}
                onPress={() => {
                  setOilType(opt.id);
                  setShowOilModal(false);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.oilOptLeft}>
                  <Text
                    style={[
                      styles.oilOptName,
                      oilType === opt.id && { color: Colors.gold },
                    ]}
                  >
                    {opt.name}
                  </Text>
                  <Text style={styles.oilOptDesc}>{opt.desc}</Text>
                </View>
                <View style={styles.oilOptRight}>
                  <Text
                    style={[
                      styles.oilOptKm,
                      {
                        color:
                          oilType === opt.id ? Colors.gold : Colors.textMuted,
                      },
                    ]}
                  >
                    {opt.km.toLocaleString("id-ID")} km
                  </Text>
                  {oilType === opt.id && (
                    <Text style={styles.oilOptCheck}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowOilModal(false)}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { alignSelf: "center", width: "100%", paddingHorizontal: scale(16) },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingBottom: scale(10),
  },
  backBtn: { paddingVertical: scale(8), paddingRight: scale(16) },
  backIcon: { color: Colors.gold, fontSize: fontScale(22), fontWeight: "600" },
  deleteBtn: { paddingVertical: scale(8), paddingLeft: scale(16) },
  deleteIcon: { fontSize: fontScale(18) },

  // Hero
  heroCard: {
    borderRadius: scale(22),
    padding: scale(20),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.12)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(16),
  },
  heroMeta: { flex: 1, marginLeft: scale(14) },
  heroEyebrow: {
    fontSize: fontScale(10),
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.gold,
    marginBottom: scale(4),
  },
  heroName: {
    fontSize: fontScale(22),
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(8),
  },
  statusDot: { width: scale(7), height: scale(7), borderRadius: scale(4) },
  statusText: {
    fontSize: fontScale(11),
    fontWeight: "700",
    letterSpacing: 1.2,
    flex: 1,
  },

  // Gauge
  gaugeCard: {
    borderRadius: scale(22),
    padding: scale(20),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.08)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(18),
  },
  sectionLabel: {
    fontSize: fontScale(10),
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  gaugePercent: { fontSize: fontScale(22), fontWeight: "800" },
  gaugeCenter: { alignItems: "center", marginBottom: scale(16) },
  gaugeDial: {
    width: scale(136),
    height: scale(136),
    borderRadius: scale(68),
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeDialInner: {
    width: scale(112),
    height: scale(112),
    borderRadius: scale(56),
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeValue: { fontSize: fontScale(36), fontWeight: "800" },
  gaugeUnit: { fontSize: fontScale(18) },
  gaugeSubLabel: {
    fontSize: fontScale(11),
    color: Colors.textMuted,
    marginTop: scale(2),
  },
  linearTrack: {
    height: scale(5),
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: scale(3),
    overflow: "hidden",
    marginBottom: scale(16),
  },
  linearFill: { height: "100%", borderRadius: scale(3) },
  statsGrid: { flexDirection: "row" },
  statCell: { flex: 1, alignItems: "center" },
  statLabel: {
    fontSize: fontScale(9),
    fontWeight: "700",
    letterSpacing: 1.2,
    color: Colors.textMuted,
    marginBottom: scale(4),
  },
  statValue: { fontSize: fontScale(13), fontWeight: "700" },

  // Data card
  dataCard: {
    borderRadius: scale(22),
    padding: scale(20),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.08)",
  },
  inputRow: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: scale(12),
    marginBottom: scale(14),
  },
  inputHalf: { flex: 1 },
  inputLabel: {
    fontSize: fontScale(9),
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginBottom: scale(6),
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: scale(12),
    paddingHorizontal: scale(13),
    paddingVertical: scale(12),
    color: Colors.textPrimary,
    fontSize: fontScale(16),
    fontWeight: "600",
  },
  oilSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(201,167,93,0.06)",
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.2)",
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    paddingVertical: scale(13),
    gap: scale(8),
  },
  oilSelectorLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  oilDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: Colors.gold,
  },
  oilSelectorText: {
    color: Colors.textPrimary,
    fontSize: fontScale(15),
    fontWeight: "600",
  },
  oilSelectorInterval: { color: Colors.textMuted, fontSize: fontScale(12) },
  chevron: { color: Colors.gold, fontSize: fontScale(18) },

  // Tracking card
  trackCard: {
    borderRadius: scale(22),
    padding: scale(18),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.08)",
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trackLeft: { flex: 1 },
  trackDesc: {
    color: Colors.textMuted,
    fontSize: fontScale(12),
    marginTop: scale(3),
  },
  trackActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    marginTop: scale(8),
  },
  trackActiveDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(4),
    backgroundColor: Colors.safe,
  },
  trackActiveText: {
    fontSize: fontScale(10),
    fontWeight: "700",
    letterSpacing: 1.2,
    color: Colors.safe,
  },
  trackBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  trackBtnIdle: {
    borderColor: "rgba(201,167,93,0.3)",
    backgroundColor: "rgba(201,167,93,0.08)",
  },
  trackBtnActive: {
    borderColor: "rgba(61,214,140,0.3)",
    backgroundColor: "rgba(61,214,140,0.08)",
  },
  trackBtnText: { fontSize: fontScale(12), fontWeight: "700" },
  trackStatRow: {
    flexDirection: "row",
    marginTop: scale(14),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  trackStatItem: { flex: 1, alignItems: "center" },
  trackStatVal: {
    fontSize: fontScale(14),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  trackStatLabel: {
    fontSize: fontScale(9),
    fontWeight: "700",
    letterSpacing: 1.2,
    color: Colors.textMuted,
    marginTop: scale(3),
  },
  trackStatSep: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: scale(10),
  },

  // Actions
  saveOuter: {
    borderRadius: scale(14),
    overflow: "hidden",
    marginBottom: scale(10),
    shadowColor: "#C9A75D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  saveBtn: { paddingVertical: scale(17), alignItems: "center" },
  saveBtnText: {
    color: "#09090F",
    fontWeight: "800",
    fontSize: fontScale(14),
    letterSpacing: 2,
  },
  resetBtn: {
    paddingVertical: scale(16),
    alignItems: "center",
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: Colors.safe + "50",
    backgroundColor: Colors.safeGlow,
  },
  resetBtnText: {
    color: Colors.safe,
    fontWeight: "700",
    fontSize: fontScale(14),
  },

  // Oil modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    padding: scale(24),
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.15)",
  },
  modalHandle: {
    width: scale(36),
    height: scale(4),
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: scale(2),
    alignSelf: "center",
    marginBottom: scale(20),
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: fontScale(18),
    fontWeight: "700",
    marginBottom: scale(16),
  },
  oilOpt: {
    padding: scale(16),
    borderRadius: scale(14),
    marginBottom: scale(8),
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "center",
  },
  oilOptSelected: {
    borderColor: "rgba(201,167,93,0.4)",
    backgroundColor: Colors.goldGlow,
  },
  oilOptLeft: { flex: 1 },
  oilOptName: {
    color: Colors.textPrimary,
    fontSize: fontScale(15),
    fontWeight: "700",
    marginBottom: scale(3),
  },
  oilOptDesc: { color: Colors.textMuted, fontSize: fontScale(12) },
  oilOptRight: { alignItems: "flex-end" },
  oilOptKm: { fontSize: fontScale(13), fontWeight: "600" },
  oilOptCheck: {
    color: Colors.gold,
    fontSize: fontScale(16),
    marginTop: scale(4),
  },
  modalClose: {
    marginTop: scale(8),
    paddingVertical: scale(14),
    alignItems: "center",
  },
  modalCloseText: { color: Colors.textMuted, fontSize: fontScale(14) },
});

export default VehicleDetailScreen;
