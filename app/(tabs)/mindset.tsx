import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Dimensions, Alert, Vibration,
  AppState, AppStateStatus, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { useMindset } from "@/context/MindsetContext";
import { C, R } from "@/constants/colors";

const { width: SW } = Dimensions.get("window");
const SCREEN_TIME_KEY = "@freshmind:screen_time_v2";

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1: SCREEN TIME BLOCKER (Real enforcement)
// ════════════════════════════════════════════════════════════════════════════

interface ScreenTimeData {
  date: string;
  usedSeconds: number;
  limitMinutes: number;
  enabled: boolean;
  lastActiveTimestamp: number;
}

const BlockingOverlay = memo(({ remainingSec, onBypass }: { remainingSec: number; onBypass?: () => void }) => {
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  return (
    <Modal visible animationType="fade" statusBarTranslucent transparent={false}>
      <View style={bo.container}>
        <View style={bo.iconWrap}>
          <MaterialCommunityIcons name="shield-lock" size={64} color={C.amber} />
        </View>
        <Text style={bo.title}>Screen Time Limit Reached</Text>
        <Text style={bo.subtitle}>
          You've used your allocated screen time for today.{"\n"}
          Take a break. Go outside. Move your body.
        </Text>

        <View style={bo.timerCard}>
          <Text style={bo.timerLabel}>Cooldown remaining</Text>
          <Text style={bo.timer}>
            {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
          </Text>
        </View>

        <View style={bo.tipsSection}>
          <Text style={bo.tipsTitle}>While you wait:</Text>
          {[
            { icon: "walk", text: "Take a 10-minute walk" },
            { icon: "water", text: "Drink a glass of water" },
            { icon: "meditation", text: "Practice deep breathing" },
            { icon: "book-open-variant", text: "Read a physical book" },
          ].map((tip, i) => (
            <View key={i} style={bo.tipRow}>
              <MaterialCommunityIcons name={tip.icon as any} size={18} color={C.textMuted} />
              <Text style={bo.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        <Text style={bo.lockNote}>
          This screen cannot be dismissed until the cooldown ends.
        </Text>
      </View>
    </Modal>
  );
});

const bo = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: C.bg,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.amberBg, borderWidth: 2, borderColor: C.amberBorder,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, textAlign: "center", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSub, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  timerCard: {
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.amberBorder,
    borderRadius: R.card, padding: 24, alignItems: "center", width: "100%", marginBottom: 32,
  },
  timerLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  timer: { fontFamily: "Inter_700Bold", fontSize: 56, color: C.amber, letterSpacing: -2 },
  tipsSection: { width: "100%", marginBottom: 32 },
  tipsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted, marginBottom: 12 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSub },
  lockNote: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, textAlign: "center", opacity: 0.6 },
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2: SCREEN TIME TRACKER
// ════════════════════════════════════════════════════════════════════════════

const ScreenTimeSection = memo(() => {
  const { mindset, updateScreenTime } = useMindset();
  const st = mindset.screenTime;

  const [usedSeconds, setUsedSeconds] = useState(0);
  const [showBlocker, setShowBlocker] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const activeStartRef = useRef<number>(Date.now());
  const intervalRef = useRef<any>(null);

  // Load persisted screen time data
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SCREEN_TIME_KEY);
        if (raw) {
          const data: ScreenTimeData = JSON.parse(raw);
          const today = new Date().toDateString();
          if (data.date === today) {
            setUsedSeconds(data.usedSeconds);
          } else {
            // New day — reset
            await AsyncStorage.setItem(SCREEN_TIME_KEY, JSON.stringify({
              date: today, usedSeconds: 0, limitMinutes: st.dailyLimitMin,
              enabled: st.enabled, lastActiveTimestamp: Date.now(),
            }));
          }
        }
      } catch {}
    })();
  }, []);

  // Track foreground time with AppState
  useEffect(() => {
    if (!st.enabled) return;

    activeStartRef.current = Date.now();

    // Tick every second while active
    intervalRef.current = setInterval(() => {
      setUsedSeconds(prev => {
        const next = prev + 1;
        // Save every 10 seconds
        if (next % 10 === 0) {
          AsyncStorage.setItem(SCREEN_TIME_KEY, JSON.stringify({
            date: new Date().toDateString(),
            usedSeconds: next,
            limitMinutes: st.dailyLimitMin,
            enabled: st.enabled,
            lastActiveTimestamp: Date.now(),
          })).catch(() => {});
        }

        // Check limits
        const limitSec = st.dailyLimitMin * 60;
        const warningSec = Math.floor(limitSec * (st.warningAtPercent / 100));

        if (next === warningSec) {
          // Fire 80% warning notification
          Notifications.scheduleNotificationAsync({
            content: {
              title: "Screen Time Warning",
              body: `You've used ${st.warningAtPercent}% of your daily screen time (${st.dailyLimitMin} min limit).`,
            },
            trigger: null,
          }).catch(() => {});
        }

        if (next >= limitSec && !showBlocker) {
          // LIMIT REACHED — show blocking overlay
          setShowBlocker(true);
          setCooldownSec(st.cooldownMin * 60);
          Vibration.vibrate([0, 200, 100, 200, 100, 200]);
          Notifications.scheduleNotificationAsync({
            content: {
              title: "Screen Time Limit Reached",
              body: `Your ${st.dailyLimitMin}-minute daily limit is up. Take a break!`,
            },
            trigger: null,
          }).catch(() => {});
        }

        return next;
      });
    }, 1000);

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        activeStartRef.current = Date.now();
      } else if (state === "background" || state === "inactive") {
        // Pause tracking
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [st.enabled, st.dailyLimitMin]);

  // Cooldown countdown for blocker
  useEffect(() => {
    if (!showBlocker || cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowBlocker(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showBlocker]);

  const usedMin = Math.floor(usedSeconds / 60);
  const limitMin = st.dailyLimitMin;
  const pct = Math.min(100, Math.round((usedSeconds / (limitMin * 60)) * 100));
  const progressWidth = `${Math.min(100, pct)}%` as any;

  const handleToggle = (val: boolean) => {
    updateScreenTime({ ...st, enabled: val });
  };

  const handleLimitChange = (text: string) => {
    const mins = parseInt(text) || 1;
    const clamped = Math.max(1, Math.min(480, mins));
    updateScreenTime({ ...st, dailyLimitMin: clamped });
  };

  return (
    <View style={ss.card}>
      {showBlocker && <BlockingOverlay remainingSec={cooldownSec} />}

      <View style={ss.header}>
        <MaterialCommunityIcons name="timer-sand" size={20} color={C.amber} />
        <Text style={ss.title}>Screen Time</Text>
        <Switch
          value={st.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: "rgba(255,255,255,0.08)", true: C.amberBg }}
          thumbColor={st.enabled ? C.amber : C.textMuted}
        />
      </View>

      {st.enabled && (
        <>
          {/* Progress */}
          <View style={ss.progressSection}>
            <View style={ss.progressRow}>
              <Text style={ss.usedText}>{usedMin} min</Text>
              <Text style={ss.limitText}>/ {limitMin} min</Text>
            </View>
            <View style={ss.progressBar}>
              <View style={[ss.progressFill, {
                width: progressWidth,
                backgroundColor: pct >= 100 ? C.danger : pct >= 80 ? C.amber : C.success
              }]} />
            </View>
            <Text style={[ss.pctText, { color: pct >= 100 ? C.danger : pct >= 80 ? C.amber : C.textMuted }]}>
              {pct}% used
            </Text>
          </View>

          {/* Limit input */}
          <View style={ss.inputRow}>
            <Text style={ss.inputLabel}>Daily Limit (minutes)</Text>
            <TextInput
              style={ss.input}
              value={st.dailyLimitMin.toString()}
              onChangeText={handleLimitChange}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          </View>

          {/* Quick presets */}
          <View style={ss.presetsRow}>
            {[1, 5, 15, 30, 60, 120].map(m => (
              <TouchableOpacity
                key={m}
                style={[ss.preset, st.dailyLimitMin === m && ss.presetActive]}
                onPress={() => updateScreenTime({ ...st, dailyLimitMin: m })}
                activeOpacity={0.8}
              >
                <Text style={[ss.presetText, st.dailyLimitMin === m && { color: C.amber }]}>
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cooldown */}
          <View style={ss.inputRow}>
            <Text style={ss.inputLabel}>Cooldown (minutes after limit)</Text>
            <TextInput
              style={ss.input}
              value={st.cooldownMin.toString()}
              onChangeText={(v) => {
                const n = parseInt(v) || 5;
                updateScreenTime({ ...st, cooldownMin: Math.max(1, Math.min(60, n)) });
              }}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          </View>
        </>
      )}
    </View>
  );
});

const ss = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text, flex: 1 },
  progressSection: { marginBottom: 16 },
  progressRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 8 },
  usedText: { fontFamily: "Inter_700Bold", fontSize: 32, color: C.text, letterSpacing: -1 },
  limitText: { fontFamily: "Inter_400Regular", fontSize: 16, color: C.textMuted },
  progressBar: { height: 8, backgroundColor: C.bgElevated, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  pctText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSub, flex: 1, marginRight: 12 },
  input: {
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    borderRadius: R.button, paddingVertical: 8, paddingHorizontal: 14,
    fontFamily: "Inter_600SemiBold", fontSize: 18, color: C.text, textAlign: "center",
    minWidth: 70,
  },
  presetsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  preset: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: R.circle,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
  },
  presetActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  presetText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted },
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3: POMODORO TIMER
// ════════════════════════════════════════════════════════════════════════════

