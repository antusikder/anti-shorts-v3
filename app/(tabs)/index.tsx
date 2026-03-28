import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

const { width } = Dimensions.get("window");

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, C }: { icon: React.ReactNode; title: string; subtitle?: string; C: any }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border }}>
          {icon}
        </View>
        <View>
          <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: C.text }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

function Card({ children, style, C }: { children: React.ReactNode; style?: object; C: any }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 24, marginHorizontal: 16, padding: 18, borderWidth: 1, borderColor: C.border }, style]}>
      {children}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const C = Colors.dark; // Force Dark Deluxe
  const insets = useSafeAreaInsets();
  const { settings, updateSystemEnabled, setServiceEnabled } = useSettings();

  const [isEnabled, setIsEnabled] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isEnabled && settings.systemEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isEnabled, settings.systemEnabled]);

  const checkStatus = async () => {
    const enabled = await AccessibilityModule.isServiceEnabled();
    setIsEnabled(enabled);
    setServiceEnabled(enabled);
  };

  const active = isEnabled && settings.systemEnabled;
  
  // Progress Logic
  const todayUsage = settings.usage.screenTimeToday || 0;
  const yesterdayUsage = settings.usage.screenTimeYesterday || 120; // Default fallback
  const progressRatio = Math.max(0, 1 - (todayUsage / yesterdayUsage));
  const focusLevel = useMemo(() => {
    if (progressRatio > 0.8) return { label: "Elite Focus", color: C.amber, icon: "crown" };
    if (progressRatio > 0.5) return { label: "Productive", color: C.green, icon: "flash" };
    return { label: "Distracted", color: C.danger, icon: "alert-circle" };
  }, [progressRatio, C]);

  return (
    <LinearGradient colors={["#0D0B1E", "#05050A"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
           <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>Elite Mind</Text>
           </View>
           <View style={[styles.statusBadge, { backgroundColor: active ? C.green + "20" : C.danger + "20", borderColor: active ? C.green : C.danger }]}>
              <View style={[styles.statusDot, { backgroundColor: active ? C.green : C.danger }]} />
              <Text style={[styles.statusText, { color: active ? C.green : C.danger }]}>{active ? "ACTIVE" : "OFF"}</Text>
           </View>
        </View>

        {/* ── Shield Pulse Deluxe ── */}
        <View style={styles.shieldSection}>
           <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); updateSystemEnabled(!settings.systemEnabled); }}
                style={[styles.shieldButton, { borderColor: active ? C.amber : C.border, shadowColor: active ? C.amber : "#000" }]}
              >
                 <MaterialCommunityIcons name={active ? "shield-crown" : "shield-off"} size={70} color={active ? C.amber : C.textMuted} />
              </TouchableOpacity>
           </Animated.View>
           <Text style={[styles.shieldStatusText, { color: active ? C.amber : C.text }]}>
              {active ? "Elite Protection Active" : "Shield is Disengaged"}
           </Text>
           <Text style={styles.shieldSubText}>
              {active ? "Social stimuli are being intercepted" : "Enable to restore digital peace"}
           </Text>
        </View>

        {/* ── Progress Report (v4.0) ── */}
        <Card C={C} style={styles.progressCard}>
           <SectionHeader title="Progress Mastery" icon={<MaterialCommunityIcons name="trending-up" size={18} color={C.amber} />} C={C} />
           <View style={styles.progressRow}>
              <View>
                 <Text style={styles.progressLabel}>Daily Focus Goal</Text>
                 <Text style={styles.progressValue}>{Math.round(progressRatio * 100)}% Improved</Text>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: focusLevel.color + '20' }]}>
                 <MaterialCommunityIcons name={focusLevel.icon as any} size={14} color={focusLevel.color} />
                 <Text style={[styles.levelText, { color: focusLevel.color }]}>{focusLevel.label}</Text>
              </View>
           </View>
           <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(1, progressRatio) * 100}%`, backgroundColor: C.amber }]} />
           </View>
           <Text style={styles.motivationalText}>
              {progressRatio > 0 ? "You are outperforming your past self. Keep going." : "The algorithm is winning today. Take back control."}
           </Text>
        </Card>

        {/* ── Real-time Blocking Stats ── */}
        <View style={styles.statsGrid}>
           <StatBox num={settings.stats.shortsShieldedToday} label="Shorts Dismissed" color={C.youtube} C={C} />
           <StatBox num={settings.stats.reelsRejectedToday} label="Reels Blocked" color={C.facebook} C={C} />
           <StatBox num={settings.stats.adsRemovedToday || 0} label="Ads Extinguished" color={C.amber} C={C} />
        </View>

        {/* ── Rewards Section ── */}
        <Card C={C} style={{ marginTop: 12, backgroundColor: C.amber + '08' }}>
           <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                 <Text style={styles.rewardsBalance}>{settings.usage.rewardPoints || 0} pts</Text>
                 <Text style={styles.rewardsLabel}>Elite Mind Balance</Text>
              </View>
              <TouchableOpacity style={styles.claimBtn}>
                 <Text style={styles.claimText}>History</Text>
              </TouchableOpacity>
           </View>
        </Card>

      </ScrollView>
    </LinearGradient>
  );
}

function StatBox({ num, label, color, C }: { num: number; label: string; color: string; C: any }) {
  return (
    <View style={[styles.statBox, { borderColor: C.border, backgroundColor: C.backgroundCard }]}>
       <Text style={[styles.statNum, { color }]}>{num}</Text>
       <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 30 },
  welcomeText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#A0A0B0" },
  userName: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  shieldSection: { alignItems: "center", marginBottom: 30 },
  shieldButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,176,0,0.05)", borderWidth: 2, alignItems: "center", justifyContent: "center", shadowRadius: 20, shadowOpacity: 0.5, elevation: 10 },
  shieldStatusText: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 20 },
  shieldSubText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 4 },
  progressCard: { marginBottom: 16, borderColor: 'rgba(255,176,0,0.3)' },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  progressLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#A0A0B0" },
  progressValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  levelText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  progressBarBg: { height: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  motivationalText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", color: "#A0A0B0", textAlign: "center" },
  statsGrid: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  statBox: { flex: 1, borderRadius: 20, padding: 16, alignItems: "center", borderWidth: 1 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#A0A0B0", textAlign: "center", marginTop: 4 },
  rewardsBalance: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFB000" },
  rewardsLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0A0B0" },
  claimBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,176,0,0.15)" },
  claimText: { color: "#FFB000", fontFamily: "Inter_700Bold", fontSize: 12 },
});
