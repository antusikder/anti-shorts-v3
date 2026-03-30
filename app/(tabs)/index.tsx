import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, AppState, AppStateStatus, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSettings } from "@/context/SettingsContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useMindset } from "@/context/MindsetContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";
import { CustomAlert } from "../components/CustomAlert";
import { C, R } from "@/constants/colors";

const { width: SW } = Dimensions.get("window");

// ════════════════════════════════════════════════════════════════════════════
// SHIELD STATUS HERO
// ════════════════════════════════════════════════════════════════════════════

const ShieldHero = memo(() => {
  const { settings, setServiceEnabled } = useSettings();
  const [serviceActive, setServiceActive] = useState(false);

  useEffect(() => {
    checkService();
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") checkService();
    });
    return () => sub.remove();
  }, []);

  const checkService = async () => {
    const enabled = await AccessibilityModule.isServiceEnabled();
    setServiceActive(enabled);
    setServiceEnabled(enabled);
  };

  return (
    <TouchableOpacity
      style={[hero.card, serviceActive ? hero.cardActive : hero.cardInactive]}
      onPress={() => {
        if (!serviceActive) {
          AccessibilityModule.openAccessibilitySettings();
        }
      }}
      activeOpacity={serviceActive ? 1 : 0.85}
    >
      <View style={hero.row}>
        <View style={[hero.iconWrap, { backgroundColor: serviceActive ? C.amberBg : C.dangerBg }]}>
          <MaterialCommunityIcons
            name={serviceActive ? "shield-check" : "shield-off"}
            size={28}
            color={serviceActive ? C.amber : C.danger}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={hero.title}>
            Neural Shield {serviceActive ? "Active" : "Disabled"}
          </Text>
          <Text style={hero.subtitle}>
            {serviceActive
              ? "Scanning for shorts, reels, and ads in real-time."
              : "Tap to enable the accessibility service."}
          </Text>
        </View>
        {serviceActive && (
          <View style={hero.liveDot} />
        )}
      </View>
    </TouchableOpacity>
  );
});

const hero = StyleSheet.create({
  card: { borderRadius: R.card, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardActive: { backgroundColor: C.bgCard, borderColor: C.amberBorder },
  cardInactive: { backgroundColor: C.bgCard, borderColor: C.dangerBorder },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSub, lineHeight: 18 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success },
});

// ════════════════════════════════════════════════════════════════════════════
// STATS ROW
// ════════════════════════════════════════════════════════════════════════════

const StatsRow = memo(() => {
  const { settings } = useSettings();
  const stats = settings.stats;

  const items = useMemo(() => [
    { icon: "youtube", label: "Shorts", value: stats.shortsShieldedToday, total: stats.totalShortsShielded },
    { icon: "filmstrip-off", label: "Reels", value: stats.reelsRejectedToday, total: stats.totalReelsRejected },
    { icon: "skip-next", label: "Ads", value: stats.adsRemovedToday, total: stats.totalAdsRemoved },
  ], [stats]);

  return (
    <View style={sr.row}>
      {items.map((item, i) => (
        <View key={i} style={sr.card}>
          <MaterialCommunityIcons name={item.icon as any} size={18} color={C.amber} style={{ marginBottom: 8 }} />
          <Text style={sr.value}>{item.value}</Text>
          <Text style={sr.label}>{item.label} today</Text>
          <Text style={sr.total}>{item.total} total</Text>
        </View>
      ))}
    </View>
  );
});

const sr = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginBottom: 16 },
  card: { flex: 1, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 14, alignItems: "center" },
  value: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text, letterSpacing: -1 },
  label: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textMuted, marginTop: 4 },
  total: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textMuted, marginTop: 2 },
});

// ════════════════════════════════════════════════════════════════════════════
// CORE PILLARS OVERVIEW
// ════════════════════════════════════════════════════════════════════════════

const PillarRow = memo(({ icon, label, status, statusColor, onPress }: {
  icon: string; label: string; status: string; statusColor: string; onPress: () => void;
}) => (
  <TouchableOpacity style={pr.row} onPress={onPress} activeOpacity={0.85}>
    <MaterialCommunityIcons name={icon as any} size={20} color={C.amber} />
    <Text style={pr.label}>{label}</Text>
    <Text style={[pr.status, { color: statusColor }]}>{status}</Text>
    <MaterialCommunityIcons name="chevron-right" size={18} color={C.textMuted} />
  </TouchableOpacity>
));

const CorePillars = memo(() => {
  const { mindset } = useMindset();
  const { workout } = useWorkout();
  const { settings } = useSettings();

  const screenTimePct = useMemo(() => {
    if (!mindset.screenTime.enabled) return "Off";
    return `${mindset.screenTime.dailyLimitMin}m limit`;
  }, [mindset.screenTime]);

  return (
    <View style={pr.container}>
      <Text style={pr.sectionLabel}>Core Pillars</Text>
      <View style={pr.card}>
        <PillarRow
          icon="shield-crown"
          label="Smart Shield"
          status={settings.isServiceEnabled ? "Active" : "Disabled"}
          statusColor={settings.isServiceEnabled ? C.success : C.danger}
          onPress={() => router.push("/(tabs)/shield")}
        />
        <View style={pr.divider} />
        <PillarRow
          icon="brain"
          label="Mindset & Focus"
          status={screenTimePct}
          statusColor={C.amber}
          onPress={() => router.push("/(tabs)/mindset")}
        />
        <View style={pr.divider} />
        <PillarRow
          icon="arm-flex"
          label="Fitness"
          status={`${workout.totalSessionsCompleted} sessions`}
          statusColor={C.amber}
          onPress={() => router.push("/(tabs)/workout")}
        />
      </View>
    </View>
  );
});

