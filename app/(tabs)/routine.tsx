import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { usePlanner } from "@/context/PlannerContext";

const { width } = Dimensions.get("window");

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, C }: { icon: string; title: string; subtitle?: string; C: any }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, shadowColor: C.amber, shadowOpacity: 0.1, shadowRadius: 10 }}>
          <MaterialCommunityIcons name={icon as any} size={20} color={C.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 2 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

function Card({ children, style, C, glowColor }: { children: React.ReactNode; style?: object; C: any; glowColor?: string }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: glowColor ? glowColor + '50' : C.border, overflow: 'hidden' }, style]}>
      {glowColor && (
         <View style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, borderRadius: 50, backgroundColor: glowColor, opacity: 0.1, transform: [{ scale: 2 }] }} />
      )}
      {children}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RoutineScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const { tasks, toggleCompleted, removeTask } = usePlanner();

  const [mode, setMode] = useState<"pomodoro" | "sleep">("pomodoro");
  const [timerStatus, setTimerStatus] = useState<"idle" | "running" | "break">("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (timerStatus === "running" || timerStatus === "break") {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (timerStatus === "running") {
              setTimerStatus("break");
              return 5 * 60;
            } else {
              setTimerStatus("idle");
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);

      if (timerStatus === "running") {
         Animated.loop(
            Animated.sequence([
               Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
               Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
         ).start();
      } else {
         pulseAnim.stopAnimation();
         pulseAnim.setValue(1);
      }
    } else {
       pulseAnim.stopAnimation();
       pulseAnim.setValue(1);
    }
    return () => clearInterval(interval);
  }, [timerStatus]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timerStatus === "idle") setTimerStatus("running");
    else if (timerStatus === "running") setTimerStatus("idle");
    else { setTimerStatus("running"); setTimeLeft(25 * 60); }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeTasks = tasks.filter(t => !t.completed);

  return (
    <LinearGradient colors={["#0D0B1E", "#05050A"]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }}
      >
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
           <Text style={{ fontSize: 34, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -0.5 }}>Neural Routine</Text>
           <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 6, lineHeight: 22 }}>Hyper-focused time & recovery management.</Text>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabContainer}>
           <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setMode("pomodoro"); }} style={[styles.tab, mode === "pomodoro" && styles.tabActive]}>
              <Text style={[styles.tabText, mode === "pomodoro" && { color: "#FFF" }]}>Pomodoro Engine</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setMode("sleep"); }} style={[styles.tab, mode === "sleep" && styles.tabActive]}>
              <Text style={[styles.tabText, mode === "sleep" && { color: "#FFF" }]}>Circadian Sleep</Text>
           </TouchableOpacity>
        </View>

        {mode === "pomodoro" ? (
           <View style={{ paddingHorizontal: 16 }}>
              {/* ── Elite Timer ── */}
              <View style={styles.timerContainer}>
                 <Animated.View style={[styles.timerGlow, { transform: [{ scale: pulseAnim }], opacity: timerStatus === 'running' ? 0.3 : 0 }]} />
                 <View style={[styles.timerCircle, { borderColor: timerStatus === "running" ? C.amber : (timerStatus === "break" ? C.green : 'rgba(255,255,255,0.05)') }]}>
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    <Text style={[styles.timerSub, { color: timerStatus === "running" ? C.amber : (timerStatus === "break" ? C.green : '#555') }]}>
                       {timerStatus === "running" ? "DEEP WORK" : (timerStatus === "break" ? "RECOVERY" : "READY")}
                    </Text>
                 </View>
              </View>

              <View style={styles.timerControls}>
                 <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setTimeLeft(25*60); setTimerStatus("idle"); }} style={styles.controlBtn}>
                    <Ionicons name="refresh" size={24} color={C.textMuted} />
                 </TouchableOpacity>
                 <TouchableOpacity onPress={toggleTimer} style={[styles.playBtn, { backgroundColor: timerStatus === "running" ? 'rgba(255,82,82,0.1)' : 'rgba(255,176,0,0.1)', borderColor: timerStatus === "running" ? C.danger : C.amber }]}>
                    <Ionicons name={timerStatus === "running" ? "pause" : "play"} size={32} color={timerStatus === "running" ? C.danger : C.amber} style={timerStatus !== "running" ? { marginLeft: 4 } : {}} />
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setTimeLeft(5*60); setTimerStatus("break"); }} style={styles.controlBtn}>
                    <MaterialCommunityIcons name="coffee-outline" size={24} color={C.green} />
                 </TouchableOpacity>
              </View>

              <View style={{ height: 32 }} />

              {/* ── Active Tasks ── */}
              <SectionHeader title="Today's Objectives" icon="check-all" C={C} />
              {activeTasks.length === 0 ? (
                 <View style={styles.emptyState}>
                    <Feather name="check-circle" size={40} color={C.textMuted} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <Text style={styles.emptyText}>All systems nominal.</Text>
                    <Text style={styles.emptySub}>No active tasks for today.</Text>
                 </View>
              ) : (
                 <View style={{ gap: 12 }}>
                    {activeTasks.map(t => (
                       <View key={t.id} style={styles.taskCard}>
                          <TouchableOpacity onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); toggleCompleted(t.id); }} style={[styles.taskCheck, { borderColor: C.amber }]}>
                             {t.completed && <Ionicons name="checkmark" size={16} color={C.amber} />}
                          </TouchableOpacity>
                          <Text style={styles.taskTitle}>{t.title}</Text>
                          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); removeTask(t.id); }} style={{ padding: 8 }}>
                             <Feather name="trash-2" size={18} color={C.danger + '88'} />
                          </TouchableOpacity>
                       </View>
                    ))}
                 </View>
              )}
           </View>
        ) : (
           <View style={{ paddingHorizontal: 16 }}>
              {/* ── Sleep Engine ── */}
              <Card C={C} glowColor="#448AFF" style={{ borderColor: 'rgba(68,138,255,0.3)' }}>
                 <SectionHeader title="Circadian Oscillator" icon="moon-waning-crescent" C={C} />
                 <Text style={styles.sleepDesc}>Human sleep cycles operate in 90-minute intervals. Waking up during a cycle causes grogginess. Waking up between cycles guarantees peak alertness.</Text>
                 
                 <View style={{ height: 20 }} />
                 <View style={styles.sleepGrid}>
                    <View style={styles.cycleCard}>
                       <Text style={styles.cycleLabel}>4 Cycles</Text>
                       <Text style={styles.cycleTime}>6 Hours</Text>
                       <Text style={styles.cycleSub}>Minimum viable</Text>
                    </View>
                    <View style={[styles.cycleCard, { borderColor: '#448AFF', backgroundColor: 'rgba(68,138,255,0.1)' }]}>
                       <Text style={[styles.cycleLabel, { color: '#448AFF' }]}>5 Cycles</Text>
                       <Text style={[styles.cycleTime, { color: '#FFFFFF' }]}>7.5 Hours</Text>
                       <Text style={[styles.cycleSub, { color: '#448AFF' }]}>Optimal performance</Text>
                    </View>
                    <View style={styles.cycleCard}>
                       <Text style={styles.cycleLabel}>6 Cycles</Text>
                       <Text style={styles.cycleTime}>9 Hours</Text>
                       <Text style={styles.cycleSub}>Maximum recovery</Text>
                    </View>
                 </View>
                 
                 <View style={{ height: 20 }} />
                 <View style={styles.timeBox}>
                    <Ionicons name="time" size={20} color="#448AFF" />
                    <Text style={styles.timeText}>If you sleep right now, wake up at:</Text>
                    <Text style={styles.calcTime}>
                       {new Date(Date.now() + 7.5 * 60 * 60 * 1000 + 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.timeSub}>(Includes 15m to fall asleep)</Text>
                 </View>
              </Card>

              <View style={{ height: 20 }} />

              <Card C={C} style={{ backgroundColor: 'rgba(255,82,82,0.05)', borderColor: 'rgba(255,82,82,0.2)' }} glowColor={C.danger}>
                 <SectionHeader title="Blue Light Warning" icon="eye-off" C={C} />
                 <Text style={styles.sleepDesc}>Screen exposure within 60 minutes of sleep destroys Melatonin production. Enable Night Shield or put the device away.</Text>
              </Card>
           </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, marginBottom: 30 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#808090', letterSpacing: 0.5 },
  timerContainer: { alignItems: 'center', marginVertical: 20, position: 'relative' },
  timerGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: Colors.dark.amber, top: 10 },
  timerCircle: { width: 300, height: 300, borderRadius: 150, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.backgroundCard, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  timerText: { fontSize: 72, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: -2 },
  timerSub: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 4, marginTop: 8 },
  timerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  playBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, shadowColor: '#FFB000', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#A0A0B0', marginTop: 4 },
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.dark.backgroundCard, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  taskCheck: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  taskTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: '#FFFFFF' },
  sleepDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#A0A0B0', lineHeight: 22 },
  sleepGrid: { flexDirection: 'row', gap: 12 },
  cycleCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cycleLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#A0A0B0', marginBottom: 4 },
  cycleTime: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  cycleSub: { fontSize: 9, fontFamily: 'Inter_400Regular', color: '#808090', marginTop: 4, textAlign: 'center' },
  timeBox: { alignItems: 'center', backgroundColor: 'rgba(68,138,255,0.05)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(68,138,255,0.2)' },
  timeText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#FFFFFF', marginTop: 8 },
  calcTime: { fontSize: 36, fontFamily: 'Inter_700Bold', color: '#448AFF', marginVertical: 4 },
  timeSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#808090' },
});
