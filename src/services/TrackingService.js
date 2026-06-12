/**
 * TrackingService.js
 * ==================
 * Engine GPS tracking yang berjalan di background menggunakan
 * expo-location TaskManager. Menyimpan semua data ke AsyncStorage
 * sehingga histori tidak hilang ketika app ditutup.
 *
 * Data yang disimpan per kendaraan:
 *  - trackingActive: boolean
 *  - sessions: array sesi perjalanan (start, end, distance, coords)
 *  - totalTrackedKm: total jarak yang sudah direkam
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

export const TRACKING_TASK = "OIL_CHANGE_GPS_TRACKING";

// ─── Haversine formula: hitung jarak antara 2 koordinat (km) ───────────────
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Key storage helpers ───────────────────────────────────────────────────
const activeVehicleKey = () => "tracking_active_vehicle";
const sessionKey = (vehicleId) => `tracking_sessions_${vehicleId}`;
const lastCoordKey = () => "tracking_last_coord";
const currentSessionKey = () => "tracking_current_session";

// ─── Simpan/baca kendaraan yang sedang aktif tracking ─────────────────────
export const setActiveTrackingVehicle = async (vehicleId) => {
  if (vehicleId) {
    await AsyncStorage.setItem(activeVehicleKey(), vehicleId);
  } else {
    await AsyncStorage.removeItem(activeVehicleKey());
  }
};

export const getActiveTrackingVehicle = async () => {
  return await AsyncStorage.getItem(activeVehicleKey());
};

// ─── Session management ────────────────────────────────────────────────────
export const startNewSession = async (vehicleId) => {
  const session = {
    id: Date.now().toString(),
    vehicleId,
    startTime: new Date().toISOString(),
    endTime: null,
    distanceKm: 0,
    coords: [],
  };
  await AsyncStorage.setItem(currentSessionKey(), JSON.stringify(session));
  return session;
};

export const getCurrentSession = async () => {
  const raw = await AsyncStorage.getItem(currentSessionKey());
  return raw ? JSON.parse(raw) : null;
};

export const updateCurrentSession = async (newCoord) => {
  const session = await getCurrentSession();
  if (!session) return null;

  // Ambil koordinat terakhir
  const lastRaw = await AsyncStorage.getItem(lastCoordKey());
  const lastCoord = lastRaw ? JSON.parse(lastRaw) : null;

  let addedKm = 0;
  if (lastCoord) {
    const dist = haversineKm(
      lastCoord.latitude,
      lastCoord.longitude,
      newCoord.latitude,
      newCoord.longitude,
    );
    // Filter noise: abaikan koordinat < 5m atau > 200m per update
    if (dist >= 0.005 && dist <= 0.2) {
      addedKm = dist;
    }
  }

  // Simpan koordinat baru sebagai last
  await AsyncStorage.setItem(lastCoordKey(), JSON.stringify(newCoord));

  // Update session
  session.distanceKm = parseFloat((session.distanceKm + addedKm).toFixed(4));
  if (session.coords.length < 500) {
    // simpan max 500 titik per sesi
    session.coords.push({
      lat: parseFloat(newCoord.latitude.toFixed(6)),
      lon: parseFloat(newCoord.longitude.toFixed(6)),
      t: Date.now(),
    });
  }
  await AsyncStorage.setItem(currentSessionKey(), JSON.stringify(session));
  return { session, addedKm };
};

export const endCurrentSession = async () => {
  const session = await getCurrentSession();
  if (!session) return null;

  session.endTime = new Date().toISOString();

  // Simpan ke histori kendaraan
  const raw = await AsyncStorage.getItem(sessionKey(session.vehicleId));
  const sessions = raw ? JSON.parse(raw) : [];
  sessions.unshift(session); // terbaru di atas

  // Batasi histori 100 sesi per kendaraan
  if (sessions.length > 100) sessions.splice(100);
  await AsyncStorage.setItem(
    sessionKey(session.vehicleId),
    JSON.stringify(sessions),
  );

  // Perbarui odometer kendaraan di userVehicles
  await addKmToVehicle(session.vehicleId, session.distanceKm);

  // Bersihkan state aktif
  await AsyncStorage.removeItem(currentSessionKey());
  await AsyncStorage.removeItem(lastCoordKey());

  return session;
};

// ─── Tambahkan jarak ke currentKm kendaraan ───────────────────────────────
const addKmToVehicle = async (vehicleId, distanceKm) => {
  try {
    const raw = await AsyncStorage.getItem("userVehicles");
    if (!raw) return;
    const vehicles = JSON.parse(raw);
    const idx = vehicles.findIndex((v) => v.id === vehicleId);
    if (idx !== -1) {
      const addedM = Math.round(distanceKm * 1000);
      vehicles[idx].currentKm = (vehicles[idx].currentKm || 0) + addedM / 1000;
      vehicles[idx].totalDistance =
        (vehicles[idx].totalDistance || 0) + distanceKm;
      vehicles[idx].lastTrackingDate = new Date().toISOString();
      await AsyncStorage.setItem("userVehicles", JSON.stringify(vehicles));
    }
  } catch (e) {
    console.error("addKmToVehicle error:", e);
  }
};

// ─── Baca histori sesi kendaraan ──────────────────────────────────────────
export const getVehicleSessions = async (vehicleId) => {
  const raw = await AsyncStorage.getItem(sessionKey(vehicleId));
  return raw ? JSON.parse(raw) : [];
};

export const deleteSession = async (vehicleId, sessionId) => {
  const sessions = await getVehicleSessions(vehicleId);
  const updated = sessions.filter((s) => s.id !== sessionId);
  await AsyncStorage.setItem(sessionKey(vehicleId), JSON.stringify(updated));
};

export const clearAllSessions = async (vehicleId) => {
  await AsyncStorage.removeItem(sessionKey(vehicleId));
};

// ─── Mulai GPS tracking (foreground + background) ─────────────────────────
export const startTracking = async (vehicleId) => {
  // Minta izin foreground
  const { status: fgStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") {
    throw new Error("Izin lokasi foreground diperlukan.");
  }

  // Minta izin background
  const { status: bgStatus } =
    await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") {
    throw new Error(
      "Izin lokasi background diperlukan agar tracking tetap berjalan saat app ditutup.",
    );
  }

  // Cek apakah task sudah terdaftar
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TRACKING_TASK);

  // Simpan kendaraan aktif & mulai sesi baru
  await setActiveTrackingVehicle(vehicleId);
  await startNewSession(vehicleId);

  if (!isRegistered) {
    // Mulai background location task
    await Location.startLocationUpdatesAsync(TRACKING_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 10, // update setiap 10 meter
      timeInterval: 10000, // atau setiap 10 detik
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Oil Change — Tracking Aktif",
        notificationBody: "Merekam jarak perjalanan kendaraan Anda",
        notificationColor: "#C9A75D",
      },
      pausesUpdatesAutomatically: false,
    });
  }

  // Tandai kendaraan sebagai tracking
  await updateVehicleTrackingState(vehicleId, true);
  return true;
};

// ─── Hentikan GPS tracking ────────────────────────────────────────────────
export const stopTracking = async (vehicleId) => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TRACKING_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(TRACKING_TASK);
    }
  } catch (e) {
    console.warn("stopTracking:", e.message);
  }

  const session = await endCurrentSession();
  await setActiveTrackingVehicle(null);
  await updateVehicleTrackingState(vehicleId, false);
  return session;
};

// ─── Cek apakah tracking sedang aktif ─────────────────────────────────────
export const isTrackingActive = async (vehicleId) => {
  const activeId = await getActiveTrackingVehicle();
  if (activeId !== vehicleId) return false;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TRACKING_TASK);
    return isRegistered;
  } catch {
    return false;
  }
};

// ─── Update status trackingEnabled di userVehicles ────────────────────────
const updateVehicleTrackingState = async (vehicleId, enabled) => {
  try {
    const raw = await AsyncStorage.getItem("userVehicles");
    if (!raw) return;
    const vehicles = JSON.parse(raw);
    const idx = vehicles.findIndex((v) => v.id === vehicleId);
    if (idx !== -1) {
      vehicles[idx].trackingEnabled = enabled;
      await AsyncStorage.setItem("userVehicles", JSON.stringify(vehicles));
    }
  } catch (e) {
    console.error("updateVehicleTrackingState:", e);
  }
};

// ─── Format helpers ────────────────────────────────────────────────────────
export const formatKm = (km) => {
  if (!km && km !== 0) return "0 km";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
};

export const formatDuration = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  const diff = Math.floor((end - start) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
};

export const formatDateTime = (isoString) => {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default {
  TRACKING_TASK,
  startTracking,
  stopTracking,
  isTrackingActive,
  getVehicleSessions,
  getCurrentSession,
  deleteSession,
  clearAllSessions,
  formatKm,
  formatDuration,
  formatDateTime,
  haversineKm,
};
