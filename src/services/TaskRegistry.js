/**
 * TaskRegistry.js
 * ===============
 * Daftarkan background GPS task di sini.
 * File ini WAJIB di-import di App.js (atau entry point) sebelum
 * komponen apapun di-render, agar TaskManager bisa menjalankan
 * task ini saat app di-background.
 *
 * Cara pakai di App.js:
 *   import "./src/services/TaskRegistry";  // baris pertama setelah imports lain
 */

import * as TaskManager from "expo-task-manager";
import { TRACKING_TASK, updateCurrentSession } from "./TrackingService";

TaskManager.defineTask(TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[GPS Task] Error:", error.message);
    return;
  }

  if (!data || !data.locations || data.locations.length === 0) return;

  try {
    for (const location of data.locations) {
      const coord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      // Abaikan koordinat dengan akurasi buruk (> 50m)
      if (coord.accuracy && coord.accuracy > 50) continue;

      await updateCurrentSession(coord);
    }
  } catch (e) {
    console.error("[GPS Task] updateCurrentSession error:", e);
  }
});
