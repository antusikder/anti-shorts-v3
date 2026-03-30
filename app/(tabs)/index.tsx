import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/context/SettingsContext";
import { C, R, S } from "@/constants/colors";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

const { width: SW } = Dimensions.get("window");

// ════════════════════════════════════════════════════════════════════════════
// ANIMATED SHIELD HERO
// ════════════════════════════════════════════════════════════════════════════

const ShieldHero = memo(({ active }: { active: boolean }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(glow, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else {
      pulse.setValue(1);
      Animated.timing(glow, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }
  }, [active]);

  const glowColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(200,149,108,0)", "rgba(200,149,108,0.30)"],
  });

  return (
    <View style={sh.container}>
      <Animated.View style={[sh.glowRing, { shadowColor: active ? C.accent : "transparent", shadowRadius: 30, shadowOpacity: 1 }]}>
        <Animated.View style={[sh.iconWrap, {
          transform: [{ scale: pulse }],
          backgroundColor: active ? C.accentBg : "rgba(255,255,255,0.04)",
          borderColor: active ? C.accentBorder : C.border,
        }]}>
          <MaterialCommunityIcons
            name={active ? "shield-check" : "shield-off-outline"}
            size={52}
            color={active ? C.accent : C.textMuted}
          />
        </Animated.View>
      </Animated.View>
      <Text style={[sh.label, { color: active ? C.accent : C.textMuted }]}>
        {active ? "Shield Active" : "Shield Off"}
      </Text>
      <Text style={sh.sublabel}>
        {active ? "Protecting you from short-form content" : "Tap Shield to enable protection"}
      </Text>
    </View>
  );
});

const sh = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 32 },
  glowRing: { alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  label: { fontFamily: "Nunito_700Bold", fontSize: 22, letterSpacing: -0.3, marginBottom: 6 },
  sublabel: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, textAlign: "center", paddingHorizontal: 32 },
});

// ════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════════════════════

const StatCard = memo(({ icon, value, label, color }: {
  icon: string; value: number; label: string; color: string;
}) => (
  <View style={sc.card}>
    <MaterialCommunityIcons name={icon as any} size={20} color={color} style={{ marginBottom: 8 }} />
    <Text style={[sc.value, { color }]}>{value}</Text>
    <Text style={sc.label}>{label}</Text>
  </View>
));

const sc = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: C.bgCard, borderRadius: R.card,
    borderWidth: 1, borderColor: C.border,
    padding: 16, alignItems: "center",
  },
  value: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, letterSpacing: -1, marginBottom: 4 },
  label: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: C.textMuted, textAlign: "center" },
});

// ════════════════════════════════════════════════════════════════════════════
// QUICK ACTION
// ════════════════════════════════════════════════════════════════════════════

const QuickAction = memo(({ icon, label, desc, onPress, danger }: {
  icon: string; label: string; desc: string; onPress: () => void; danger?: boolean;
}) => (
  <TouchableOpacity style={qa.card} onPress={onPress} activeOpacity={0.82}>
    <View style={[qa.iconWrap, { backgroundColor: danger ? C.dangerBg : C.accentBg, borderColor: danger ? C.dangerBorder : C.accentBorder }]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={danger ? C.danger : C.accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={qa.label}>{label}</Text>
      <Text style={qa.desc}>{desc}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={18} color={C.textMuted} />
  </TouchableOpacity>
));

const qa = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.bgCard, borderRadius: R.card,
    borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 10,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text, marginBottom: 2 },
  desc: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted },
});

// ════════════════════════════════════════════════════════════════════════════
// REWARD TOAST
// ════════════════════════════════════════════════════════════════════════════

const RewardToast = memo(({ visible, onDone }: { visible: boolean; onDone: () => void }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.delay(2200),
        Animated.timing(anim, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start(() => onDone());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[rt.wrap, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
    }]}>
      <MaterialCommunityIcons name="star-four-points" size={18} color={C.accent} />
      <Text style={rt.text}>+10 Elite Points — Focus protected!</Text>
    </Animated.View>
  );
});

