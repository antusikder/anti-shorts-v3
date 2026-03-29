import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

const { width } = Dimensions.get("window");

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, C }: { icon: React.ReactNode; title: string; subtitle?: string; C: any }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, shadowColor: C.amber, shadowOpacity: 0.1, shadowRadius: 10 }}>
          {icon}
        </View>
        <View>
          <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: C.text }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

function Card({ children, style, C, glowColor }: { children: React.ReactNode; style?: object; C: any; glowColor?: string }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 24, marginHorizontal: 16, padding: 20, borderWidth: 1, borderColor: glowColor ? glowColor + '50' : C.border, overflow: 'hidden' }, style]}>
      {glowColor && (
        <View style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, borderRadius: 50, backgroundColor: glowColor, opacity: 0.1, transform: [{ scale: 2 }] }} />
      )}
      {children}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const C = Colors.dark; // Force Dark Deluxe
  const insets = useSafeAreaInsets();
  const { settings, updateSystemEnabled, setServiceEnabled, triggerSuddenBlock } = useSettings();

  const [isEnabled, setIsEnabled] = useState(false);
  const [panicTimeLeft, setPanicTimeLeft] = useState(0);
  const [userName, setUserName] = useState("Elite Mind");
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem("@productive:user_name").then(n => {
       if (n) setUserName(n);
    });
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      checkStatus();
      updatePanicTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.suddenBlockEndTime]);

  const updatePanicTimer = () => {
    if (settings.suddenBlockEndTime > Date.now()) {
      setPanicTimeLeft(Math.ceil((settings.suddenBlockEndTime - Date.now()) / 1000));
    } else {
      setPanicTimeLeft(0);
    }
  };

  useEffect(() => {
    if (isEnabled && settings.systemEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
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

  const handlePanic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Elite Panic Mode",
      "Immediately lock all distracting apps for 5 minutes to break the loop?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "ACTIVATE ⚡", style: "destructive", onPress: () => triggerSuddenBlock(5) }
      ]
    );
  };

  const active = isEnabled && settings.systemEnabled;
  const panicActive = panicTimeLeft > 0;
  
  // Progress Logic
  const todayUsage = settings.usage.screenTimeToday || 0;
  const yesterdayUsage = settings.usage.screenTimeYesterday || 120;
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
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
           <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
           </View>
           <TouchableOpacity onPress={handlePanic} style={[styles.panicBtn, panicActive && styles.panicBtnActive]}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={panicActive ? "#000" : C.amber} />
              <Text style={[styles.panicText, panicActive && { color: "#000" }]}>{panicActive ? `${panicTimeLeft}s` : "PANIC"}</Text>
           </TouchableOpacity>
        </View>

        {/* ── Shield Pulse Deluxe ── */}
        <View style={styles.shieldSection}>
           {active && (
             <Animated.View style={[styles.shieldGlowBg, { transform: [{ scale: pulseAnim }], opacity: 0.2 }]} />
           )}
           <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); updateSystemEnabled(!settings.systemEnabled); }}
                style={[styles.shieldButton, { borderColor: active ? C.amber : 'rgba(255,255,255,0.1)', backgroundColor: active ? 'rgba(255,176,0,0.08)' : 'rgba(255,255,255,0.03)' }]}
              >
                 <MaterialCommunityIcons name={active ? "shield-crown" : "shield-off-outline"} size={70} color={active ? C.amber : '#555'} />
                 {active && (
                   <View style={styles.pulseInnerRings}>
                      <View style={[styles.pulseRing, { width: 140, height: 140, borderRadius: 70 }]} />
                   </View>
                 )}
              </TouchableOpacity>
           </Animated.View>
           <Text style={[styles.shieldStatusText, { color: active ? '#FFF' : '#666' }]}>
              {active ? "Protection Active" : "Shield Offline"}
           </Text>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Ionicons name="hardware-chip" size={12} color={active ? C.amber : C.textMuted} />
              <Text style={[styles.shieldSubText, { color: active ? C.amber : C.textMuted }]}>Neural Tracker v4.1</Text>
           </View>

           {!isEnabled && (
              <View style={styles.warningBox}>
                 <Ionicons name="warning" size={16} color={C.danger} />
                 <Text style={styles.warningText}>Accessibility Service not running! Enable it in Settings to allow the neural tracker to work.</Text>
              </View>
           )}
        </View>

        {/* ── Progress Report ── */}
        <Card C={C} style={styles.progressCard} glowColor={focusLevel.color}>
           <SectionHeader title="Discipline Mastery" icon={<MaterialCommunityIcons name="trending-up" size={18} color={C.amber} />} C={C} />
           <View style={styles.progressRow}>
              <View>
                 <Text style={styles.progressLabel}>Daily Focus Goal</Text>
                 <Text style={styles.progressValue}>{Math.round(progressRatio * 100)}% Engaged</Text>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: focusLevel.color + '20', borderColor: focusLevel.color + '50' }]}>
                 <MaterialCommunityIcons name={focusLevel.icon as any} size={14} color={focusLevel.color} />
                 <Text style={[styles.levelText, { color: focusLevel.color }]}>{focusLevel.label}</Text>
              </View>
           </View>
           <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: `${Math.min(1, progressRatio) * 100}%`, backgroundColor: focusLevel.color }]} />
           </View>
           <Text style={styles.motivationalText}>
              {progressRatio > 0.5 ? "Your prefrontal cortex is in total control." : "Digital dopamine is clouding your vision. Return to baseline."}
           </Text>
        </Card>

        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
           <StatBox num={settings.stats.shortsShieldedToday} label="Shorts Shielded" color={C.youtube} icon="youtube" C={C} />
           <StatBox num={settings.stats.reelsRejectedToday} label="Reels Rejected" color={C.facebook} icon="facebook" C={C} />
           <StatBox num={settings.stats.adsRemovedToday || 0} label="Ads Skipped" color={C.amber} icon="skip-next" C={C} />
        </View>

        <View style={{ height: 20 }} />

        {/* ── Elite Support & Rewards ── */}
        <Card C={C} style={{ backgroundColor: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.3)' }} glowColor={C.amber}>
           <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                 <Text style={[styles.rewardsBalance, { color: C.amber }]}>{settings.usage.rewardPoints || 0} Focus Points</Text>
                 <Text style={styles.rewardsLabel}>Discipline Rank: Platinum Elite</Text>
              </View>
              <MaterialCommunityIcons name="crown" size={40} color={C.amber} />
           </View>
        </Card>

      </ScrollView>
    </LinearGradient>
  );
}

