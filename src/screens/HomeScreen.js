import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandLogo from "../components/BrandLogo";
import { fontScale, getColumns, isTablet, scale } from "../utils/responsive";
import { Colors } from "../utils/theme";

const HomeScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const numColumns = isTablet ? getColumns(240) : 1;

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, []),
  );

  const loadVehicles = async () => {
    try {
      const stored = await AsyncStorage.getItem("userVehicles");
      if (stored) setVehicles(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  const getOilMeta = (vehicle) => {
    if (!vehicle.currentKm && !vehicle.lastOilChange)
      return { pct: 0, color: Colors.gold, label: "Belum ada data" };
    const map = {
      motor: {
        mineral: 2000,
        semiSintetis: 3500,
        fullSintetis: 5000,
        default: 2500,
      },
      mobil: {
        mineral: 5000,
        semiSintetis: 7500,
        fullSintetis: 10000,
        default: 10000,
      },
    };
    const intervals = map[vehicle.type] || map.mobil;
    const interval = intervals[vehicle.oilType] || intervals.default;
    const traveled = (vehicle.currentKm || 0) - (vehicle.lastOilChange || 0);
    const pct = Math.min(100, (traveled / interval) * 100);
    const remaining = Math.max(0, interval - traveled);
    let color = Colors.safe;
    let label = `${Math.floor(remaining).toLocaleString("id-ID")} km lagi`;
    if (pct >= 100) {
      color = Colors.danger;
      label = "Ganti sekarang";
    } else if (pct >= 80) {
      color = Colors.warn;
      label = `${Math.floor(remaining).toLocaleString("id-ID")} km lagi`;
    }
    return { pct, color, label };
  };

  const renderVehicleCard = ({ item }) => {
    const { pct, color, label } = getOilMeta(item);
    const brandId = (item.brand || "").toLowerCase().replace(/[^a-z]/g, "");
    const oilLabel =
      item.oilType === "fullSintetis"
        ? "Full Sintetis"
        : item.oilType === "semiSintetis"
          ? "Semi Sintetis"
          : "Mineral";
    const isAlert = pct >= 80;

    return (
      <TouchableOpacity
        style={[styles.card, isTablet && styles.cardTablet]}
        onPress={() => navigation.navigate("VehicleDetail", { vehicle: item })}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#141420", "#0F0F1A"]}
          style={styles.cardInner}
        >
          {/* Top row */}
          <View style={styles.cardTop}>
            <BrandLogo
              brandId={brandId}
              type={item.type}
              size={scale(52)}
              tintColor="C9A75D"
              variant="gold"
            />
            <View style={styles.cardMeta}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.brand} {item.model}
              </Text>
              <Text style={styles.cardSub}>
                {item.type === "motor" ? "Motor" : "Mobil"} ·{" "}
                {item.year || new Date().getFullYear()}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
          </View>

          {/* Gold hairline divider */}
          <View style={styles.hairline} />

          {/* Progress bar */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${pct}%`, backgroundColor: color },
                ]}
              />
            </View>
            <View style={styles.progressFooter}>
              <Text style={[styles.progressLabel, { color }]}>{label}</Text>
              <Text style={styles.progressPct}>{pct.toFixed(0)}%</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>ODOMETER</Text>
              <Text style={styles.statVal}>
                {(item.currentKm || 0).toLocaleString("id-ID")} km
              </Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>TIPE OLI</Text>
              <Text style={styles.statVal}>{oilLabel}</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={[styles.statVal, { color }]}>
                {pct >= 100 ? "Kritis" : pct >= 80 ? "Perhatian" : "Baik"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#05050A", "#0A0A14", "#05050A"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + scale(20) }]}>
        <View>
          <Text style={styles.eyebrow}>GARASI SAYA</Text>
          <Text style={styles.headerTitle}>Kendaraan</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{vehicles.length}</Text>
        </View>
      </View>

      {/* Add buttons */}
      <View style={styles.addRow}>
        {[
          { type: "motor", icon: "🏍️", label: "Tambah Motor" },
          { type: "mobil", icon: "🚗", label: "Tambah Mobil" },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.type}
            style={styles.addCard}
            onPress={() =>
              navigation.navigate("VehicleList", { type: btn.type })
            }
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={["#1C1A10", "#141208"]}
              style={styles.addCardInner}
            >
              <Text style={styles.addCardIcon}>{btn.icon}</Text>
              <Text style={styles.addCardLabel}>{btn.label}</Text>
              <View style={styles.addPlus}>
                <Text style={styles.addPlusText}>+</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {vehicles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔧</Text>
          <Text style={styles.emptyTitle}>Garasi Kosong</Text>
          <Text style={styles.emptyDesc}>
            Tambahkan kendaraan pertama Anda{"\n"}untuk mulai monitoring oli
          </Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleCard}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={numColumns > 1 ? { gap: scale(14) } : undefined}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + scale(20) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadVehicles();
                setRefreshing(false);
              }}
              tintColor={Colors.gold}
              colors={[Colors.gold]}
            />
          }
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: scale(22),
    paddingBottom: scale(20),
  },
  eyebrow: {
    fontSize: fontScale(10),
    fontWeight: "700",
    letterSpacing: 2.5,
    color: Colors.gold,
    marginBottom: scale(4),
  },
  headerTitle: {
    fontSize: fontScale(32),
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  countBadge: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: Colors.gold, fontWeight: "700", fontSize: fontScale(17) },

  // Add buttons
  addRow: {
    flexDirection: "row",
    paddingHorizontal: scale(22),
    gap: scale(12),
    marginBottom: scale(24),
  },
  addCard: {
    flex: 1,
    borderRadius: scale(16),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.2)",
    shadowColor: "#C9A75D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  addCardInner: {
    paddingVertical: scale(18),
    paddingHorizontal: scale(14),
    alignItems: "center",
    position: "relative",
  },
  addCardIcon: { fontSize: scale(32), marginBottom: scale(6) },
  addCardLabel: {
    color: Colors.textSecondary,
    fontSize: fontScale(12),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  addPlus: {
    position: "absolute",
    top: scale(10),
    right: scale(12),
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "rgba(201,167,93,0.2)",
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPlusText: {
    color: Colors.gold,
    fontSize: fontScale(14),
    fontWeight: "700",
    lineHeight: fontScale(16),
  },

  // Card
  listContent: { paddingHorizontal: scale(22) },
  card: {
    marginBottom: scale(14),
    borderRadius: scale(20),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTablet: { flex: 1, maxWidth: "48%" },
  cardInner: { padding: scale(18), borderRadius: scale(20) },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(14),
  },
  cardMeta: { flex: 1, marginLeft: scale(13) },
  cardName: {
    color: Colors.textPrimary,
    fontSize: fontScale(16),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  cardSub: {
    color: Colors.textMuted,
    fontSize: fontScale(11),
    marginTop: scale(3),
    letterSpacing: 0.3,
  },
  statusDot: { width: scale(9), height: scale(9), borderRadius: scale(5) },

  hairline: {
    height: 1,
    backgroundColor: "rgba(201,167,93,0.12)",
    marginBottom: scale(14),
  },

  progressWrap: { marginBottom: scale(14) },
  progressTrack: {
    height: scale(4),
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: scale(2),
    overflow: "hidden",
    marginBottom: scale(7),
  },
  progressFill: { height: "100%", borderRadius: scale(2) },
  progressFooter: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: fontScale(12), fontWeight: "600" },
  progressPct: {
    fontSize: fontScale(12),
    color: Colors.textMuted,
    fontWeight: "600",
  },

  statsRow: { flexDirection: "row", alignItems: "center" },
  statCell: { flex: 1 },
  statSep: {
    width: 1,
    height: scale(28),
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: scale(12),
  },
  statLabel: {
    fontSize: fontScale(9),
    fontWeight: "700",
    letterSpacing: 1.2,
    color: Colors.textMuted,
    marginBottom: scale(3),
  },
  statVal: {
    fontSize: fontScale(13),
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Empty
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: scale(80),
  },
  emptyIcon: { fontSize: scale(56), marginBottom: scale(16) },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: fontScale(20),
    fontWeight: "700",
    marginBottom: scale(8),
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: fontScale(14),
    textAlign: "center",
    lineHeight: scale(22),
  },
});

export default HomeScreen;
