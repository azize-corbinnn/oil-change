import { oilChangeIntervals } from "../data/vehicles";

/**
 * Menghitung sisa jarak sebelum ganti oli
 */
export const calculateRemainingDistance = (vehicle) => {
  if (!vehicle || !vehicle.currentKm) return 0;

  const intervals = getIntervals(vehicle.type);
  const interval = getOilInterval(intervals, vehicle.oilType);
  const traveled = vehicle.currentKm - (vehicle.lastOilChange || 0);

  return Math.max(0, interval.km - traveled);
};

/**
 * Menghitung persentase pemakaian oli
 */
export const calculateOilUsagePercentage = (vehicle) => {
  if (!vehicle || !vehicle.currentKm) return 0;

  const intervals = getIntervals(vehicle.type);
  const interval = getOilInterval(intervals, vehicle.oilType);
  const traveled = vehicle.currentKm - (vehicle.lastOilChange || 0);

  return Math.min(100, (traveled / interval.km) * 100);
};

/**
 * Mendapatkan status oli
 */
export const getOilStatus = (vehicle) => {
  const percentage = calculateOilUsagePercentage(vehicle);

  if (percentage >= 100)
    return { status: "critical", text: "Ganti Sekarang", color: "#ff0000" };
  if (percentage >= 90)
    return { status: "warning", text: "Segera Ganti", color: "#ffaa00" };
  if (percentage >= 70)
    return { status: "attention", text: "Persiapkan", color: "#ffcc00" };
  return { status: "good", text: "Aman", color: "#4CAF50" };
};

/**
 * Mendapatkan rekomendasi interval oli
 */
export const getOilChangeRecommendation = (vehicle) => {
  const intervals = getIntervals(vehicle.type);
  const interval = getOilInterval(intervals, vehicle.oilType);
  const remaining = calculateRemainingDistance(vehicle);

  return {
    interval: interval.km,
    intervalMonths: interval.months,
    remaining: remaining,
    percentage: calculateOilUsagePercentage(vehicle),
    status: getOilStatus(vehicle),
    recommendation:
      remaining <= 0
        ? "Segera ganti oli kendaraan Anda!"
        : `Ganti oli dalam ${Math.floor(remaining)} km lagi`,
  };
};

/**
 * Format tanggal
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Konversi kilometer ke format yang readable
 */
export const formatKm = (km) => {
  if (!km && km !== 0) return "0 km";
  return `${Math.floor(km).toLocaleString("id-ID")} km`;
};

// Helper functions
function getIntervals(type) {
  return type === "motor" ? oilChangeIntervals.motor : oilChangeIntervals.mobil;
}

function getOilInterval(intervals, oilType) {
  switch (oilType) {
    case "fullSintetis":
      return intervals.fullSintetis || intervals.default;
    case "semiSintetis":
      return intervals.semiSintetis || intervals.default;
    case "mineral":
      return intervals.mineral || intervals.default;
    default:
      return intervals.default;
  }
}

export default {
  calculateRemainingDistance,
  calculateOilUsagePercentage,
  getOilStatus,
  getOilChangeRecommendation,
  formatDate,
  formatKm,
};
