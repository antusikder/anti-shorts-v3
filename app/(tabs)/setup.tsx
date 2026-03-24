import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SetupGuide } from "@/components/SetupGuide";
import Colors from "@/constants/colors";

const HOW_IT_WORKS = [
  {
    icon: "eye-off" as const,
    title: "Privacy First",
    desc: "The service ONLY monitors YouTube (com.google.android.youtube) and Facebook (com.facebook.katana). It never reads your keystrokes, messages, or personal data.",
  },
  {
    icon: "zap" as const,
    title: "Targeted, Not Pixel-Reading",
    desc: "Instead of reading every pixel, it targets specific view IDs and text labels like 'Shorts', 'Reels', 'Sponsored'. Ultra-efficient.",
  },
  {
    icon: "battery" as const,
    title: "Battery Efficient",
    desc: "Scanning is throttled (100–400ms intervals). The service sleeps between checks and only wakes on relevant app events.",
  },
  {
    icon: "shield" as const,
    title: "Fail-Safe Design",
    desc: "If a view isn't found, it retries once with a 50ms delay then gracefully skips. No crashes, no system instability.",
  },
];

export default function SetupScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="shield-check"
            size={48}
            color={C.tint}
          />
          <Text style={[styles.title, { color: C.text }]}>Setup & Info</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>
            How Anti Shorts protects you
          </Text>
        </View>

        <SetupGuide />

        <View style={{ height: 24 }} />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>
            HOW IT WORKS
          </Text>
        </View>

        <View style={styles.cards}>
          {HOW_IT_WORKS.map((item, i) => (
            <View
              key={i}
              style={[
                styles.card,
                { backgroundColor: C.backgroundCard },
              ]}
            >
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: C.tint + "22" },
                ]}
              >
                <Feather name={item.icon} size={22} color={C.tint} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: C.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardDesc, { color: C.textMuted }]}>
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />

        <View
          style={[
            styles.privacyNote,
            { backgroundColor: C.backgroundCard },
          ]}
        >
          <Feather name="lock" size={16} color={C.accentGreen} />
          <Text style={[styles.privacyText, { color: C.textSecondary }]}>
            Anti Shorts never reads your messages, passwords, or personal information. It only interacts with specific UI elements in YouTube and Facebook to dismiss short-form content.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    gap: 0,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  cards: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    gap: 14,
    alignItems: "flex-start",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
