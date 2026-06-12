import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandLogo from "../components/BrandLogo";
import { vehicleTypes } from "../data/vehicles";
import { fontScale, getColumns, isTablet, scale } from "../utils/responsive";
import { Colors } from "../utils/theme";

const VehicleListScreen = ({ route, navigation }) => {
  const { type } = route.params;
  const vehicleType = vehicleTypes.find((v) => v.id === type);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [customModel, setCustomModel] = useState("");
  const [showModels, setShowModels] = useState(false);
  const insets = useSafeAreaInsets();
  const numColumns = isTablet ? getColumns(160) : 3;

  const filteredBrands =
    vehicleType?.brands.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setShowModels(true);
  };

  const handleModelSelect = async (model) => {
    if (model === "Model Lain") {
      setModalVisible(true);
      return;
    }
    Alert.alert("Konfirmasi", `Pilih ${selectedBrand.name} ${model}?`, [
      { text: "Batal", style: "cancel" },
      { text: "Pilih", onPress: () => saveVehicle(selectedBrand.name, model) },
    ]);
  };

  const handleCustomModel = () => {
    if (customModel.trim()) {
      saveVehicle(selectedBrand.name, customModel.trim());
      setModalVisible(false);
      setCustomModel("");
    }
  };

  const saveVehicle = async (brand, model) => {
    try {
      const stored = await AsyncStorage.getItem("userVehicles");
      const vehicles = stored ? JSON.parse(stored) : [];
      const newVehicle = {
        id: Date.now().toString(),
        type,
        brand,
        model,
        year: new Date().getFullYear(),
        currentKm: 0,
        lastOilChange: 0,
        oilType: "mineral",
        addedDate: new Date().toISOString(),
        trackingEnabled: false,
        lastLocation: null,
        totalDistance: 0,
      };
      vehicles.push(newVehicle);
      await AsyncStorage.setItem("userVehicles", JSON.stringify(vehicles));
      Alert.alert("Berhasil", `${brand} ${model} ditambahkan!`, [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("VehicleDetail", { vehicle: newVehicle }),
        },
      ]);
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan kendaraan");
    }
  };

  const renderBrandItem = ({ item }) => (
    <TouchableOpacity
      style={styles.brandCard}
      onPress={() => handleBrandSelect(item)}
      activeOpacity={0.82}
    >
      <LinearGradient
        colors={["#141420", "#0F0F1A"]}
        style={styles.brandCardInner}
      >
        <BrandLogo
          brandId={item.id}
          type={type}
          size={scale(44)}
          tintColor="C9A75D"
          variant="gold"
        />
        <Text style={styles.brandName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.brandCount}>{item.models.length} model</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderModelItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modelRow}
      onPress={() => handleModelSelect(item)}
      activeOpacity={0.8}
    >
      <View style={styles.modelBullet} />
      <Text style={styles.modelName}>{item}</Text>
      <Text style={styles.modelArrow}>›</Text>
    </TouchableOpacity>
  );

  // Model view
  if (showModels && selectedBrand) {
    return (
      <LinearGradient
        colors={["#05050A", "#0A0A14", "#05050A"]}
        style={styles.container}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + scale(14) }]}>
          <TouchableOpacity
            onPress={() => setShowModels(false)}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <BrandLogo
            brandId={selectedBrand.id}
            type={type}
            size={scale(34)}
            tintColor="C9A75D"
            variant="gold"
            style={{ marginRight: scale(10) }}
          />
          <View>
            <Text style={styles.topBarEyebrow}>
              {type === "motor" ? "MOTOR" : "MOBIL"}
            </Text>
            <Text style={styles.topBarTitle}>{selectedBrand.name}</Text>
          </View>
        </View>

        <FlatList
          data={selectedBrand.models}
          renderItem={renderModelItem}
          keyExtractor={(item, i) => i.toString()}
          contentContainerStyle={[
            styles.modelList,
            { paddingBottom: insets.bottom + scale(20) },
          ]}
        />

        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
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
              <Text style={styles.modalTitle}>Model Lainnya</Text>
              <Text style={styles.modalSub}>
                Masukkan nama model yang tidak ada di daftar
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Contoh: Vario 160 ABS"
                placeholderTextColor={Colors.textMuted}
                value={customModel}
                onChangeText={setCustomModel}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setModalVisible(false);
                    setCustomModel("");
                  }}
                >
                  <Text style={styles.cancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleCustomModel}
                >
                  <LinearGradient
                    colors={["#C9A75D", "#E2C27A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtnInner}
                  >
                    <Text style={styles.saveText}>Simpan</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>
      </LinearGradient>
    );
  }

  // Brand grid
  return (
    <LinearGradient
      colors={["#05050A", "#0A0A14", "#05050A"]}
      style={styles.container}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + scale(14) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.topBarEyebrow}>PILIH MEREK</Text>
          <Text style={styles.topBarTitle}>
            {type === "motor" ? "Motor" : "Mobil"}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIconText}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari merek..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredBrands.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Merek tidak ditemukan</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBrands}
          renderItem={renderBrandItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={{ gap: scale(10) }}
          contentContainerStyle={[
            styles.brandGrid,
            { paddingBottom: insets.bottom + scale(20) },
          ]}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
  },
  backBtn: {
    width: scale(40),
    height: scale(40),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(6),
  },
  backIcon: { color: Colors.gold, fontSize: fontScale(22), fontWeight: "600" },
  topBarEyebrow: {
    fontSize: fontScale(9),
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.gold,
  },
  topBarTitle: {
    fontSize: fontScale(20),
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: scale(12),
    marginHorizontal: scale(16),
    marginBottom: scale(16),
    paddingHorizontal: scale(14),
  },
  searchIconText: {
    color: Colors.textMuted,
    fontSize: fontScale(17),
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    paddingVertical: scale(12),
    fontSize: fontScale(14),
    color: Colors.textPrimary,
  },
  clearBtn: {
    color: Colors.textMuted,
    fontSize: fontScale(13),
    padding: scale(4),
  },

  // Brand grid
  brandGrid: { paddingHorizontal: scale(16) },
  brandCard: {
    flex: 1,
    marginBottom: scale(10),
    borderRadius: scale(16),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,167,93,0.12)",
  },
  brandCardInner: {
    paddingVertical: scale(18),
    paddingHorizontal: scale(8),
    alignItems: "center",
    borderRadius: scale(16),
  },
  brandName: {
    color: Colors.textPrimary,
    fontSize: fontScale(12),
    fontWeight: "700",
    marginTop: scale(10),
    textAlign: "center",
  },
  brandCount: {
    color: Colors.textMuted,
    fontSize: fontScale(10),
    marginTop: scale(2),
    letterSpacing: 0.5,
  },

  // Model list
  modelList: { paddingHorizontal: scale(16), paddingTop: scale(6) },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: scale(12),
    paddingVertical: scale(15),
    paddingHorizontal: scale(16),
    marginBottom: scale(7),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  modelBullet: {
    width: scale(4),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: Colors.gold,
    marginRight: scale(13),
  },
  modelName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: fontScale(14),
    fontWeight: "500",
  },
  modelArrow: {
    color: Colors.gold,
    fontSize: fontScale(18),
    fontWeight: "300",
  },

  // Empty
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIcon: { fontSize: scale(40), marginBottom: scale(12) },
  emptyText: { color: Colors.textMuted, fontSize: fontScale(15) },

  // Modal
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
    marginBottom: scale(5),
  },
  modalSub: {
    color: Colors.textMuted,
    fontSize: fontScale(13),
    marginBottom: scale(20),
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    paddingVertical: scale(13),
    color: Colors.textPrimary,
    fontSize: fontScale(15),
    marginBottom: scale(20),
  },
  modalActions: { flexDirection: "row", gap: scale(10) },
  cancelBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(12),
    paddingVertical: scale(14),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: fontScale(14),
  },
  saveBtn: { flex: 1, borderRadius: scale(12), overflow: "hidden" },
  saveBtnInner: { paddingVertical: scale(14), alignItems: "center" },
  saveText: { color: "#09090F", fontWeight: "700", fontSize: fontScale(14) },
});

export default VehicleListScreen;