const PomodoroSection = memo(() => {
  const { mindset, completeFocusSession } = useMindset();
  const fs = mindset.focusSession;

  const [phase, setPhase] = useState<"idle" | "work" | "break">("idle");
  const [timeLeft, setTimeLeft] = useState(fs.workMin * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    if (phase === "idle") return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Vibration.vibrate([0, 200, 100, 200]);
          if (phase === "work") {
            const newSessions = sessionsCompleted + 1;
            setSessionsCompleted(newSessions);
            completeFocusSession();
            const isLongBreak = newSessions % fs.sessionsBeforeLongBreak === 0;
            setPhase("break");
            return (isLongBreak ? fs.longBreakMin : fs.breakMin) * 60;
          } else {
            setPhase("idle");
            return fs.workMin * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (phase === "idle") {
      setPhase("work");
      setTimeLeft(fs.workMin * 60);
    } else if (phase === "work") {
      setPhase("idle");
      setTimeLeft(fs.workMin * 60);
    } else {
      setPhase("work");
      setTimeLeft(fs.workMin * 60);
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const totalSec = phase === "work" ? fs.workMin * 60 : fs.breakMin * 60;
  const progress = phase !== "idle" ? ((totalSec - timeLeft) / totalSec) : 0;
  const ringColor = phase === "work" ? C.amber : phase === "break" ? C.success : C.textMuted;

  return (
    <View style={ps.card}>
      <View style={ps.header}>
        <MaterialCommunityIcons name="timer" size={20} color={C.amber} />
        <Text style={ps.title}>Deep Work Timer</Text>
        <Text style={ps.sessionCount}>{sessionsCompleted} sessions</Text>
      </View>

      {/* Timer circle */}
      <View style={ps.timerWrap}>
        <View style={[ps.timerCircle, { borderColor: ringColor }]}>
          {/* Progress ring approximation */}
          <View style={[ps.progressRing, {
            borderColor: ringColor,
            borderTopColor: progress > 0.25 ? ringColor : "transparent",
            borderRightColor: progress > 0.5 ? ringColor : "transparent",
            borderBottomColor: progress > 0.75 ? ringColor : "transparent",
            borderLeftColor: progress > 0 ? ringColor : "transparent",
            transform: [{ rotate: `${progress * 360}deg` }],
          }]} />
          <Text style={ps.timerText}>
            {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
          </Text>
          <Text style={[ps.phaseText, { color: ringColor }]}>
            {phase === "work" ? "DEEP WORK" : phase === "break" ? "RECOVERY" : "READY"}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={ps.controls}>
        <TouchableOpacity
          style={ps.resetBtn}
          onPress={() => { setPhase("idle"); setTimeLeft(fs.workMin * 60); setSessionsCompleted(0); }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[ps.playBtn, { borderColor: phase === "work" ? C.danger : C.amber }]}
          onPress={toggleTimer}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name={phase === "work" ? "stop" : "play"}
            size={28}
            color={phase === "work" ? C.danger : C.amber}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={ps.resetBtn}
          onPress={() => {
            setPhase("break");
            setTimeLeft(fs.breakMin * 60);
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="coffee-outline" size={20} color={C.success} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const ps = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text, flex: 1 },
  sessionCount: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.amber },
  timerWrap: { alignItems: "center", marginBottom: 20 },
  timerCircle: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 4, alignItems: "center", justifyContent: "center",
    backgroundColor: C.bgElevated,
  },
  progressRing: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    borderWidth: 4,
  },
  timerText: { fontFamily: "Inter_700Bold", fontSize: 44, color: C.text, letterSpacing: -2 },
  phaseText: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 3, marginTop: 4 },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 24 },
  resetBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.bgElevated, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4: BEDTIME REMINDER
// ════════════════════════════════════════════════════════════════════════════

const TimeAdjuster = memo(({ label, hour, min, hourField, minField, adjustTime }: {
  label: string; hour: number; min: number;
  hourField: "bedHour" | "wakeHour"; minField: "bedMin" | "wakeMin";
  adjustTime: (field: "bedHour" | "bedMin" | "wakeHour" | "wakeMin", delta: number) => void;
}) => (
  <View style={bts.timeBlock}>
    <Text style={bts.timeLabel}>{label}</Text>
    <View style={bts.timeRow}>
      <TouchableOpacity onPress={() => adjustTime(hourField, -1)} style={bts.adjBtn}><Text style={bts.adjText}>−</Text></TouchableOpacity>
      <Text style={bts.timeValue}>{hour.toString().padStart(2, "0")}:{min.toString().padStart(2, "0")}</Text>
      <TouchableOpacity onPress={() => adjustTime(hourField, 1)} style={bts.adjBtn}><Text style={bts.adjText}>+</Text></TouchableOpacity>
    </View>
    <View style={bts.minRow}>
      <TouchableOpacity onPress={() => adjustTime(minField, -5)} style={bts.adjBtnSm}><Text style={bts.adjTextSm}>−5m</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => adjustTime(minField, 5)} style={bts.adjBtnSm}><Text style={bts.adjTextSm}>+5m</Text></TouchableOpacity>
    </View>
  </View>
));

const BedtimeSection = memo(() => {
  const { mindset, updateBedtime, scheduleBedtimeNotification } = useMindset();
  const bt = mindset.bedtime;

  const handleToggle = useCallback((val: boolean) => {
    updateBedtime({ ...bt, enabled: val });
    if (val) {
      scheduleBedtimeNotification(bt.bedHour, bt.bedMin, bt.reminderMinsBefore);
    }
  }, [bt, updateBedtime, scheduleBedtimeNotification]);

  const adjustTime = useCallback((field: "bedHour" | "bedMin" | "wakeHour" | "wakeMin", delta: number) => {
    const current = bt[field];
    const isHour = field.includes("Hour");
    const max = isHour ? 23 : 59;
    const next = ((current + delta) % (max + 1) + (max + 1)) % (max + 1);
    const updated = { ...bt, [field]: next };
    updateBedtime(updated);
    if (bt.enabled) {
      scheduleBedtimeNotification(updated.bedHour, updated.bedMin, updated.reminderMinsBefore);
    }
  }, [bt, updateBedtime, scheduleBedtimeNotification]);

  return (
    <View style={bts.card}>
      <View style={bts.header}>
        <MaterialCommunityIcons name="weather-night" size={20} color={C.amber} />
        <Text style={bts.title}>Bedtime</Text>
        <Switch
          value={bt.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: "rgba(255,255,255,0.08)", true: C.amberBg }}
          thumbColor={bt.enabled ? C.amber : C.textMuted}
        />
      </View>

      {bt.enabled && (
        <View style={bts.timesRow}>
          <TimeAdjuster label="Sleep" hour={bt.bedHour} min={bt.bedMin} hourField="bedHour" minField="bedMin" adjustTime={adjustTime} />
          <View style={bts.divider} />
          <TimeAdjuster label="Wake" hour={bt.wakeHour} min={bt.wakeMin} hourField="wakeHour" minField="wakeMin" adjustTime={adjustTime} />
        </View>
      )}
    </View>
  );
});

const bts = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text, flex: 1 },
  timesRow: { flexDirection: "row", alignItems: "center" },
  divider: { width: 1, height: 60, backgroundColor: C.border, marginHorizontal: 16 },
  timeBlock: { flex: 1, alignItems: "center" },
  timeLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted, marginBottom: 8 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeValue: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text, letterSpacing: -1, minWidth: 80, textAlign: "center" },
  adjBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  adjText: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.amber },
  minRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  adjBtnSm: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: C.bgElevated },
  adjTextSm: { fontFamily: "Inter_500Medium", fontSize: 10, color: C.textMuted },
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 5: DAILY PLANNER
// ════════════════════════════════════════════════════════════════════════════

