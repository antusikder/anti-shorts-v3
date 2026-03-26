import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { usePlanner, PlannerTask } from "@/context/PlannerContext";
import { useSettings } from "@/context/SettingsContext";

const C = Colors.dark;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function CircularProgress({ progress, size = 120, color = C.tint, children }: {
  progress: number; size?: number; color?: string; children?: React.ReactNode;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  // Animate stroke
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: C.border }} />
      </View>
      <View style={{ position: "absolute", width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 4,
            borderColor: color,
            borderTopColor: "transparent",
            borderRightColor: progress > 0.5 ? color : "transparent",
            transform: [{ rotate: `${progress * 360 - 90}deg` }],
          }}
        />
      </View>
      {children && (
        <View style={{ alignItems: "center" }}>{children}</View>
      )}
    </View>
  );
}

function TaskCard({
  task,
  isActive,
  onStart,
  onComplete,
  onDelete,
}: {
  task: PlannerTask;
  isActive: boolean;
  onStart: () => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={[
        tc.card,
        task.completed && tc.completed,
        isActive && tc.active,
      ]}
    >
      <TouchableOpacity
        style={[tc.checkbox, task.completed && tc.checkboxDone]}
        onPress={onComplete}
        activeOpacity={0.7}
      >
        {task.completed && <Feather name="check" size={12} color="#fff" />}
      </TouchableOpacity>

      <View style={tc.content}>
        <Text style={[tc.title, task.completed && tc.titleDone]}>{task.title}</Text>
        <View style={tc.meta}>
          <View style={tc.pill}>
            <Feather name="clock" size={10} color={C.tint} />
            <Text style={tc.pillText}>{task.durationMin}m</Text>
          </View>
          {task.breakMin > 0 && (
            <View style={[tc.pill, { backgroundColor: C.breakColor + "22" }]}>
              <Feather name="coffee" size={10} color={C.breakColor} />
              <Text style={[tc.pillText, { color: C.breakColor }]}>{task.breakMin}m break</Text>
            </View>
          )}
        </View>
      </View>

      {!task.completed && (
        <TouchableOpacity style={tc.startBtn} onPress={onStart} activeOpacity={0.8}>
          {isActive
            ? <MaterialCommunityIcons name="timer-outline" size={18} color={C.tint} />
            : <Feather name="play" size={16} color={C.tint} />}
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onDelete} style={tc.deleteBtn} activeOpacity={0.7}>
        <Feather name="trash-2" size={14} color={C.danger} />
      </TouchableOpacity>
    </View>
  );
}

function AddTaskModal({
  visible,
  onDismiss,
  onAdd,
}: {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (task: { title: string; durationMin: number; breakMin: number }) => void;
}) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(25);
  const [brk, setBrk] = useState(5);

  const handle = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), durationMin: duration, breakMin: brk });
    setTitle("");
    setDuration(25);
    setBrk(5);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <Text style={modal.title}>Add Task</Text>

          <TextInput
            style={modal.input}
            placeholder="Task title (e.g. Read for 30 mins)"
            placeholderTextColor={C.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <View style={modal.row}>
            <Text style={modal.rowLabel}>Duration</Text>
            <View style={modal.stepper}>
              <TouchableOpacity onPress={() => setDuration(Math.max(5, duration - 5))} style={modal.stepBtn}>
                <Feather name="minus" size={16} color={C.text} />
              </TouchableOpacity>
              <Text style={modal.stepVal}>{duration}m</Text>
              <TouchableOpacity onPress={() => setDuration(Math.min(180, duration + 5))} style={modal.stepBtn}>
                <Feather name="plus" size={16} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={modal.row}>
            <Text style={modal.rowLabel}>Break after</Text>
            <View style={modal.stepper}>
              <TouchableOpacity onPress={() => setBrk(Math.max(0, brk - 5))} style={modal.stepBtn}>
                <Feather name="minus" size={16} color={C.text} />
              </TouchableOpacity>
              <Text style={modal.stepVal}>{brk === 0 ? "None" : `${brk}m`}</Text>
              <TouchableOpacity onPress={() => setBrk(Math.min(60, brk + 5))} style={modal.stepBtn}>
                <Feather name="plus" size={16} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={modal.btnRow}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onDismiss} activeOpacity={0.8}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modal.addBtn} onPress={handle} activeOpacity={0.8}>
              <Text style={modal.addText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, strictMode, activeSession, addTask, removeTask, toggleCompleted, setStrictMode, startSession, endSession } = usePlanner();
  const { settings, setBlockActive } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? completedCount / tasks.length : 0;

  useEffect(() => {
    if (activeSession.phase !== "idle") {
      const remaining = Math.max(0, Math.floor((activeSession.endsAt - Date.now()) / 1000));
      setTimerSeconds(remaining);
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            endSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession.phase]);

  // Sync strict mode with block active
  useEffect(() => {
    setBlockActive(strictMode && activeSession.phase !== "idle");
  }, [strictMode, activeSession.phase]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <LinearGradient colors={[C.background, "#0A1020", C.background]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 60 : insets.top) + 16, paddingBottom: insets.bottom + 110 }}
      >
        {/* Header */}
        <View style={ps.header}>
          <Text style={ps.date}>{today}</Text>
          <Text style={ps.title}>Daily Planner</Text>
        </View>

        {/* Progress Ring */}
        {tasks.length > 0 && (
          <View style={ps.ringWrap}>
            <CircularProgress progress={progress} size={130} color={C.plannerAccent}>
              <Text style={ps.ringNum}>{completedCount}/{tasks.length}</Text>
              <Text style={ps.ringLabel}>done</Text>
            </CircularProgress>
          </View>
        )}

        {/* Active Timer */}
        {activeSession.phase !== "idle" && (
          <View style={[ps.timerCard, { backgroundColor: C.backgroundCard }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <MaterialCommunityIcons name="timer-outline" size={18} color={C.plannerAccent} />
              <Text style={ps.timerLabel}>
                {activeSession.phase === "task" ? "Focus Time" : "Break Time"}
              </Text>
            </View>
            <Text style={ps.timerValue}>{formatTime(timerSeconds)}</Text>
            <TouchableOpacity style={ps.stopBtn} onPress={endSession} activeOpacity={0.8}>
              <Feather name="square" size={14} color={C.danger} />
              <Text style={[ps.stopText, { color: C.danger }]}>Stop Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Strict Mode */}
        <View style={[ps.strictCard, { backgroundColor: strictMode ? C.strictColor + "22" : C.backgroundCard }]}>
          <View style={{ flex: 1 }}>
            <Text style={ps.strictTitle}>🔒 Strict Mode</Text>
            <Text style={ps.strictDesc}>Blocks distracting apps during active sessions</Text>
          </View>
          <TouchableOpacity
            style={[ps.strictToggle, { backgroundColor: strictMode ? C.strictColor : C.backgroundElevated }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setStrictMode(!strictMode);
            }}
            activeOpacity={0.8}
          >
            <Text style={ps.strictToggleText}>{strictMode ? "ON" : "OFF"}</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <View style={ps.listHeader}>
          <Text style={ps.listTitle}>Tasks</Text>
          <TouchableOpacity
            style={ps.addBtn}
            onPress={() => { Haptics.selectionAsync(); setShowAdd(true); }}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={ps.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {tasks.length === 0 && (
          <View style={ps.empty}>
            <MaterialCommunityIcons name="calendar-plus" size={48} color={C.textMuted} />
            <Text style={ps.emptyText}>No tasks yet</Text>
            <Text style={ps.emptyDesc}>Tap "Add" to plan your day</Text>
          </View>
        )}

        <View style={ps.list}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isActive={activeSession.phase !== "idle" && activeSession.taskId === task.id}
              onStart={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                startSession(task.id);
              }}
              onComplete={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toggleCompleted(task.id);
              }}
              onDelete={() => {
                Alert.alert("Delete Task", "Remove this task?", [
                  { text: "Cancel" },
                  { text: "Delete", style: "destructive", onPress: () => removeTask(task.id) },
                ]);
              }}
            />
          ))}
        </View>
      </ScrollView>

      <AddTaskModal
        visible={showAdd}
        onDismiss={() => setShowAdd(false)}
        onAdd={addTask}
      />
    </LinearGradient>
  );
}

