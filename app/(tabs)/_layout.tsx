import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "shield", selected: "shield.fill" }} />
        <Label>Shield</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="planner">
        <Icon sf={{ default: "calendar", selected: "calendar.badge.clock" }} />
        <Label>Planner</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schedule">
        <Icon sf={{ default: "clock", selected: "clock.fill" }} />
        <Label>Schedule</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bedtime">
        <Icon sf={{ default: "moon", selected: "moon.fill" }} />
        <Label>Bedtime</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gear", selected: "gearshape.fill" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const colorScheme = useColorScheme();
  const C = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.tint,
        tabBarInactiveTintColor: C.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : C.backgroundGlass,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: C.backgroundSecondary }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shield",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name={focused ? "shield.fill" : "shield"} tintColor={color} size={24} />
                  : <MaterialCommunityIcons name={focused ? "shield-check" : "shield-check-outline"} size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planner",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name={focused ? "checklist" : "checklist.unchecked"} tintColor={color} size={24} />
                  : <Feather name="check-square" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name={focused ? "clock.fill" : "clock"} tintColor={color} size={24} />
                  : <Feather name="clock" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bedtime"
        options={{
          title: "Bedtime",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name={focused ? "moon.fill" : "moon"} tintColor={color} size={24} />
                  : <MaterialCommunityIcons name={focused ? "weather-night" : "moon-waning-crescent"} size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? <SymbolView name={focused ? "gearshape.fill" : "gearshape"} tintColor={color} size={24} />
                  : <Feather name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
