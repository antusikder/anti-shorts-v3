import React, { useEffect, useState } from "react";
import {
  View, ScrollView, Text, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSettings } from "@/context/SettingsContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useMindset } from "@/context/MindsetContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";
import { C } from "@/constants/colors";

const CARD_RADIUS = 20;

function GlowCard({ children, color = C.amber, style }: { children: React.ReactNode; color?: string; style?: any }) {
  return (
    <View style={[styles.glowCard, { borderColor: color + "33", shadowColor: color }, style]}>
      {children}
    </View>
  );
}

function CoreCard({
  icon, label, subtitle, color, value, onPress,
}: {
  icon: string; label: string; subtitle: string; color: string; value: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.coreCard}>
      <LinearGradient colors={[color + "22", color + "08"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.coreIconWrap, { backgroundColor: color + "25", borderColor: color + "44" }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.coreLabel}>{label}</Text>
      <Text style={styles.coreValue}>{value}</Text>
      <Text style={styles.coreSub}>{subtitle}</Text>
      <View style={[styles.coreArrow, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name="chevron-right" size={16} color={color} />
      </View>
    </TouchableOpacity>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { settings, setServiceEnabled } = useSettings();
  const { workout } = useWorkout();
  const { mindset } = useMindset();
  const [serviceActive, setServiceActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const s = settings.stats;
  const totalToday = s.shortsShieldedToday + s.reelsRejectedToday + s.adsRemovedToday;

  useEffect(() => {
    checkService();
  }, []);

  // Pulse animation for shield status
  useEffect(() => {
    if (serviceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [serviceActive]);

  const checkService = async () => {
    const enabled = await AccessibilityModule.isServiceEnabled();
    setServiceActive(enabled);
    setServiceEnabled(enabled);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkService();
    setRefreshing(false);
  };

  const doneTasks = mindset.todayTasks.filter((t) => t.done).length;
  const totalTasks = mindset.todayTasks.length;

  const lastSession = workout.sessions[0];
  const totalSessions = workout.totalSessionsCompleted;

  return (
    <LinearGradient colors={["#07060F", "#0D0B1E", "#07060F"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.amber} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Fresh Mind Elite</Text>
              <Text style={styles.headerSub}>Your focus, your rules.</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/settings")} style={styles.settingsBtn}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={C.textSub} />
            </TouchableOpacity>
          </View>

          {/* Shield Status Hero */}
          <GlowCard color={serviceActive ? C.green : C.danger} style={styles.heroCard}>
            <LinearGradient
              colors={serviceActive ? [C.greenGlow, "transparent"] : [C.dangerGlow, "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroTitle}>
                  {serviceActive ? "Shield Active" : "Shield Offline"}
                </Text>
                <Text style={[styles.heroSub, { color: serviceActive ? C.green : C.danger }]}>
                  {serviceActive ? "Blocking shorts & ads" : "Enable accessibility to start"}
                </Text>
              </View>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={[styles.shieldBadge, { backgroundColor: serviceActive ? C.green + "22" : C.danger + "22", borderColor: serviceActive ? C.green + "55" : C.danger + "55" }]}>
                  <MaterialCommunityIcons
                    name={serviceActive ? "shield-check" : "shield-off"}
                    size={36}
                    color={serviceActive ? C.green : C.danger}
                  />
                </View>
              </Animated.View>
            </View>

            {!serviceActive && (
              <TouchableOpacity
                onPress={() => AccessibilityModule.openAccessibilitySettings()}
                style={styles.enableBtn}
              >
                <Text style={styles.enableBtnText}>Enable Now →</Text>
              </TouchableOpacity>
            )}
          </GlowCard>

          {/* Today's Stats */}
          <Text style={styles.sectionTitle}>Today's Shield Report</Text>
          <GlowCard color={C.amber}>
            <View style={styles.statsRow}>
              <StatBadge label="Shorts" value={s.shortsShieldedToday} color={C.amber} />
              <View style={styles.statDivider} />
              <StatBadge label="Reels" value={s.reelsRejectedToday} color={C.blue} />
              <View style={styles.statDivider} />
              <StatBadge label="Ads" value={s.adsRemovedToday} color={C.green} />
              <View style={styles.statDivider} />
              <StatBadge label="Total" value={totalToday} color={C.amber} />
            </View>

            <View style={styles.totalStrip}>
              <MaterialCommunityIcons name="chart-bar" size={14} color={C.amberGlow.replace("0.15", "0.6")} />
              <Text style={styles.totalStripText}>
                Lifetime: {s.totalShortsShielded + s.totalReelsRejected + s.totalAdsRemoved} blocked
              </Text>
            </View>
          </GlowCard>

          {/* 3 Cores */}
          <Text style={styles.sectionTitle}>Your Cores</Text>
          <View style={styles.coreRow}>
            <CoreCard
              icon="shield-crown"
              label="Smart Shield"
              subtitle="Tap to configure blocking"
              color={C.amber}
              value={serviceActive ? "Active" : "Off"}
              onPress={() => router.navigate("/(tabs)/shield")}
            />
            <CoreCard
              icon="brain"
              label="Mindset"
              subtitle={totalTasks > 0 ? `${doneTasks}/${totalTasks} tasks done` : "Build your routine"}
              color={C.blue}
              value={mindset.streakDays > 0 ? `${mindset.streakDays}d streak` : "—"}
              onPress={() => router.navigate("/(tabs)/mindset")}
            />
          </View>
          <CoreCard
            icon="arm-flex"
            label="Workout"
            subtitle={lastSession ? `Last: ${lastSession.programName}` : "Start your first workout"}
            color={C.green}
            value={`${totalSessions} sessions`}
            onPress={() => router.navigate("/(tabs)/workout")}
          />

          {/* Quick Tips */}
          <Text style={styles.sectionTitle}>Pro Tips</Text>
          <GlowCard color={C.purple}>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={C.purple} />
              <Text style={styles.tipText}>
                Enable the accessibility service, then open YouTube. The shield will automatically skip Shorts and ads.
              </Text>
            </View>
          </GlowCard>

          <View style={{ height: 90 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 8 },
  greeting: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, letterSpacing: -0.5 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginTop: 2 },
  settingsBtn: { padding: 8, borderRadius: 14, backgroundColor: C.bgElevated },

  heroCard: { marginBottom: 20, padding: 20 },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, marginBottom: 4 },
  heroSub: { fontFamily: "Inter_500Medium", fontSize: 13 },
  shieldBadge: { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  enableBtn: { marginTop: 16, backgroundColor: C.danger + "22", borderWidth: 1, borderColor: C.danger + "44", borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  enableBtnText: { fontFamily: "Inter_600SemiBold", color: C.danger, fontSize: 14 },

  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 4 },

  glowCard: { backgroundColor: C.bgCard, borderWidth: 1, borderRadius: CARD_RADIUS, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4, overflow: "hidden" },

  statsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 8 },
  statBadge: { alignItems: "center", flex: 1 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 26, letterSpacing: -1 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: C.border },
  totalStrip: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  totalStripText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },

  coreRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  coreCard: { flex: 1, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: CARD_RADIUS, padding: 16, overflow: "hidden", justifyContent: "space-between" },
  coreIconWrap: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  coreLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, marginBottom: 4 },
  coreValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.text, marginBottom: 2 },
  coreSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted },
  coreArrow: { position: "absolute", top: 12, right: 12, borderRadius: 8, padding: 4 },

  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, flex: 1, lineHeight: 20 },
});
