import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SettingsProvider } from "@/context/SettingsContext";
import { PlannerProvider } from "@/context/PlannerContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

import { useSettings } from "@/context/SettingsContext";
import Colors from "@/constants/colors";
import { useColorScheme } from "react-native";
import CalculatorDecoy from "@/components/CalculatorDecoy";

function RootLayoutNav() {
  const { settings, isLoaded } = useSettings();
  const colorScheme = useColorScheme();
  const C = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  if (!isLoaded) return null;

  const showLock = settings.privacy.pin && !isUnlocked;
  
  if (showLock) {
    return <CalculatorDecoy 
      correctPin={settings.privacy.pin} 
      C={C} 
      onUnlock={() => setIsUnlocked(true)} 
    />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <PlannerProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </PlannerProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
