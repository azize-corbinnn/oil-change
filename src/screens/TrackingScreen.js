/**
 * TrackingScreen.js
 * =================
 * Layar khusus GPS Tracking dengan:
 * - Toggle start/stop tracking real-time
 * - Live odometer sesi aktif (update tiap 3 detik)
 * - Histori semua perjalanan kendaraan
 * - Hapus sesi individual atau semua
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandLogo from "../components/BrandLogo";
import {
    clearAllSessions,
    deleteSession,
    formatDateTime,
    formatDuration,
    formatKm,
    getCurrentSession,
    getVehicleSessions,
    isTrackingActive,
    startTracking,
    stopTracking,
} from "../services/TrackingService";
import { fontScale, scale } from "../utils/responsive";
import { Colors } from "../utils/theme";

const TrackingScreen = ({ route, navigation }) => {
  const { vehicle: initialVehicle } = route.params;
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [liveKm, setLiveKm] = useState(0);
  const [liveDuration, setLiveDuration] = useState("0d");
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const brandId = (vehicle.brand || "").toLowerCase().replace(/[^a-z]/g, "");

  // ─── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    initScreen();
    return () => clearInterval(intervalRef.current);
  }, []);

  const initScreen = async () => {
    const active = await isTrackingActive(vehicle.id);
    setTracking(active);
    if (active) startPulse();
    await refreshData();
    if (active) startLiveUpdate();
  };

  const refreshData = async () => {
    const sess = await getVehicleSessions(vehicle.id);
    setSessions(sess);
    // Refresh vehicle data
    const raw = await AsyncStorage.getItem("userVehicles");
    if (raw) {
      const vehicles = JSON.parse(raw);
      const updated = vehicles.find((v) => v.id === vehicle.id);
      if (updated) setVehicle(updated);
    }
  };

  // ─── Live update setiap 3 detik saat tracking aktif ──────────────────────
  const startLiveUpdate = () => {
    intervalRef.current = setInterval(async () => {
      const sess = await getCurrentSession();
      if (sess) {
        setCurrentSession(sess);
        setLiveKm(sess.distanceKm || 0);
        setLiveDuration(formatDuration(sess.startTime, null));
      }
    }, 3000);
  };

  const stopLiveUpdate = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setCurrentSession(null);
    setLiveKm(0);
    setLiveDuration("0d");
  };

  // ─── Pulse animation ─────────────────────────────────────────────────────
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  // ─── Toggle tracking ──────────────────────────────────────────────────────
  const handleToggleTracking = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!tracking) {
        // Mulai
        await startTracking(vehicle.id);
        setTracking(true);
        startPulse();
        startLiveUpdate();
      } else {
        // Hentikan
        Alert.alert(
          "Hentikan Tracking?",
          "Sesi perjalanan ini akan disimpan ke histori dan jarak akan ditambahkan ke odometer.",
          [
            {
              text: "Batal",
              style: "cancel",
              onPress: () => setLoading(false),
            },
            {
              text: "Hentikan",
              style: "destructive",
              onPress: async () => {
                await stopTracking(vehicle.id);
                setTracking(false);
                stopPulse();
                stopLiveUpdate();
                await refreshData();
                setLoading(false);
              },
            },
          ],
        );
        return;
      }
    } catch (e) {
      Alert.alert(
        "Gagal",
        e.message || "Terjadi kesalahan saat mengaktifkan tracking.",
      );
    }
    setLoading(false);
  };

  // ─── Hapus sesi ───────────────────────────────────────────────────────────
  const handleDeleteSession = (sessionId) => {
    Alert.alert("Hapus Sesi?", "Data perjalanan ini akan dihapus permanen.", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteSession(vehicle.id, sessionId);
          await refreshData();
        },
      },
    ]);
  };

  const handleClearAll = () => {
    if (sessions.length === 0) return;
    Alert.alert(
      "Hapus Semua Histori?",
      `${sessions.length} sesi perjalanan akan dihapus permanen.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus Semua",
          style: "destructive",
          onPress: async () => {
            await clearAllSessions(vehicle.id);
            await refreshData();
          },
        },
      ],
    );
  };

  // ─── Total stats ──────────────────────────────────────────────────────────
  const totalKm = sessions.reduce((sum, s) => sum + (s.distanceKm || 0), 0);
  const totalSesi = sessions.length;

  // ─── Render sesi ─────────────────────────────────────────────────────────
  const renderSession = useCallback(
    ({ item, index }) => {
      const isToday =
        new Date(item.startTime).toDateString() === new Date().toDateString();
      return (
        <View style={styles.sessionCard}>
          <View style={styles.sessionLeft}>
            <View style={styles.sessionIndex}>
              <Text style={styles.sessionIndexText}>{totalSesi - index}</Text>
            </View>
            <View style={styles.sessionLine} />
          </View>
          <View style={styles.sessionBody}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionDateWrap}>
                {isToday && <View style={styles.todayDot} />}
                <Text style={styles.sessionDate}>
                  {formatDateTime(item.startTime)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteSession(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sessionStats}>
              <View style={styles.sessionStat}>
                <Text style={styles.sessionStatVal}>
                  {formatKm(item.distanceKm)}
                </Text>
                <Text style={styles.sessionStatLabel}>JARAK</Text>
              </View>
              <View style={styles.sessionStatSep} />
              <View style={styles.sessionStat}>
                <Text style={styles.sessionStatVal}>
                  {formatDuration(item.startTime, item.endTime)}
                </Text>
                <Text style={styles.sessionStatLabel}>DURASI</Text>
              </View>
              <View style={styles.sessionStatSep} />
              <View style={styles.sessionStat}>
                <Text style={styles.sessionStatVal}>
                  {item.coords?.length || 0}
                </Text>
                <Text style={styles.sessionStatLabel}>TITIK</Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [sessions],
  );

  // ─── Header component ─────────────────────────────────────────────────────
  const ListHeader = () => (
    <>
      {/* Tracking card */}
      <LinearGradient colors={["#141420", "#0C0C18"]} style={styles.trackCard}>
        {/* Vehicle info */}
        <View style={styles.vehicleRow}>
          <BrandLogo
            brandId={brandId}
            type={vehicle.type}
            size={scale(44)}
            tintColor="C9A75D"
            variant="gold"
          />
          <View style={styles.vehicleMeta}>
            <Text style={styles.vehicleEyebrow}>
              {vehicle.type === "motor" ? "MOTOR" : "MOBIL"}
            </Text>
            <Text style={styles.vehicleName}>
              {vehicle.brand} {vehicle.model}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              tracking ? styles.statusPillActive : styles.statusPillIdle,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                { color: tracking ? Colors.safe : Colors.textMuted },
              ]}
            >
              {tracking ? "AKTIF" : "IDLE"}
            </Text>
          </View>
        </View>

        <View style={styles.hairline} />

        {/* Live stats (tampil saat tracking aktif) */}
        {tracking ? (
          <View style={styles.liveBox}>
            <View style={styles.liveStat}>
              <Text style={[styles.liveVal, { color: Colors.safe }]}>
                {formatKm(liveKm)}
              </Text>
              <Text style={styles.liveLabel}>SESI INI</Text>
            </View>
            <View style={styles.liveStatSep} />
            <View style={styles.liveStat}>
              <Text style={[styles.liveVal, { color: Colors.gold }]}>
                {liveDuration}
              </Text>
              <Text style={styles.liveLabel}>DURASI</Text>
            </View>
            <View style={styles.liveStatSep} />
            <View style={styles.liveStat}>
              <Text style={[styles.liveVal, { color: Colors.textPrimary }]}>
                {formatKm(vehicle.currentKm || 0)}
              </Text>
              <Text style={styles.liveLabel}>ODOMETER</Text>
            </View>
          </View>
        ) : (
          <View style={styles.idleBox}>
            <Text style={styles.idleText}>
              Odometer:{" "}
              <Text style={styles.idleTextBold}>
                {formatKm(vehicle.currentKm || 0)}
              </Text>
            </Text>
            <Text style={styles.idleSubtext}>
              Total terekam:{" "}
              <Text style={{ color: Colors.gold }}>{formatKm(totalKm)}</Text>
            </Text>
          </View>
        )}

        {/* Toggle button */}
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            tracking ? styles.toggleBtnStop : styles.toggleBtnStart,
          ]}
          onPress={handleToggleTracking}
          activeOpacity={0.82}
          disabled={loading}
        >
          {tracking ? (
            <LinearGradient
              colors={["#3D0F18", "#2E0B14"]}
              style={styles.toggleBtnInner}
            >
              <Animated.View
                style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]}
              />
              <Text style={[styles.toggleBtnText, { color: Colors.danger }]}>
                HENTIKAN TRACKING
              </Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={["#C9A75D", "#E2C27A"]}
              style={styles.toggleBtnInner}
            >
              <Text style={[styles.toggleBtnText, { color: "#09090F" }]}>
                {loading ? "Memulai..." : "MULAI TRACKING"}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        {/* Info note */}
        {!tracking && (
          <Text style={styles.noteText}>
            Tracking berjalan di background. Odometer diperbarui otomatis setiap
            sesi selesai.
          </Text>
        )}
      </LinearGradient>

      {/* Summary stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryVal}>{formatKm(totalKm)}</Text>
          <Text style={styles.summaryLabel}>TOTAL TEREKAM</Text>
        </View>
        <View style={styles.summaryStatSep} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryVal}>{totalSesi}</Text>
          <Text style={styles.summaryLabel}>TOTAL SESI</Text>
        </View>
        <View style={styles.summaryStatSep} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryVal}>
            {totalSesi > 0 ? formatKm(totalKm / totalSesi) : "0 km"}
          </Text>
          <Text style={styles.summaryLabel}>RATA-RATA</Text>
        </View>
      </View>

      {/* Histori header */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Histori Perjalanan</Text>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Hapus Semua</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>📍</Text>
      <Text style={styles.emptyTitle}>Belum Ada Histori</Text>
      <Text style={styles.emptyDesc}>
        Mulai tracking untuk merekam perjalanan kendaraan Anda
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={["#05050A", "#0A0A14", "#05050A"]}
      style={styles.container}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + scale(14) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.topEyebrow}>GPS TRACKING</Text>
          <Text style={styles.topTitle}>Rekam Perjalanan</Text>
        </View>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<ListEmpty />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + scale(24) },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingBottom: scale(14),
    gap: scale(4),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(2),
  },
  backIcon: { color: Colors.gold, fontSize: fontScale(22), fontWeight: "600" },
  topEyebrow: {
    fontSize: fontScale(9),
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.gold,
  },
  topTitle: {
    fontSize: fontScale(20),
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },

  listContent: { paddingHorizontal: scale(16) },

  // Tracking card
  trackCard: {
    borderRadius: scale(22),
    padding: scale(18),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.12)",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(14),
  },
  vehicleMeta: { flex: 1, marginLeft: scale(12) },
  vehicleEyebrow: {
    fontSize: fontScale(9),
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.gold,
  },
  vehicleName: {
    fontSize: fontScale(15),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: scale(2),
  },
  statusPill: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: "rgba(61,214,140,0.1)",
    borderColor: "rgba(61,214,140,0.3)",
  },
  statusPillIdle: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  statusPillText: {
    fontSize: fontScale(9),
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  hairline: {
    height: 1,
    backgroundColor: "rgba(201,167,93,0.12)",
    marginBottom: scale(14),
  },

  // Live stats
  liveBox: { flexDirection: "row", marginBottom: scale(16) },
  liveStat: { flex: 1, alignItems: "center" },
  liveVal: { fontSize: fontScale(18), fontWeight: "800", letterSpacing: -0.3 },
  liveLabel: {
    fontSize: fontScale(8),
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginTop: scale(3),
  },
  liveStatSep: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: scale(8),
  },

  idleBox: { marginBottom: scale(16), alignItems: "center" },
  idleText: { fontSize: fontScale(13), color: Colors.textSecondary },
  idleTextBold: { color: Colors.textPrimary, fontWeight: "700" },
  idleSubtext: {
    fontSize: fontScale(12),
    color: Colors.textMuted,
    marginTop: scale(4),
  },

  // Toggle button
  toggleBtn: {
    borderRadius: scale(14),
    overflow: "hidden",
    marginBottom: scale(10),
  },
  toggleBtnStart: {},
  toggleBtnStop: { borderWidth: 1, borderColor: "rgba(255,69,96,0.3)" },
  toggleBtnInner: {
    paddingVertical: scale(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  pulseDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: Colors.danger,
  },
  toggleBtnText: {
    fontSize: fontScale(13),
    fontWeight: "800",
    letterSpacing: 2,
  },
  noteText: {
    fontSize: fontScale(11),
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: scale(17),
  },

  // Summary stats
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: scale(14),
    marginBottom: scale(16),
  },
  summaryStat: { flex: 1, alignItems: "center" },
  summaryVal: {
    fontSize: fontScale(15),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: fontScale(8),
    fontWeight: "700",
    letterSpacing: 1.2,
    color: Colors.textMuted,
    marginTop: scale(3),
  },
  summaryStatSep: { width: 1, backgroundColor: "rgba(255,255,255,0.07)" },

  // History header
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(10),
  },
  historyTitle: {
    fontSize: fontScale(15),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  clearAllText: { fontSize: fontScale(12), color: Colors.danger },

  // Session card
  sessionCard: { flexDirection: "row", marginBottom: scale(10) },
  sessionLeft: {
    alignItems: "center",
    width: scale(28),
    marginRight: scale(10),
  },
  sessionIndex: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionIndexText: {
    color: Colors.gold,
    fontSize: fontScale(10),
    fontWeight: "700",
  },
  sessionLine: {
    flex: 1,
    width: 1,
    backgroundColor: "rgba(201,167,93,0.1)",
    marginTop: scale(4),
  },
  sessionBody: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: scale(14),
    padding: scale(13),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: scale(4),
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(10),
  },
  sessionDateWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  todayDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: Colors.safe,
  },
  sessionDate: { fontSize: fontScale(11), color: Colors.textSecondary },
  deleteIcon: { fontSize: fontScale(12), color: Colors.textMuted },
  sessionStats: { flexDirection: "row" },
  sessionStat: { flex: 1, alignItems: "center" },
  sessionStatVal: {
    fontSize: fontScale(13),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sessionStatLabel: {
    fontSize: fontScale(8),
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.textMuted,
    marginTop: scale(2),
  },
  sessionStatSep: { width: 1, backgroundColor: "rgba(255,255,255,0.07)" },

  // Empty
  emptyWrap: { alignItems: "center", paddingVertical: scale(40) },
  emptyIcon: { fontSize: scale(44), marginBottom: scale(12) },
  emptyTitle: {
    fontSize: fontScale(16),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: scale(6),
  },
  emptyDesc: {
    fontSize: fontScale(13),
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: scale(20),
    paddingHorizontal: scale(20),
  },
});

export default TrackingScreen;