const tc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.backgroundCard,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  active: { borderColor: C.plannerAccent },
  completed: { opacity: 0.55 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: C.green, borderColor: C.green },
  content: { flex: 1 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  titleDone: { textDecorationLine: "line-through", color: C.textMuted },
  meta: { flexDirection: "row", gap: 6, marginTop: 4 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.tint + "22", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  pillText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: C.tint },
  startBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.tint + "22", alignItems: "center", justifyContent: "center" },
  deleteBtn: { padding: 4 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: C.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  input: { backgroundColor: C.backgroundElevated, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.textSecondary },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center" },
  stepVal: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text, minWidth: 50, textAlign: "center" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: C.backgroundElevated, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  addBtn: { flex: 1, backgroundColor: C.tint, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  addText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

const ps = StyleSheet.create({
  header: { paddingHorizontal: 20, marginBottom: 16 },
  date: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginBottom: 4 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text },
  ringWrap: { alignItems: "center", marginBottom: 20 },
  ringNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.plannerAccent, textAlign: "center" },
  ringLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },
  timerCard: { marginHorizontal: 16, borderRadius: 18, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: C.plannerAccent, alignItems: "center" },
  timerLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.plannerAccent },
  timerValue: { fontSize: 48, fontFamily: "Inter_700Bold", color: C.text, marginVertical: 4 },
  stopBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  stopText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  strictCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  strictTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text },
  strictDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  strictToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  strictToggleText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 },
  listTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.tint, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  empty: { alignItems: "center", padding: 40, gap: 8 },
  emptyText: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  list: { paddingHorizontal: 16, gap: 10 },
});
