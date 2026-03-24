import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { ScanSpeed } from "@/context/SettingsContext";

interface Props {
  value: ScanSpeed;
  onChange: (v: ScanSpeed) => void;
}

const SPEEDS: { key: ScanSpeed; label: string; ms: string; desc: string; icon: "battery" | "zap" | "zap-off" }[] = [
  {
    key: "battery",
    label: "Battery Saver",
    ms: "400ms",
    desc: "Slower, very efficient",
    icon: "battery",
  },
  {
    key: "balanced",
    label: "Balanced",
    ms: "200ms",
    desc: "Recommended",
    icon: "zap",
  },
  {
    key: "aggressive",
    label: "Aggressive",
    ms: "100ms",
    desc: "Fastest, more power",
    icon: "zap-off",
  },
];

export function SpeedSelector({ value, onChange }: Props) {
  const C = Colors.dark;

  const handleSelect = (speed: ScanSpeed) => {
    Haptics.selectionAsync();
    onChange(speed);
  };

  return (
    <View style={styles.container}>
      {SPEEDS.map((speed, i) => {
        const isSelected = value === speed.key;
        return (
          <Pressable
            key={speed.key}
            onPress={() => handleSelect(speed.key)}
            style={({ pressed }) => [
              styles.option,
              i < SPEEDS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: C.border,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View
              style={[
                styles.iconBg,
                {
                  backgroundColor: isSelected
                    ? C.tint + "22"
                    : C.backgroundElevated,
                },
              ]}
            >
              <Feather
                name={speed.icon}
                size={16}
                color={isSelected ? C.tint : C.textMuted}
              />
            </View>
            <View style={styles.textContent}>
              <Text
                style={[
                  styles.label,
                  { color: isSelected ? C.text : C.textSecondary },
                ]}
              >
                {speed.label}
              </Text>
              <Text style={[styles.desc, { color: C.textMuted }]}>
                {speed.desc}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.ms, { color: C.textMuted }]}>{speed.ms}</Text>
              {isSelected ? (
                <View
                  style={[styles.checkDot, { backgroundColor: C.tint }]}
                />
              ) : (
                <View
                  style={[
                    styles.emptyDot,
                    { borderColor: C.border },
                  ]}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ms: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  emptyDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
});