const pr = StyleSheet.create({
  container: { marginBottom: 16 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, flex: 1 },
  status: { fontFamily: "Inter_500Medium", fontSize: 12 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
});

// ════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ════════════════════════════════════════════════════════════════════════════

const QuickActions = memo(() => {
  const { triggerSuddenBlock } = useSettings();

  const actions = useMemo(() => [
    {
      icon: "lightning-bolt", label: "Panic Block",
      desc: "Block all apps for 5 minutes",
      onPress: () => {
          setPanicVisible(true);
      },
    },
    {
      icon: "cog", label: "Settings",
      desc: "PIN, profiles, support",
      onPress: () => router.push("/settings"),
    },
  ], []);

  const [panicVisible, setPanicVisible] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={pr.sectionLabel}>Quick Actions</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {actions.map((a, i) => (
          <TouchableOpacity key={i} style={qa.btn} onPress={a.onPress} activeOpacity={0.85}>
            <MaterialCommunityIcons name={a.icon as any} size={22} color={C.amber} style={{ marginBottom: 8 }} />
            <Text style={qa.label}>{a.label}</Text>
            <Text style={qa.desc}>{a.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <CustomAlert
        visible={panicVisible}
        title="Panic Block"
        message="Are you sure you want to trigger a strict 5-minute hardware block on all social media?"
        icon="lightning-bolt"
        confirmLabel="Block Now"
        cancelLabel="Cancel"
        onConfirm={() => {
          setPanicVisible(false);
          triggerSuddenBlock(5);
        }}
        onCancel={() => setPanicVisible(false)}
      />
    </View>
  );
});

const qa = StyleSheet.create({
  btn: { flex: 1, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, marginBottom: 4 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, lineHeight: 16 },
});

// ════════════════════════════════════════════════════════════════════════════
// FEEDBACK REWARD PROMPT
// ════════════════════════════════════════════════════════════════════════════

const FeedbackPrompt = memo(() => {
  const { checkRewardTrigger, clearRewardTrigger, addRewardPoints } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const poll = async () => {
      const triggerTime = await checkRewardTrigger();
      if (triggerTime > 0) {
        const elapsed = Date.now() - triggerTime;
        // If trigger was within the last 5 minutes, ask for feedback
        if (elapsed < 5 * 60 * 1000) {
           setVisible(true);
        }
        clearRewardTrigger();
      }
    };

    const handleState = (state: AppStateStatus) => {
      if (state === "active") poll();
    };

    const sub = AppState.addEventListener("change", handleState);
    interval = setInterval(poll, 3000);
    poll();

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={fb.overlay}>
        <View style={fb.card}>
          <MaterialCommunityIcons name="brain" size={40} color={C.amber} style={{ marginBottom: 16 }} />
          <Text style={fb.title}>Neural Interception</Text>
          <Text style={fb.desc}>I just diverted you from a short-form feed. How did I do?</Text>
          
          <TouchableOpacity 
             style={fb.btnFlow} 
             activeOpacity={0.8}
             onPress={() => {
               setVisible(false);
               addRewardPoints(10);
               Alert.alert("Elite Point Awarded", "+10 Points! Keep up the focus.");
             }}
          >
             <MaterialCommunityIcons name="check-circle" size={20} color={C.bg} />
             <Text style={fb.btnTextPrimary}>Perfect! Saved me.</Text>
          </TouchableOpacity>

           <TouchableOpacity 
             style={fb.btnSecondary} 
             activeOpacity={0.8}
             onPress={() => {
               setVisible(false);
             }}
          >
             <Text style={fb.btnTextSec}>It missed it, I backed out manually.</Text>
          </TouchableOpacity>

           <TouchableOpacity 
             style={fb.btnSecondary} 
             activeOpacity={0.8}
             onPress={() => {
               setVisible(false);
             }}
          >
             <Text style={fb.btnTextSec}>False positive (I wasn't scrolling).</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const fb = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 24, zIndex: 9999 },
  card: { backgroundColor: C.bgCard, width: "100%", borderRadius: R.card, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.border },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, marginBottom: 8 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  btnFlow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.amber, width: "100%", paddingVertical: 14, borderRadius: 100, marginBottom: 12 },
  btnTextPrimary: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.bg },
  btnSecondary: { backgroundColor: C.bgElevated, width: "100%", paddingVertical: 14, borderRadius: 100, alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: C.border },
  btnTextSec: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default memo(function DashboardScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, letterSpacing: -0.5 }}>
              Fresh Mind Elite
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              Your digital wellness command center.
            </Text>
          </View>

          <ShieldHero />
          <StatsRow />
          <CorePillars />
          <QuickActions />

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      
      <FeedbackPrompt />
    </View>
  );
});
