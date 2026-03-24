import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

interface Props {
  title: string;
  titleIcon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  titleIcon,
  badge,
  badgeColor,
  children,
}: Props) {
  const C = Colors.dark;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {titleIcon}
          <Text style={[styles.title, { color: C.textSecondary }]}>
            {title}
          </Text>
        </View>
        {badge ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: (badgeColor ?? C.tint) + "22" },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: badgeColor ?? C.tint },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.card, { backgroundColor: C.backgroundCard }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
});
