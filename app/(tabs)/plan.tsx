import React, { memo, useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Vibration, Animated
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C, R, S } from "@/constants/colors";

const TASKS_KEY = "@freshmind:tasks_v1";

interface Task {
  id: string;
  title: string;
  durationMin: number;
  completed: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// NEW TASK INPUT
// ════════════════════════════════════════════════════════════════════════════

const NewTaskInput = memo(({ onAdd }: { onAdd: (t: string, m: number) => void }) => {
  const [title, setTitle] = useState("");
  const [mins, setMins] = useState("30");

  const handleAdd = () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd(title.trim(), parseInt(mins) || 30);
    setTitle("");
  };

  return (
    <View style={nti.card}>
      <Text style={nti.label}>Add to today's plan</Text>
      <View style={nti.row}>
        <TextInput
          style={nti.titleInput}
          placeholder="E.g., Read documentation"
          placeholderTextColor={C.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <View style={nti.minBox}>
          <TextInput
            style={nti.minInput}
            value={mins}
            onChangeText={setMins}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Text style={nti.minLabel}>min</Text>
        </View>
        <TouchableOpacity style={nti.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={24} color={C.bg} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const nti = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 20 },
  label: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textSub, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  titleInput: { flex: 1, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, borderRadius: R.input, paddingVertical: 12, paddingHorizontal: 16, fontFamily: "Nunito_600SemiBold", fontSize: 15, color: C.text },
  minBox: { flexDirection: "row", alignItems: "center", backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, borderRadius: R.input, paddingHorizontal: 12, height: 48 },
  minInput: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text, width: 34, textAlign: "center" },
  minLabel: { fontFamily: "Nunito_500Medium", fontSize: 13, color: C.textMuted },
  addBtn: { width: 48, height: 48, borderRadius: R.input, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
});

// ════════════════════════════════════════════════════════════════════════════
// RUNNING TIMER CARD
// ════════════════════════════════════════════════════════════════════════════

const ActiveTimer = memo(({ task, onComplete, onCancel }: { task: Task; onComplete: (id: string) => void; onCancel: () => void }) => {
  const [remainingSec, setRemainingSec] = useState(task.durationMin * 60);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainingSec(p => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          Vibration.vibrate([0, 300, 100, 300, 100, 500]);
          Notifications.scheduleNotificationAsync({
            content: { title: "Task Complete!", body: `You finished: ${task.title}` },
            trigger: null,
          }).catch(() => {});
          onComplete(task.id);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const pct = Math.round((1 - remainingSec / (task.durationMin * 60)) * 100);

  return (
    <View style={at.card}>
      <View style={at.header}>
        <View style={at.iconBox}><MaterialCommunityIcons name="timer-sand" size={20} color={C.accent} /></View>
        <Text style={at.title} numberOfLines={1}>{task.title}</Text>
      </View>
      
      <View style={at.timeRow}>
        <Text style={at.timer}>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</Text>
        <Text style={at.pct}>{pct}%</Text>
      </View>

      <View style={at.actions}>
        <TouchableOpacity style={at.btnCancel} onPress={onCancel} activeOpacity={0.8}>
          <Text style={at.btnTextCancel}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={at.btnDone} onPress={() => onComplete(task.id)} activeOpacity={0.8}>
          <Text style={at.btnTextDone}>Mark Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const at = StyleSheet.create({
  card: { backgroundColor: C.accentBg, borderRadius: R.card, borderWidth: 1, borderColor: C.accentBorder, padding: 20, marginBottom: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bgCard, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: C.text, flex: 1 },
  timeRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 12, marginBottom: 20 },
  timer: { fontFamily: "Nunito_800ExtraBold", fontSize: 64, color: C.accent, letterSpacing: -3 },
  pct: { fontFamily: "Nunito_600SemiBold", fontSize: 16, color: C.textMuted },
  actions: { flexDirection: "row", gap: 12 },
  btnCancel: { flex: 1, paddingVertical: 14, borderRadius: R.button, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderMid, alignItems: "center" },
  btnTextCancel: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text },
  btnDone: { flex: 1, paddingVertical: 14, borderRadius: R.button, backgroundColor: C.accent, alignItems: "center" },
  btnTextDone: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.bg },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function PlanScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(TASKS_KEY).then(res => {
      if (res) {
        const parsed = JSON.parse(res);
        // Only keep today's tasks
        if (parsed.date === new Date().toDateString()) setTasks(parsed.items || []);
      }
    }).catch(() => {});
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    AsyncStorage.setItem(TASKS_KEY, JSON.stringify({
      date: new Date().toDateString(), items: newTasks
    })).catch(() => {});
  };

  const handleAdd = (title: string, durationMin: number) => {
    const newTask = { id: Date.now().toString(), title, durationMin, completed: false };
    saveTasks([...tasks, newTask]);
  };

  const handleCompleteActive = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveTasks(tasks.map(t => t.id === id ? { ...t, completed: true } : t));
    setActiveTaskId(null);
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveTasks(tasks.filter(t => t.id !== id));
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);
  const pending = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: S.pagePad, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          <View style={{ paddingTop: 8, marginBottom: 20 }}>
            <Text style={pr.heading}>Plan</Text>
            <Text style={pr.subheading}>Daily tasks & time boxing</Text>
          </View>

          {activeTask ? (
            <ActiveTimer
              task={activeTask}
              onComplete={handleCompleteActive}
              onCancel={() => setActiveTaskId(null)}
            />
          ) : (
            <NewTaskInput onAdd={handleAdd} />
          )}

          {/* Pending Tasks */}
          {pending.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={pr.sectionLabel}>Pending Tasks</Text>
              {pending.map(t => {
                if (t.id === activeTaskId) return null;
                return (
                  <View key={t.id} style={tc.card}>
                    <View style={{ flex: 1 }}>
                      <Text style={tc.title}>{t.title}</Text>
                      <Text style={tc.duration}>{t.durationMin} min</Text>
                    </View>
                    <View style={tc.actions}>
                      <TouchableOpacity onPress={() => handleDelete(t.id)} style={tc.iconBtn}>
                        <MaterialCommunityIcons name="delete-outline" size={20} color={C.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setActiveTaskId(t.id); }}
                        style={tc.playBtn}
                      >
                        <MaterialCommunityIcons name="play" size={20} color={C.bg} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Completed Tasks */}
          {done.length > 0 && (
            <View>
              <Text style={pr.sectionLabel}>Completed Today</Text>
              {done.map(t => (
                <View key={t.id} style={[tc.card, { opacity: 0.6 }]}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={C.success} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[tc.title, { color: C.textMuted, textDecorationLine: "line-through" }]}>{t.title}</Text>
                  </View>
                  <Text style={tc.duration}>{t.durationMin} min</Text>
                </View>
              ))}
            </View>
          )}

          {tasks.length === 0 && (
            <View style={pr.emptyState}>
              <MaterialCommunityIcons name="calendar-check" size={48} color={C.borderStrong} />
              <Text style={pr.emptyTitle}>No tasks for today</Text>
              <Text style={pr.emptySub}>Add a task above to start time boxing.</Text>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const pr = StyleSheet.create({
  heading: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, color: C.text, letterSpacing: -0.5 },
  subheading: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, marginTop: 4 },
  sectionLabel: { fontFamily: "Nunito_700Bold", fontSize: 12, color: C.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyTitle: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.textMuted, marginTop: 16 },
  emptySub: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSub, marginTop: 4 },
});

const tc = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: C.bgCard, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 8 },
  title: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text, marginBottom: 2 },
  duration: { fontFamily: "Nunito_500Medium", fontSize: 12, color: C.textMuted },
  actions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: { padding: 8 },
  playBtn: { width: 36, height: 36, borderRadius: R.circle, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
});