const rt = StyleSheet.create({
  wrap: {
    position: "absolute", bottom: 100, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.accentBorder,
    borderRadius: 100, paddingVertical: 12, paddingHorizontal: 20,
  },
  text: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.accent },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function DashboardScreen() {
  const { settings, addRewardPoints } = useSettings();
  const [serviceActive, setServiceActive] = useState(false);
  const [stats, setStats] = useState({ shortsBlocked: 0, reelsBlocked: 0, adsSkipped: 0 });
  const [rewardVisible, setRewardVisible] = useState(false);

  const pollStats = useCallback(async () => {
    try {
      const active = await AccessibilityModule.isServiceEnabled();
      setServiceActive(active);
      const s = await (AccessibilityModule as any).getStats?.() ?? {};
      setStats({
        shortsBlocked: s.shortsBlocked ?? 0,
        reelsBlocked:  s.reelsBlocked ?? 0,
        adsSkipped:    s.adsSkipped ?? 0,
      });
      // Reward polling
      const reward = await AccessibilityModule.getRewardTrigger();
      if (reward > 0) {
        AccessibilityModule.clearRewardTrigger();
        addRewardPoints(10);
        setRewardVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
  }, []);

  useEffect(() => {
    pollStats();
    const interval = setInterval(pollStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalShielded = stats.shortsBlocked + stats.reelsBlocked;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: S.pagePad, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingTop: 8, marginBottom: 4 }}>
            <Text style={pr.greeting}>Fresh Mind</Text>
            <Text style={pr.subtitle}>Your focus guardian</Text>
          </View>

          {/* Shield Hero */}
          <ShieldHero active={serviceActive} />

          {/* Stats */}
          <Text style={pr.sectionLabel}>Today's Shield Report</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: S.sectionGap }}>
            <StatCard icon="play-speed" value={stats.shortsBlocked} label={"Shorts\nBlocked"} color={C.accent} />
            <StatCard icon="video-off" value={stats.reelsBlocked} label={"Reels\nBlocked"} color={C.success} />
            <StatCard icon="skip-forward" value={stats.adsSkipped} label={"Ads\nSkipped"} color={C.info} />
          </View>

          {/* Reward Points */}
          <View style={pr.rewardRow}>
            <MaterialCommunityIcons name="star-circle" size={20} color={C.accent} />
            <Text style={pr.rewardText}>{settings.usage.rewardPoints} Elite Points</Text>
            <View style={pr.rewardBadge}>
              <Text style={pr.rewardBadgeText}>Streak: {settings.usage.streakDays}d</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={[pr.sectionLabel, { marginTop: 20 }]}>Features</Text>
          <QuickAction
            icon="shield-crown"
            label="Shield Controls"
            desc="Shorts, Reels, Ads, Strict Mode"
            onPress={() => {}}
          />
          <QuickAction
            icon="brain"
            label="Mindset & Focus"
            desc="Screen time, sleep, deep work"
            onPress={() => {}}
          />
          <QuickAction
            icon="arm-flex"
            label="Workout"
            desc="Exercise library, calculators"
            onPress={() => {}}
          />
          <QuickAction
            icon="calendar-check"
            label="Daily Plan"
            desc="Task timers, schedule"
            onPress={() => {}}
          />

          {/* Service prompt if not active */}
          {!serviceActive && (
            <TouchableOpacity
              style={pr.enableBanner}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                AccessibilityModule.openAccessibilitySettings();
              }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="shield-alert" size={22} color={C.warn} />
              <View style={{ flex: 1 }}>
                <Text style={pr.enableTitle}>Shield needs permission</Text>
                <Text style={pr.enableDesc}>Tap to enable the accessibility service</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={18} color={C.warn} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      <RewardToast visible={rewardVisible} onDone={() => setRewardVisible(false)} />
    </View>
  );
}

const pr = StyleSheet.create({
  greeting: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, color: C.text, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, marginTop: 2 },
  sectionLabel: {
    fontFamily: "Nunito_700Bold", fontSize: 12, color: C.textMuted,
    letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12,
  },
  rewardRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.bgCard, borderRadius: R.card,
    borderWidth: 1, borderColor: C.accentBorder,
    padding: 14,
  },
  rewardText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.accent, flex: 1 },
  rewardBadge: { backgroundColor: C.accentBg, borderRadius: R.circle, paddingVertical: 4, paddingHorizontal: 10 },
  rewardBadgeText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.accent },
  enableBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.warnBg, borderRadius: R.card,
    borderWidth: 1, borderColor: "rgba(200,149,108,0.3)",
    padding: 16, marginTop: 16,
  },
  enableTitle: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.warn, marginBottom: 2 },
  enableDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textSub },
});
