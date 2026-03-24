import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

const STEPS = [
  {
    num: "1",
    title: "Open Accessibility Settings",
    desc: 'Tap the button below to open Android\'s Accessibility Settings.',
  },
  {
    num: "2",
    title: "Find Anti Shorts",
    desc: 'Scroll to find "Anti Shorts" or "Downloaded apps" section.',
  },
  {
    num: "3",
    title: "Enable the Service",
    desc: 'Tap "Anti Shorts" and toggle it ON. Accept the permissions prompt.',
  },
  {
    num: "4",
    title: "You\'re Protected!",
    desc: 'Return here. The service will start filtering Shorts and Reels automatically.',
  },
];

export function SetupGuide() {
  const C = Colors.dark;

  const openSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "android") {
      AccessibilityModule.openAccessibilitySettings();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.backgroundCard }]}>
      <View style={styles.header}>
        <Feather name="info" size={18} color={C.tint} />
        <Text style={[styles.title, { color: C.text }]}>Setup Guide</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepLeft}>
              <View
                style={[
                  styles.stepNum,
                  { backgroundColor: C.tint + "22", borderColor: C.tint + "44" },
                ]}
              >
                <Text style={[styles.stepNumText, { color: C.tint }]}>
                  {step.num}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: C.border }]} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: C.text }]}>
                {step.title}
              </Text>
              <Text style={[styles.stepDesc, { color: C.textMuted }]}>
                {step.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {Platform.OS === "android" && (
        <Pressable
          onPress={openSettings}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: C.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="external-link" size={16} color="#fff" />
          <Text style={styles.btnText}>Open Accessibility Settings</Text>
        </Pressable>
      )}

      {Platform.OS !== "android" && (
        <View style={[styles.noticeBox, { backgroundColor: C.backgroundElevated }]}>
          <Feather name="smartphone" size={14} color={C.accentYellow} />
          <Text style={[styles.noticeText, { color: C.textSecondary }]}>
            This feature requires an Android device. Install the APK and enable
            the Accessibility Service from Android Settings.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  steps: {
    gap: 0,
  },
  step: {
    flexDirection: "row",
    gap: 12,
  },
  stepLeft: {
    alignItems: "center",
    width: 32,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    marginVertical: 4,
    minHeight: 16,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
    gap: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  stepDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  noticeBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    alignItems: "flex-start",
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
