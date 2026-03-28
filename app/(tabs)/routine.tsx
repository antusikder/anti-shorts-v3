import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/context/SettingsContext";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Components ──────────────────────────────────────────────────────────────

function Card({ children, style, C }: { children: React.ReactNode; style?: any; C: any }) {
  return (
    <View style={[styles.card, { backgroundColor: C.backgroundCard, borderColor: C.border }, style]}>
      {children}
    </View>
  );
}

function SectionHeader({ title, icon, subtitle, C }: { title: string; icon: string; subtitle?: string; C: any }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={C.amber} />
        <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
      </View>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateBedtime } = useSettings();
  const C = Colors.dark;

  // Planner State (Simplified)
  const [tasks, setTasks] = useState([
    { id: 1, text: "Morning meditation", completed: false },
    { id: 2, text: "Elite Workout session", completed: true },
    { id: 3, text: "No social media until 5 PM", completed: false },
  ]);

  const toggleTask = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTasks(t => t.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  return (
    <LinearGradient colors={["#0D0B1E", "#121225"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
           <Text style={styles.headerTitle}>Elite Routine</Text>
           <Text style={styles.headerSubtitle}>Master your day with discipline</Text>
        </View>

        {/* ── Daily Planner ── */}
        <Card C={C}>
          <SectionHeader title="Daily Intentions" icon="calendar-check" subtitle="Stay focused on what matters" C={C} />
          <View style={{ gap: 10 }}>
            {tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                onPress={() => toggleTask(task.id)}
                style={[styles.taskRow, { borderColor: task.completed ? C.amber + '40' : C.border }]}
              >
                <MaterialCommunityIcons 
                  name={task.completed ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                  size={24} 
                  color={task.completed ? C.amber : C.textMuted} 
                />
                <Text style={[styles.taskText, { color: task.completed ? C.textMuted : C.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
                  {task.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={{ height: 16 }} />

        {/* ── Deep Sleep ── */}
        <Card C={C}>
          <SectionHeader title="Deep Sleep Cycle" icon="weather-night" subtitle="Optimize recovery and focus" C={C} />
          <View style={styles.row}>
             <View>
                <Text style={styles.itemTitle}>Bedtime Mode</Text>
                <Text style={styles.itemDesc}>Block all social apps at night</Text>
             </View>
             <Switch 
               value={settings.bedtime.enabled} 
               onValueChange={(v) => updateBedtime({ ...settings.bedtime, enabled: v })}
               trackColor={{ false: "#333", true: C.amber + "88" }}
               thumbColor={settings.bedtime.enabled ? C.amber : "#f4f3f4"}
             />
          </View>
          
          <View style={styles.timeGrid}>
             <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Bedtime</Text>
                <Text style={styles.timeValue}>{settings.bedtime.startHour}:{settings.bedtime.startMin === 0 ? "00" : settings.bedtime.startMin}</Text>
             </View>
             <MaterialCommunityIcons name="arrow-right" size={20} color={C.textMuted} style={{ marginTop: 20 }} />
             <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Wake up</Text>
                <Text style={styles.timeValue}>{settings.bedtime.endHour}:{settings.bedtime.endMin === 0 ? "00" : settings.bedtime.endMin}</Text>
             </View>
          </View>
        </Card>

        <View style={{ height: 16 }} />

        {/* ── Elite Schedule ── */}
        <Card C={C}>
          <SectionHeader title="Discipline Schedule" icon="clock-outline" subtitle="Strict time blocking for high performance" C={C} />
          <View style={{ gap: 12 }}>
             <ScheduleItem time="06:00" label="Wake up & Hydrate" icon="water" color="#4A90E2" C={C} />
             <ScheduleItem time="08:00" label="Deep Work Session" icon="laptop" color="#FFB000" C={C} />
             <ScheduleItem time="12:00" label="High Protein Lunch" icon="food" color="#7ED321" C={C} />
             <ScheduleItem time="17:00" label="Elite Workout" icon="arm-flex" color="#D0021B" C={C} />
          </View>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

function ScheduleItem({ time, label, icon, color, C }: { time: string; label: string; icon: string; color: string; C: any }) {
  return (
    <View style={styles.scheduleRow}>
       <Text style={styles.timeText}>{time}</Text>
       <View style={[styles.dot, { backgroundColor: color }]} />
       <View style={[styles.scheduleContent, { backgroundColor: C.backgroundSecondary }]}>
          <MaterialCommunityIcons name={icon as any} size={18} color={color} />
          <Text style={styles.scheduleLabel}>{label}</Text>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 4 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 2 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.03)" },
  taskText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  itemDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 2 },
  timeGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, alignItems: "center" },
  timeBox: { alignItems: "center", flex: 1 },
  timeLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#A0A0B0", textTransform: "uppercase" },
  timeValue: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginTop: 4 },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#A0A0B0", width: 45 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  scheduleContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14 },
  scheduleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
