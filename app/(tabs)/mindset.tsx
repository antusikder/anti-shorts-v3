import React, { useEffect, useRef, useState } from "react";
import {
  View, ScrollView, Text, TouchableOpacity, StyleSheet, Switch,
  TextInput, Alert, Modal, Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMindset, PlannerTask, BedtimeConfig, ScreenTimeConfig } from "@/context/MindsetContext";
import { C } from "@/constants/colors";

const CARD_RADIUS = 20;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function Section({ title, icon, color = C.amber, children }: {
  title: string; icon: string; color?: string; children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={[styles.sectionIcon, { backgroundColor: color + "22" }]}>
          <MaterialCommunityIcons name={icon as any} size={18} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={C.textMuted} />
      </TouchableOpacity>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function Row({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

// ─── Pomodoro Timer ──────────────────────────────────────────────────────────
function PomodoroTimer() {
  const { mindset, updateFocusSession, completeFocusSession } = useMindset();
  const cfg = mindset.focusSession;
  const [phase, setPhase] = useState<"work" | "break" | "long_break">("work");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(cfg.workMin * 60);
  const [sessionsDone, setSessionsDone] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseTotal = phase === "work" ? cfg.workMin * 60 : phase === "break" ? cfg.breakMin * 60 : cfg.longBreakMin * 60;
  const progress = 1 - secondsLeft / phaseTotal;
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");

  useEffect(() => {
    setSecondsLeft(cfg.workMin * 60);
    setPhase("work");
    setRunning(false);
  }, [cfg]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            Vibration.vibrate([0, 300, 100, 300]);
            advancePhase();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase]);

  const advancePhase = () => {
    if (phase === "work") {
      const newCount = sessionsDone + 1;
      setSessionsDone(newCount);
      completeFocusSession();
      if (newCount % cfg.sessionsBeforeLongBreak === 0) {
        setPhase("long_break");
        setSecondsLeft(cfg.longBreakMin * 60);
      } else {
        setPhase("break");
        setSecondsLeft(cfg.breakMin * 60);
      }
    } else {
      setPhase("work");
      setSecondsLeft(cfg.workMin * 60);
    }
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(cfg.workMin * 60);
    setSessionsDone(0);
  };

  const phaseColor = phase === "work" ? C.amber : phase === "break" ? C.green : C.blue;
  const phaseLabel = phase === "work" ? "Focus" : phase === "break" ? "Break" : "Long Break";
  const circumference = 2 * Math.PI * 60;
  const strokeDash = circumference * (1 - progress);

  return (
    <View style={styles.pomodoro}>
      <View style={styles.pomodoroTimer}>
        {/* Simple progress ring using View borders */}
        <View style={[styles.pomodoroRing, { borderColor: phaseColor + "33" }]}>
          <View style={[styles.pomodoroFill, { borderColor: phaseColor, borderRightColor: "transparent", borderTopColor: progress > 0.75 ? phaseColor : "transparent", transform: [{ rotate: `${progress * 360}deg` }] }]} />
          <View style={styles.pomodoroCenter}>
            <Text style={[styles.pomodoroTime, { color: phaseColor }]}>{mins}:{secs}</Text>
            <Text style={[styles.pomodoroPhase, { color: phaseColor + "99" }]}>{phaseLabel}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.pomodoroSessions}>Sessions today: {sessionsDone} · Total: {mindset.totalFocusSessionsCompleted}</Text>
      <View style={styles.pomodoroControls}>
        <TouchableOpacity onPress={reset} style={styles.pomodoroBtn}>
          <MaterialCommunityIcons name="restart" size={20} color={C.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRunning(!running)} style={[styles.pomodoroPlayBtn, { backgroundColor: phaseColor + "22", borderColor: phaseColor }]}>
          <MaterialCommunityIcons name={running ? "pause" : "play"} size={28} color={phaseColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={advancePhase} style={styles.pomodoroBtn}>
          <MaterialCommunityIcons name="skip-next" size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Daily Planner ────────────────────────────────────────────────────────────
function DailyPlanner() {
  const { mindset, setTodayTasks, toggleTask } = useMindset();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<PlannerTask["category"]>("morning");
  const [newPriority, setNewPriority] = useState<PlannerTask["priority"]>("medium");

  const tasks = mindset.todayTasks;
  const donePct = tasks.length > 0 ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0;

  const addTask = () => {
    if (!newLabel.trim()) return;
    const task: PlannerTask = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      category: newCategory,
      done: false,
      priority: newPriority,
    };
    setTodayTasks([...tasks, task]);
    setNewLabel("");
    setShowAdd(false);
  };

  const removeTask = (id: string) => {
    setTodayTasks(tasks.filter((t) => t.id !== id));
  };

  const categoryColors: Record<PlannerTask["category"], string> = {
    morning: C.amber, afternoon: C.blue, evening: C.purple, anytime: C.green,
  };

  const priorityColors: Record<PlannerTask["priority"], string> = {
    low: C.green, medium: C.amber, high: C.danger,
  };

  return (
    <View>
      {tasks.length > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${donePct}%` as any, backgroundColor: C.green }]} />
          <Text style={styles.progressText}>{donePct}% complete</Text>
        </View>
      )}

      {tasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          onPress={() => toggleTask(task.id)}
          onLongPress={() => { Vibration.vibrate(50); removeTask(task.id); }}
          style={[styles.taskRow, task.done && styles.taskDone]}
          activeOpacity={0.7}
        >
          <View style={[styles.taskCheck, { borderColor: categoryColors[task.category] }]}>
            {task.done && <MaterialCommunityIcons name="check" size={12} color={categoryColors[task.category]} />}
          </View>
          <Text style={[styles.taskLabel, task.done && styles.taskLabelDone]}>{task.label}</Text>
          <View style={[styles.priorityDot, { backgroundColor: priorityColors[task.priority] }]} />
        </TouchableOpacity>
      ))}

      {showAdd ? (
        <View style={styles.addTaskForm}>
          <TextInput
            style={styles.addInput}
            placeholder="Task name..."
            placeholderTextColor={C.textMuted}
            value={newLabel}
            onChangeText={setNewLabel}
            autoFocus
          />
          <View style={styles.addOptions}>
            {(["morning", "afternoon", "evening", "anytime"] as PlannerTask["category"][]).map((cat) => (
              <TouchableOpacity key={cat} onPress={() => setNewCategory(cat)} style={[styles.addChip, newCategory === cat && { backgroundColor: categoryColors[cat] + "33", borderColor: categoryColors[cat] }]}>
                <Text style={[styles.addChipText, newCategory === cat && { color: categoryColors[cat] }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addRow}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addTask} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addTaskBtn}>
          <MaterialCommunityIcons name="plus" size={18} color={C.amber} />
          <Text style={styles.addTaskText}>Add Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Weekly Routine Grid ──────────────────────────────────────────────────────
function WeeklyGrid() {
  const { mindset } = useMindset();
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
  return (
    <View style={styles.weekGrid}>
      {DAYS.map((day) => {
        const routine = mindset.weeklyRoutine.find((r) => r.day === day);
        const blockCount = routine?.blocks.length ?? 0;
        const isToday = day === today;
        return (
          <View key={day} style={[styles.weekDay, isToday && styles.weekDayToday]}>
            <Text style={[styles.weekDayLabel, isToday && { color: C.amber }]}>{day}</Text>
            <Text style={styles.weekDayBlocks}>
              {blockCount > 0 ? `${blockCount} block${blockCount > 1 ? "s" : ""}` : "—"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MindsetScreen() {
  const { mindset, updateBedtime, updateScreenTime, updateFocusSession } = useMindset();

  const bedtime = mindset.bedtime;
  const screenTime = mindset.screenTime;

  const fmt = (h: number, m: number) => `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  return (
    <LinearGradient colors={["#07060F", "#0D0B1E", "#07060F"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="brain" size={22} color={C.blue} />
            <Text style={styles.headerTitle}>Mindset & Routine</Text>
          </View>
          <Text style={styles.headerSub}>Build habits, own your time.</Text>

          {/* Streak Banner */}
          {mindset.streakDays > 0 && (
            <View style={styles.streakBanner}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakText}>{mindset.streakDays} day streak — keep it going!</Text>
            </View>
          )}

          {/* Focus Sessions (Pomodoro) */}
          <Section title="Focus Timer" icon="timer-outline" color={C.amber}>
            <PomodoroTimer />
            <View style={styles.divider} />
            <Row
              label="Work Duration"
              sub={`${mindset.focusSession.workMin} minutes`}
              right={
                <View style={styles.numberAdjust}>
                  <TouchableOpacity onPress={() => { mindset.focusSession.workMin > 5 && updateFocusSession({ ...mindset.focusSession, workMin: mindset.focusSession.workMin - 5 }); }} style={styles.adjustBtn}>
                    <MaterialCommunityIcons name="minus" size={14} color={C.textSub} />
                  </TouchableOpacity>
                  <Text style={styles.adjustValue}>{mindset.focusSession.workMin}m</Text>
                  <TouchableOpacity onPress={() => updateFocusSession({ ...mindset.focusSession, workMin: mindset.focusSession.workMin + 5 })} style={styles.adjustBtn}>
                    <MaterialCommunityIcons name="plus" size={14} color={C.textSub} />
                  </TouchableOpacity>
                </View>
              }
            />
            <View style={styles.divider} />
            <Row
              label="Break Duration"
              sub={`${mindset.focusSession.breakMin} minutes`}
              right={
                <View style={styles.numberAdjust}>
                  <TouchableOpacity onPress={() => { mindset.focusSession.breakMin > 1 && updateFocusSession({ ...mindset.focusSession, breakMin: mindset.focusSession.breakMin - 1 }); }} style={styles.adjustBtn}>
                    <MaterialCommunityIcons name="minus" size={14} color={C.textSub} />
                  </TouchableOpacity>
                  <Text style={styles.adjustValue}>{mindset.focusSession.breakMin}m</Text>
                  <TouchableOpacity onPress={() => updateFocusSession({ ...mindset.focusSession, breakMin: mindset.focusSession.breakMin + 1 })} style={styles.adjustBtn}>
                    <MaterialCommunityIcons name="plus" size={14} color={C.textSub} />
                  </TouchableOpacity>
                </View>
              }
            />
          </Section>

          {/* Daily Planner */}
          <Section title="Daily Planner" icon="calendar-check-outline" color={C.blue}>
            <DailyPlanner />
          </Section>

          {/* Weekly Routine */}
          <Section title="Weekly Overview" icon="calendar-week" color={C.purple}>
            <WeeklyGrid />
            <Text style={styles.routineHint}>Long-press a day to set your blocks (coming in next update)</Text>
          </Section>

          {/* Bedtime */}
          <Section title="Bedtime Routine" icon="bed-clock" color={C.cyan}>
            <Row
              label="Enable Bedtime"
              sub="Remind you when to wind down"
              right={
                <Switch
                  value={bedtime.enabled}
                  onValueChange={(v) => updateBedtime({ ...bedtime, enabled: v })}
                  thumbColor={bedtime.enabled ? C.cyan : "#555"}
                  trackColor={{ false: "#333", true: C.cyan + "44" }}
                />
              }
            />
            {bedtime.enabled && (
              <>
                <View style={styles.divider} />
                <Row
                  label="Bedtime"
                  sub="You'll get a reminder before this"
                  right={<Text style={styles.timeValue}>{fmt(bedtime.bedHour, bedtime.bedMin)}</Text>}
                />
                <View style={styles.divider} />
                <Row
                  label="Wake Time"
                  sub="Start of your day"
                  right={<Text style={styles.timeValue}>{fmt(bedtime.wakeHour, bedtime.wakeMin)}</Text>}
                />
                <View style={styles.divider} />
                <Row
                  label="Remind me"
                  sub="Minutes before bedtime"
                  right={
                    <View style={styles.numberAdjust}>
                      <TouchableOpacity onPress={() => { bedtime.reminderMinsBefore > 5 && updateBedtime({ ...bedtime, reminderMinsBefore: bedtime.reminderMinsBefore - 5 }); }} style={styles.adjustBtn}>
                        <MaterialCommunityIcons name="minus" size={14} color={C.textSub} />
                      </TouchableOpacity>
                      <Text style={styles.adjustValue}>{bedtime.reminderMinsBefore}m</Text>
                      <TouchableOpacity onPress={() => updateBedtime({ ...bedtime, reminderMinsBefore: bedtime.reminderMinsBefore + 5 })} style={styles.adjustBtn}>
                        <MaterialCommunityIcons name="plus" size={14} color={C.textSub} />
                      </TouchableOpacity>
                    </View>
                  }
                />
              </>
            )}
          </Section>

          {/* Screen Time */}
          <Section title="Screen Time" icon="cellphone-off" color={C.danger}>
            <Row
              label="Enable Limit"
              sub="Get warned when limit is near"
              right={
                <Switch
                  value={screenTime.enabled}
                  onValueChange={(v) => updateScreenTime({ ...screenTime, enabled: v })}
                  thumbColor={screenTime.enabled ? C.danger : "#555"}
                  trackColor={{ false: "#333", true: C.danger + "44" }}
                />
              }
            />
            {screenTime.enabled && (
              <>
                <View style={styles.divider} />
                <Row
                  label="Daily Limit"
                  right={
                    <View style={styles.numberAdjust}>
                      <TouchableOpacity onPress={() => { screenTime.dailyLimitMin > 15 && updateScreenTime({ ...screenTime, dailyLimitMin: screenTime.dailyLimitMin - 15 }); }} style={styles.adjustBtn}>
                        <MaterialCommunityIcons name="minus" size={14} color={C.textSub} />
                      </TouchableOpacity>
                      <Text style={styles.adjustValue}>{screenTime.dailyLimitMin}m</Text>
                      <TouchableOpacity onPress={() => updateScreenTime({ ...screenTime, dailyLimitMin: screenTime.dailyLimitMin + 15 })} style={styles.adjustBtn}>
                        <MaterialCommunityIcons name="plus" size={14} color={C.textSub} />
                      </TouchableOpacity>
                    </View>
                  }
                />
                <View style={styles.divider} />
                <Row
                  label="Cool Down After Limit"
                  sub="Lock screen for this long after limit"
                  right={
                    <View style={styles.numberAdjust}>
                      <TouchableOpacity onPress={() => { screenTime.cooldownMin > 1 && updateScreenTime({ ...screenTime, cooldownMin: screenTime.cooldownMin - 1 }); }} style={styles.adjustBtn}>
                        <MaterialCommunityIcons name="minus" size={14} color={C.textSub} />
                      </TouchableOpacity>
                      <Text style={styles.adjustValue}>{screenTime.cooldownMin}m</Text>
                      <TouchableOpacity onPress={() => updateScreenTime({ ...screenTime, cooldownMin: screenTime.cooldownMin + 1 })} style={styles.adjustBtn}>
                        <MaterialCommunityIcons name="plus" size={14} color={C.textSub} />
                      </TouchableOpacity>
                    </View>
                  }
                />
              </>
            )}
          </Section>

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
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4, marginTop: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, letterSpacing: -0.5 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginBottom: 16 },

  streakBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.amberGlow, borderWidth: 1, borderColor: C.amber + "33", borderRadius: 14, padding: 12, marginBottom: 16 },
  streakFire: { fontSize: 22 },
  streakText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.amber },

  section: { marginBottom: 16, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: CARD_RADIUS, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text, flex: 1 },
  sectionBody: { borderTopWidth: 1, borderTopColor: C.border },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.text },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Pomodoro
  pomodoro: { padding: 16, alignItems: "center" },
  pomodoroTimer: { marginBottom: 12 },
  pomodoroRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, alignItems: "center", justifyContent: "center" },
  pomodoroFill: { position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderLeftColor: "transparent", borderBottomColor: "transparent" },
  pomodoroCenter: { alignItems: "center" },
  pomodoroTime: { fontFamily: "Inter_700Bold", fontSize: 36, letterSpacing: -2 },
  pomodoroPhase: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  pomodoroSessions: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, marginBottom: 12 },
  pomodoroControls: { flexDirection: "row", alignItems: "center", gap: 20 },
  pomodoroBtn: { padding: 10, borderRadius: 12, backgroundColor: C.bgElevated },
  pomodoroPlayBtn: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: "center", justifyContent: "center" },

  // Planner
  progressBar: { height: 6, backgroundColor: C.bgElevated, borderRadius: 3, margin: 14, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { position: "absolute", right: 0, top: -16, fontFamily: "Inter_500Medium", fontSize: 11, color: C.green },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, paddingHorizontal: 14 },
  taskDone: { opacity: 0.5 },
  taskCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  taskLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: C.text },
  taskLabelDone: { textDecorationLine: "line-through", color: C.textMuted },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  addTaskBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderTopWidth: 1, borderTopColor: C.border },
  addTaskText: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.amber },
  addTaskForm: { padding: 14, gap: 10 },
  addInput: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: C.text },
  addOptions: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  addChip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgElevated },
  addChipText: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textSub },
  addRow: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: C.bgElevated, alignItems: "center" },
  cancelBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted },
  saveBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: C.amber + "22", borderWidth: 1, borderColor: C.amber + "55", alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.amber },

  // Weekly
  weekGrid: { flexDirection: "row", justifyContent: "space-between", padding: 14, gap: 4 },
  weekDay: { flex: 1, alignItems: "center", padding: 6, borderRadius: 10, backgroundColor: C.bgElevated },
  weekDayToday: { backgroundColor: C.amber + "22", borderWidth: 1, borderColor: C.amber + "44" },
  weekDayLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textSub },
  weekDayBlocks: { fontFamily: "Inter_400Regular", fontSize: 9, color: C.textMuted, marginTop: 4, textAlign: "center" },
  routineHint: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, padding: 14, paddingTop: 0 },

  // Common
  numberAdjust: { flexDirection: "row", alignItems: "center", gap: 6 },
  adjustBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.bgElevated, alignItems: "center", justifyContent: "center" },
  adjustValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, minWidth: 32, textAlign: "center" },
  timeValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.amber },
});