const PlannerSection = memo(() => {
  const { mindset, setTodayTasks, toggleTask } = useMindset();
  const tasks = mindset.todayTasks;
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");

  const sortedTasks = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return order[a.priority] - order[b.priority];
    });
  }, [tasks]);

  const addTask = () => {
    const label = newTask.trim();
    if (!label) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const task = {
      id: Date.now().toString(),
      label,
      category: "anytime" as const,
      done: false,
      priority: newPriority,
    };
    setTodayTasks([...tasks, task]);
    setNewTask("");
  };

  const removeTask = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTodayTasks(tasks.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={pls.card}>
      <View style={pls.header}>
        <MaterialCommunityIcons name="format-list-checks" size={20} color={C.amber} />
        <Text style={pls.title}>Daily Planner</Text>
        <Text style={pls.progress}>{completedCount}/{totalCount}</Text>
      </View>

      {totalCount > 0 && (
        <View style={pls.progressBar}>
          <View style={[pls.progressFill, { width: `${progressPct}%` as any }]} />
        </View>
      )}

      {/* Add task */}
      <View style={pls.addRow}>
        <TextInput
          style={pls.addInput}
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Add a task…"
          placeholderTextColor={C.textMuted}
          onSubmitEditing={addTask}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addTask} style={pls.addBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={20} color={C.bg} />
        </TouchableOpacity>
      </View>

      {/* Priority selector */}
      <View style={pls.priRow}>
        {(["low", "medium", "high"] as const).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setNewPriority(p)}
            style={[pls.priChip, newPriority === p && pls.priChipActive]}
            activeOpacity={0.8}
          >
            <Text style={[pls.priText, newPriority === p && { color: C.amber }]}>
              {p === "high" ? "High" : p === "medium" ? "Mid" : "Low"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task list */}
      {sortedTasks.map(task => (
        <View key={task.id} style={[pls.taskRow, task.done && { opacity: 0.5 }]}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTask(task.id); }}
            style={[pls.checkbox, task.done && pls.checkboxDone]}
          >
            {task.done && <MaterialCommunityIcons name="check" size={14} color={C.success} />}
          </TouchableOpacity>
          <Text style={[pls.taskLabel, task.done && pls.taskLabelDone]}>{task.label}</Text>
          <View style={[pls.priBadge, {
            backgroundColor: task.priority === "high" ? C.dangerBg : task.priority === "medium" ? C.amberBg : C.successBg
          }]}>
            <View style={[pls.priDot, {
              backgroundColor: task.priority === "high" ? C.danger : task.priority === "medium" ? C.amber : C.success
            }]} />
          </View>
          <TouchableOpacity onPress={() => removeTask(task.id)} style={pls.deleteBtn}>
            <MaterialCommunityIcons name="close" size={14} color={C.textMuted} />
          </TouchableOpacity>
        </View>
      ))}

      {totalCount === 0 && (
        <View style={pls.empty}>
          <Text style={pls.emptyText}>No tasks for today. Add one above.</Text>
        </View>
      )}
    </View>
  );
});

