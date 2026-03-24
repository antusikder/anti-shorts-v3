import React from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  isLast?: boolean;
}

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  icon,
  disabled,
  isLast,
}: ToggleRowProps) {
  const C = Colors.dark;

  const handleChange = (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(v);
  };

  return (
    <Pressable
      onPress={() => !disabled && handleChange(!value)}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.separator,
        { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.content}>
        <Text style={[styles.label, { color: C.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: C.textMuted }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{
          false: C.backgroundElevated,
          true: C.tint + "66",
        }}
        thumbColor={value ? C.tint : C.textSecondary}
        ios_backgroundColor={C.backgroundElevated}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  iconContainer: {
    width: 28,
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  description: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
