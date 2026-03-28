import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";

const { width } = Dimensions.get("window");

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, C }: { icon: string; title: string; subtitle?: string; C: any }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={C.amber} />
        <View>
          <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

function Card({ children, style, C }: { children: React.ReactNode; style?: object; C: any }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: C.border }, style]}>
      {children}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RoutineScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const { settings, updateBedtime } = useSettings();

  const [focusTimer, setFocusTimer] = useState(25 * 60); // 25 mins
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerActive && focusTimer > 0) {
      interval = setInterval(() => setFocusTimer(t => t - 1), 1000);
    } else if (focusTimer === 0) {
      setIsTimerActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, focusTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <LinearGradient colors={["#0D0B1E", "#05050A"]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }}
      >
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
           <Text style={{ fontSize: 32, fontFamily: "Inter_700Bold", color: "#FFFFFF" }}>Elite Routine</Text>
           <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 4 }}>High-frequency discipline management</Text>
        </View>

        {/* ── Focus Flow (Pomodoro) ── */}
        <Card C={C} style={{ marginBottom: 16 }}>
           <SectionHeader title="Deep Focus Flow" icon="timer-outline" C={C} />
           <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(focusTimer)}</Text>
              <View style={styles.timerControls}>
                 <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsTimerActive(!isTimerActive); }} style={[styles.timerBtn, { backgroundColor: isTimerActive ? C.danger + '20' : C.amber + '20', borderColor: isTimerActive ? C.danger : C.amber }]}>
                    <Ionicons name={isTimerActive ? "pause" : "play"} size={24} color={isTimerActive ? C.danger : C.amber} />
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFocusTimer(25 * 60); setIsTimerActive(false); }} style={styles.timerResetBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color="#A0A0B0" />
                 </TouchableOpacity>
              </View>
           </View>
        </Card>

        {/* ── Discipline Heatmap (Simulation) ── */}
        <Card C={C} style={{ marginBottom: 16 }}>
           <SectionHeader title="Discipline Consistency" icon="grid" C={C} />
           <View style={styles.heatmap}>
              {Array.from({ length: 28 }).map((_, i) => (
                 <View key={i} style={[styles.heatBox, { backgroundColor: i < 18 ? C.amber + (0.1 + (i/28)).toFixed(2) : 'rgba(255,255,255,0.05)' }]} />
              ))}
           </View>
           <Text style={styles.heatmapLabel}>18 Day Discipline Streak</Text>
        </Card>

        {/* ── Bedtime Cycle ── */}
        <Card C={C}>
           <SectionHeader title="Circadian Rhythm" icon="weather-night" C={C} />
           <View style={styles.bedtimeRow}>
              <View>
                 <Text style={styles.bedtimeLabel}>Restorative Sleep</Text>
                 <Text style={styles.bedtimeValue}>22:00 - 06:00</Text>
              </View>
              <Switch
                value={settings.bedtime.enabled}
                onValueChange={(v: boolean) => updateBedtime({ ...settings.bedtime, enabled: v })}
                trackColor={{ false: "#333", true: C.amber + "88" }}
                thumbColor={settings.bedtime.enabled ? C.amber : "#f4f3f4"}
              />
           </View>
           <Text style={styles.bedtimeDesc}>Deep concentration requires deep recovery. Bedtime mode locks all distractions automatically.</Text>
        </Card>

        <View style={{ height: 16 }} />

        {/* ── Planner Teaser ── */}
        <Card C={C}>
           <SectionHeader title="Strategic Planner" icon="format-list-checks" C={C} />
           <View style={styles.plannerTeaser}>
              <View style={styles.teaserRow}><Ionicons name="checkbox" size={18} color={C.amber} /><Text style={styles.teaserText}>6:00 AM - Mental Clarity Meditation</Text></View>
              <View style={styles.teaserRow}><Ionicons name="checkbox" size={18} color={C.amber} /><Text style={styles.teaserText}>7:30 AM - Heavy Lift Session</Text></View>
              <View style={styles.teaserRow}><Ionicons name="square-outline" size={18} color={C.amber} /><Text style={styles.teaserText}>9:00 AM - Strategic Deep Work</Text></View>
           </View>
        </Card>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  timerContainer: { alignItems: 'center', marginVertical: 10 },
  timerText: { fontSize: 56, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  timerControls: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 10 },
  timerBtn: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timerResetBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  heatBox: { width: (width - 100) / 7, height: (width - 100) / 7, borderRadius: 6 },
  heatmapLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#A0A0B0', textAlign: 'center' },
  bedtimeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bedtimeLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#A0A0B0' },
  bedtimeValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  bedtimeDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#A0A0B0', lineHeight: 18 },
  plannerTeaser: { gap: 10 },
  teaserRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teaserText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#FFFFFF' },
});
