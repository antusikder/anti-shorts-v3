import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SettingsProvider } from "@/context/SettingsContext";
import { WorkoutProvider } from "@/context/WorkoutContext";
import { MindsetProvider } from "@/context/MindsetContext";
import PinLockScreen from "@/components/PinLockScreen";
import { C } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [pinRequired, setPinRequired] = useState(false);
  const [hasCheckedPin, setHasCheckedPin] = useState(false);
  const [notifPermsRequested, setNotifPermsRequested] = useState(false);

  // Check PIN on startup and every app foreground event
  const checkPin = useCallback(async () => {
    try {
      const storedPin = await SecureStore.getItemAsync("app_pin");
      if (storedPin) {
        setPinRequired(true);
      }
    } catch {
      // SecureStore failure — don't block user
    } finally {
      setHasCheckedPin(true);
    }
  }, []);

  // Request notification permissions
  const requestNotifPerms = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    } catch {
      // Ignore permission errors
    } finally {
      setNotifPermsRequested(true);
    }
  }, []);

  useEffect(() => {
    checkPin();
    requestNotifPerms();
  }, []);

  // Re-check PIN when app comes back to foreground (background → active)
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState: AppStateStatus) => {
      if (nextState === "active" && hasCheckedPin) {
        try {
          const storedPin = await SecureStore.getItemAsync("app_pin");
          if (storedPin) {
            setPinRequired(true);
          }
        } catch {}
      }
    });
    return () => sub.remove();
  }, [hasCheckedPin]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && hasCheckedPin) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, hasCheckedPin]);

  if ((!fontsLoaded && !fontError) || !hasCheckedPin) return null;

  if (pinRequired) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <PinLockScreen onUnlocked={() => setPinRequired(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ErrorBoundary>
        <SettingsProvider>
          <WorkoutProvider>
            <MindsetProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="settings" options={{ presentation: "modal" }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </GestureHandlerRootView>
            </MindsetProvider>
          </WorkoutProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
