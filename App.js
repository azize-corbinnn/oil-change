/**
 * App.js
 * ======
 * Entry point aplikasi.
 * PENTING: TaskRegistry harus di-import PERTAMA sebelum komponen lain
 * agar background GPS task terdaftar dengan benar.
 */

// ⚠️ WAJIB baris pertama — daftarkan background GPS task
import "./src/services/TaskRegistry";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as ExpoSplash from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NotificationHandler from "./src/components/NotificationHandler";
import HomeScreen from "./src/screens/HomeScreen";
import AppSplashScreen from "./src/screens/Splashscreen";
import TrackingScreen from "./src/screens/TrackingScreen";
import VehicleDetailScreen from "./src/screens/VehicleDetailScreen";
import VehicleListScreen from "./src/screens/VehicleListScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";

// Tahan splash bawaan Expo agar tidak langsung hilang sebelum siap
ExpoSplash.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [appReady, setAppReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // Jalankan semua inisialisasi di sini
  useEffect(() => {
    async function prepare() {
      try {
        const launched = await AsyncStorage.getItem("hasLaunched");
        setInitialRoute(launched ? "Home" : "Welcome");
      } catch {
        setInitialRoute("Welcome");
      } finally {
        setAppReady(true);
        // Sembunyikan splash bawaan Expo setelah data siap
        await ExpoSplash.hideAsync();
      }
    }

    prepare();
  }, []);

  // Dipanggil oleh SplashScreen setelah animasinya selesai
  const handleSplashFinish = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  // Tampilkan splash custom selama app belum siap ATAU animasi belum selesai
  if (!appReady || showCustomSplash) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#05050A" />
        <AppSplashScreen onFinish={handleSplashFinish} />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#05050A" />
      <NavigationContainer>
        <NotificationHandler />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "#05050A" },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="VehicleList" component={VehicleListScreen} />
          <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
          {/* Layar GPS Tracking terpisah */}
          <Stack.Screen
            name="Tracking"
            component={TrackingScreen}
            options={{ animation: "slide_from_bottom" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
