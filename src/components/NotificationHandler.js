import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

/**
 * NotificationHandler
 * Polls vehicles every 5 minutes and shows an Alert when oil is due.
 * Logic unchanged; no UI rendered.
 */
const NotificationHandler = () => {
  const checkInterval = useRef(null);

  useEffect(() => {
    checkInterval.current = setInterval(checkAllVehicles, 300000);
    setTimeout(checkAllVehicles, 5000);
    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, []);

  const checkAllVehicles = async () => {
    try {
      const stored = await AsyncStorage.getItem("userVehicles");
      if (!stored) return;
      const vehicles = JSON.parse(stored);
      const now = Date.now();
      for (const v of vehicles) {
        if (v.currentKm && v.lastOilChange !== undefined)
          await checkVehicle(v, now);
      }
    } catch (e) {
      console.error("NotificationHandler:", e);
    }
  };

  const checkVehicle = async (vehicle, now) => {
    const map = {
      motor: { mineral: 2000, semiSintetis: 3500, fullSintetis: 5000 },
      mobil: { mineral: 5000, semiSintetis: 7500, fullSintetis: 10000 },
    };
    const interval =
      map[vehicle.type]?.[vehicle.oilType] ||
      (vehicle.type === "motor" ? 2500 : 10000);
    const pct = ((vehicle.currentKm - vehicle.lastOilChange) / interval) * 100;

    const key = `last_alert_${vehicle.id}`;
    const lastAlert = await AsyncStorage.getItem(key);
    if (lastAlert && now - parseInt(lastAlert) < 86400000) return;

    const remaining = Math.max(
      0,
      interval - (vehicle.currentKm - vehicle.lastOilChange),
    );

    if (pct >= 100) {
      showAlert(
        "Ganti Oli Sekarang",
        `${vehicle.brand} ${vehicle.model} sudah melampaui batas ${interval.toLocaleString("id-ID")} km.\nSegera lakukan penggantian oli.`,
      );
      await AsyncStorage.setItem(key, now.toString());
    } else if (pct >= 90) {
      showAlert(
        "Oli Hampir Habis",
        `${vehicle.brand} ${vehicle.model} — ${pct.toFixed(0)}% terpakai.\nSisa ${Math.floor(remaining).toLocaleString("id-ID")} km.`,
      );
      await AsyncStorage.setItem(key, now.toString());
    }
  };

  const showAlert = (title, message) => {
    setTimeout(() => Alert.alert(title, message, [{ text: "OK" }]), 1000);
  };

  return null;
};

export default NotificationHandler;