function StatBox({ num, label, color, icon, C }: { num: number; label: string; color: string; icon: any; C: any }) {
  return (
    <View style={[styles.statBox, { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: C.backgroundCard }]}>
       <MaterialCommunityIcons name={icon} size={24} color={color} style={{ marginBottom: 8, opacity: 0.8 }} />
       <Text style={[styles.statNum, { color: '#FFF' }]}>{num}</Text>
       <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 40 },
  welcomeText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#A0A0B0" },
  userName: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -0.5 },
  panicBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,176,0,0.4)", backgroundColor: "rgba(255,176,0,0.1)", shadowColor: "#FFB000", shadowOpacity: 0.2, shadowRadius: 10 },
  panicBtnActive: { backgroundColor: "#FFB000", borderColor: "#FFB000", shadowOpacity: 0.6 },
  panicText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFB000", letterSpacing: 1 },
  shieldSection: { alignItems: "center", marginBottom: 40, position: 'relative' },
  shieldGlowBg: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: "#FFB000", top: -30 },
  shieldButton: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, alignItems: "center", justifyContent: "center", shadowRadius: 30, shadowOpacity: 0.5, elevation: 15 },
  pulseInnerRings: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(255,176,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  pulseRing: { borderWidth: 1, borderColor: 'rgba(255,176,0,0.2)' },
  shieldStatusText: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 24, letterSpacing: -0.5 },
  shieldSubText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: 'uppercase', letterSpacing: 1.5 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,82,82,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 16, marginHorizontal: 20 },
  warningText: { color: "#FF5252", fontSize: 12, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 18 },
  progressCard: { marginBottom: 20 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 },
  progressLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#A0A0B0" },
  progressValue: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -1 },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  levelText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  progressBarBg: { height: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6, marginBottom: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  motivationalText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", color: "#808090", textAlign: "center", lineHeight: 20 },
  statsGrid: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
  statBox: { flex: 1, borderRadius: 20, padding: 16, alignItems: "center", borderWidth: 1 },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#808090", textAlign: "center" },
  rewardsBalance: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  rewardsLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#A0A0B0", marginTop: 4 },
});