const pls = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text, flex: 1 },
  progress: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.amber },
  progressBar: { height: 4, backgroundColor: C.bgElevated, borderRadius: 2, overflow: "hidden", marginBottom: 14 },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: C.amber },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  addInput: {
    flex: 1, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    borderRadius: R.button, paddingVertical: 10, paddingHorizontal: 14,
    fontFamily: "Inter_400Regular", fontSize: 14, color: C.text,
  },
  addBtn: {
    width: 42, height: 42, borderRadius: R.button,
    backgroundColor: C.amber, alignItems: "center", justifyContent: "center",
  },
  priRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  priChip: { flex: 1, padding: 8, borderRadius: R.button, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  priChipActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  priText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.borderMid,
    alignItems: "center", justifyContent: "center",
  },
  checkboxDone: { backgroundColor: C.successBg, borderColor: C.success },
  taskLabel: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.text, flex: 1 },
  taskLabelDone: { textDecorationLine: "line-through", color: C.textMuted },
  priBadge: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  priDot: { width: 6, height: 6, borderRadius: 3 },
  deleteBtn: { padding: 4 },
  empty: { paddingVertical: 20, alignItems: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default memo(function MindsetScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, letterSpacing: -0.5 }}>
              Mindset
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              Focus, time management, and recovery.
            </Text>
          </View>

          <ScreenTimeSection />
          <PomodoroSection />
          <BedtimeSection />
          <PlannerSection />

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
});
