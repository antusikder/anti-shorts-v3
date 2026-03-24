import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";

export function StatsRow() {
  const C = Colors.dark;
  const { settings } = useSettings();
  const { stats } = settings;

  const items = [
    {
      label: "Shorts\nShielded",
      value: stats.shortsShieldedToday,
      total: stats.totalShortsShielded,
      icon: "youtube" as const,
      color: C.youtube,
    },
    {
      label: "Reels\nRejected",
      value: stats.reelsRejectedToday,
      total: stats.totalReelsRejected,
      icon: "facebook" as const,
      color: C.facebook,
    },
    {
      label: "Ads\nRemoved",
      value: stats.adsRemovedToday,
      total: stats.totalAdsRemoved,
      icon: "x-circle" as const,
      color: C.accentGreen,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>
          TODAY'S PROTECTION
        </Text>
        <Text style={[styles.dateLabel, { color: C.textMuted }]}>
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
      <View style={styles.row}>
        {items.map((item, i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              { backgroundColor: Colors.dark.backgroundCard },
            ]}
          >
            <View
              style={[
                styles.iconBg,
                { backgroundColor: item.color + "22" },
              ]}
            >
              <Feather name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={[styles.value, { color: C.text }]}>
              {item.value}
            </Text>
            <Text style={[styles.label, { color: C.textMuted }]}>
              {item.label}
            </Text>
            <Text style={[styles.total, { color: C.textMuted }]}>
              {item.total} total
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    lineHeight: 32,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 15,
  },
  total: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
