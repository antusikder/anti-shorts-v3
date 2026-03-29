import React, { useState } from "react";
import {
  View, ScrollView, Text, TouchableOpacity, StyleSheet,
  TextInput, Modal, FlatList, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWorkout, WorkoutSession, WorkoutExercise, ExerciseSet } from "@/context/WorkoutContext";
import { EXERCISES, BUILT_IN_PROGRAMS, Exercise, BuiltInProgram } from "@/constants/exercises";
import { C } from "@/constants/colors";

const CARD_RADIUS = 20;

type Tab = "programs" | "library" | "logger" | "metrics" | "nutrition";

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.tabPill, active && styles.tabPillActive]}>
      <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DifficultyBadge({ level }: { level: Exercise["difficulty"] }) {
  const colors = { beginner: C.green, intermediate: C.amber, advanced: C.danger };
  return (
    <View style={[styles.diffBadge, { backgroundColor: colors[level] + "22" }]}>
      <Text style={[styles.diffText, { color: colors[level] }]}>{level}</Text>
    </View>
  );
}

function ExerciseCard({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.exerciseCard} activeOpacity={0.8}>
      <View style={styles.exerciseTop}>
        <View style={styles.exerciseLeft}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseMuscles}>{exercise.muscles.slice(0, 3).join(", ")}</Text>
        </View>
        <DifficultyBadge level={exercise.difficulty} />
      </View>
      {exercise.sets && (
        <View style={styles.exerciseSets}>
          <Text style={styles.exerciseSetsText}>
            {exercise.sets.sets} × {exercise.sets.reps} · Rest {exercise.sets.rest}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <LinearGradient colors={["#07060F", "#0D0B1E"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={onClose} style={styles.detailClose}>
              <MaterialCommunityIcons name="chevron-down" size={24} color={C.text} />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{exercise.name}</Text>
            <DifficultyBadge level={exercise.difficulty} />
          </View>
          <ScrollView contentContainerStyle={styles.detailScroll}>
            <View style={styles.detailMeta}>
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="dumbbell" size={14} color={C.amber} />
                <Text style={styles.metaText}>{exercise.equipment.join(", ")}</Text>
              </View>
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="arm-flex-outline" size={14} color={C.blue} />
                <Text style={styles.metaText}>{exercise.muscles.join(", ")}</Text>
              </View>
            </View>

            {exercise.sets && (
              <View style={styles.detailSetsCard}>
                <Text style={styles.detailSetsLabel}>Recommended</Text>
                <Text style={styles.detailSetsValue}>
                  {exercise.sets.sets} sets × {exercise.sets.reps} reps · {exercise.sets.rest} rest
                </Text>
              </View>
            )}

            <Text style={styles.detailSection}>How to do it</Text>
            {exercise.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            <Text style={styles.detailSection}>Tips</Text>
            {exercise.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color={C.amber} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

function LibraryTab() {
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const muscles = ["all", "chest", "back", "shoulders", "biceps", "triceps", "abs", "quads", "glutes", "calves", "cardio"];

  const filtered = EXERCISES.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscles.some((m) => m.includes(search.toLowerCase()));
    const matchFilter = filter === "all" || e.muscles.includes(filter as any);
    return matchSearch && matchFilter;
  });

  return (
    <View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search exercises..."
        placeholderTextColor={C.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {muscles.map((m) => (
          <TouchableOpacity key={m} onPress={() => setFilter(m)} style={[styles.filterChip, filter === m && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === m && { color: C.amber }]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.resultCount}>{filtered.length} exercise{filtered.length !== 1 ? "s" : ""}</Text>
      {filtered.map((ex) => (
        <ExerciseCard key={ex.id} exercise={ex} onPress={() => setSelectedExercise(ex)} />
      ))}
      {selectedExercise && (
        <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}
    </View>
  );
}

function ProgramsTab() {
  const [selected, setSelected] = useState<BuiltInProgram | null>(null);

  const diffColors = { beginner: C.green, intermediate: C.amber, advanced: C.danger };

  return (
    <View>
      {selected ? (
        <View>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backRow}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={C.amber} />
            <Text style={styles.backText}>Back to Programs</Text>
          </TouchableOpacity>
          <Text style={styles.programName}>{selected.name}</Text>
          <Text style={styles.programDesc}>{selected.description}</Text>
          <View style={styles.programMeta}>
            <Text style={[styles.programMetaText, { color: diffColors[selected.difficulty] }]}>{selected.difficulty}</Text>
            <Text style={styles.programMetaDot}>·</Text>
            <Text style={styles.programMetaText}>{selected.focus}</Text>
            <Text style={styles.programMetaDot}>·</Text>
            <Text style={styles.programMetaText}>{selected.duration}</Text>
          </View>
          {selected.days.map((day, i) => (
            <View key={i} style={styles.programDay}>
              <Text style={styles.programDayLabel}>{day.label}</Text>
              {day.exercises.map((ex, j) => {
                const exercise = EXERCISES.find((e) => e.id === ex.exerciseId);
                return exercise ? (
                  <View key={j} style={styles.programExRow}>
                    <Text style={styles.programExName}>{exercise.name}</Text>
                    <Text style={styles.programExSets}>{ex.sets}×{ex.reps} · {ex.rest}</Text>
                  </View>
                ) : null;
              })}
            </View>
          ))}
        </View>
      ) : (
        BUILT_IN_PROGRAMS.map((prog) => (
          <TouchableOpacity key={prog.id} onPress={() => setSelected(prog)} style={styles.programCard} activeOpacity={0.8}>
            <LinearGradient colors={["rgba(255,179,0,0.08)", "transparent"]} style={StyleSheet.absoluteFill} />
            <View style={styles.programCardTop}>
              <Text style={styles.programCardName}>{prog.name}</Text>
              <View style={[styles.diffBadge, { backgroundColor: diffColors[prog.difficulty] + "22" }]}>
                <Text style={[styles.diffText, { color: diffColors[prog.difficulty] }]}>{prog.difficulty}</Text>
              </View>
            </View>
            <Text style={styles.programCardDesc} numberOfLines={2}>{prog.description}</Text>
            <View style={styles.programCardMeta}>
              <MaterialCommunityIcons name="target" size={12} color={C.textMuted} />
              <Text style={styles.programCardMetaText}>{prog.focus}</Text>
              <MaterialCommunityIcons name="calendar-range" size={12} color={C.textMuted} />
              <Text style={styles.programCardMetaText}>{prog.duration}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

function MetricsTab() {
  const { workout, addBodyMetric, updateSettings } = useWorkout();
  const s = workout.settings;

  const bmi = s.height > 0 ? (s.weight / ((s.height / 100) ** 2)).toFixed(1) : "—";

  const bmiColor = () => {
    const b = parseFloat(bmi);
    if (b < 18.5) return C.blue;
    if (b < 25) return C.green;
    if (b < 30) return C.amber;
    return C.danger;
  };

  return (
    <View>
      {/* Body Stats */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsCardTitle}>Body Stats</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{s.height} cm</Text>
            <Text style={styles.metricLabel}>Height</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{s.weight} kg</Text>
            <Text style={styles.metricLabel}>Weight</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: bmiColor() }]}>{bmi}</Text>
            <Text style={styles.metricLabel}>BMI</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{s.age}</Text>
            <Text style={styles.metricLabel}>Age</Text>
          </View>
        </View>
      </View>

      {/* Session Stats */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsCardTitle}>Training Stats</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: C.amber }]}>{workout.totalSessionsCompleted}</Text>
            <Text style={styles.metricLabel}>Sessions</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: C.green }]}>{workout.streakDays}</Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Recent Logs */}
      <Text style={[styles.metricsCardTitle, { marginBottom: 8, color: C.textMuted }]}>Recent Sessions</Text>
      {workout.sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="dumbbell" size={36} color={C.textMuted} />
          <Text style={styles.emptyText}>No sessions yet. Start a program!</Text>
        </View>
      ) : (
        workout.sessions.slice(0, 10).map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View>
              <Text style={styles.sessionName}>{session.programName}</Text>
              <Text style={styles.sessionDate}>{session.date} · {session.durationMin} min</Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={20} color={C.green} />
          </View>
        ))
      )}
    </View>
  );
}

function NutritionTab() {
  const { workout, updateSettings } = useWorkout();
  const s = workout.settings;

  // TDEE / macro calculation
  const bmr = s.gender === "male"
    ? 88.36 + 13.4 * s.weight + 4.8 * s.height - 5.7 * s.age
    : 447.6 + 9.25 * s.weight + 3.1 * s.height - 4.33 * s.age;

  const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 };
  const tdee = Math.round(bmr * activityMultipliers[s.activityLevel]);
  const targetCalories = s.goal === "cut" ? tdee - 500 : s.goal === "bulk" ? tdee + 300 : tdee;
  const protein = Math.round(s.weight * 2.2);
  const fat = Math.round(targetCalories * 0.25 / 9);
  const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);

  return (
    <View>
      <View style={styles.nutritionCard}>
        <LinearGradient colors={[C.greenGlow, "transparent"]} style={StyleSheet.absoluteFill} />
        <Text style={styles.nutritionTitle}>Daily Calorie Target</Text>
        <Text style={styles.nutritionCalories}>{targetCalories} kcal</Text>
        <Text style={styles.nutritionSub}>TDEE: {tdee} · Goal: {s.goal.toUpperCase()}</Text>
      </View>

      <View style={styles.macroGrid}>
        <View style={[styles.macroCard, { borderColor: C.danger + "44" }]}>
          <Text style={[styles.macroValue, { color: C.danger }]}>{protein}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroKcal}>{protein * 4} kcal</Text>
        </View>
        <View style={[styles.macroCard, { borderColor: C.amber + "44" }]}>
          <Text style={[styles.macroValue, { color: C.amber }]}>{carbs}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroKcal}>{carbs * 4} kcal</Text>
        </View>
        <View style={[styles.macroCard, { borderColor: C.blue + "44" }]}>
          <Text style={[styles.macroValue, { color: C.blue }]}>{fat}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroKcal}>{fat * 9} kcal</Text>
        </View>
      </View>

      {/* Goal Selection */}
      <Text style={styles.nutritionSectionTitle}>Your Goal</Text>
      <View style={styles.goalRow}>
        {(["cut", "maintain", "bulk"] as const).map((goal) => (
          <TouchableOpacity key={goal} onPress={() => updateSettings({ goal })} style={[styles.goalBtn, s.goal === goal && styles.goalBtnActive]}>
            <Text style={[styles.goalBtnText, s.goal === goal && { color: C.amber }]}>
              {goal === "cut" ? "🎯 Cut" : goal === "maintain" ? "⚖️ Maintain" : "💪 Bulk"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.nutritionNote}>
        Protein target is 2.2g/kg bodyweight. Update your weight and activity in Settings to recalculate.
      </Text>
    </View>
  );
}

export default function WorkoutScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("programs");

  const tabs: { id: Tab; label: string }[] = [
    { id: "programs", label: "Programs" },
    { id: "library", label: "Library" },
    { id: "metrics", label: "Metrics" },
    { id: "nutrition", label: "Nutrition" },
  ];

  return (
    <LinearGradient colors={["#07060F", "#0D0B1E", "#07060F"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="arm-flex" size={22} color={C.green} />
          <Text style={styles.headerTitle}>Workout</Text>
        </View>

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {tabs.map((t) => (
            <TabPill key={t.id} label={t.label} active={activeTab === t.id} onPress={() => setActiveTab(t.id)} />
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.scroll}>
          {activeTab === "programs" && <ProgramsTab />}
          {activeTab === "library" && <LibraryTab />}
          {activeTab === "metrics" && <MetricsTab />}
          {activeTab === "nutrition" && <NutritionTab />}
          <View style={{ height: 90 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, letterSpacing: -0.5 },
  tabBar: { paddingVertical: 8 },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  tabPillActive: { backgroundColor: C.amber + "22", borderColor: C.amber + "55" },
  tabPillText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted },
  tabPillTextActive: { color: C.amber, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 16 },

  exerciseCard: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 10, overflow: "hidden" },
  exerciseTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 },
  exerciseLeft: { flex: 1, marginRight: 8 },
  exerciseName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, marginBottom: 2 },
  exerciseMuscles: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
  exerciseSets: { backgroundColor: C.amberGlow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  exerciseSetsText: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.amber },

  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "capitalize" },

  searchInput: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: C.text, marginVertical: 8 },
  filterScroll: { marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, marginRight: 6 },
  filterChipActive: { backgroundColor: C.amber + "22", borderColor: C.amber + "44" },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSub, textTransform: "capitalize" },
  resultCount: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textMuted, marginBottom: 8 },

  // Detail Modal
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  detailClose: { padding: 4 },
  detailTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 18, color: C.text },
  detailScroll: { paddingHorizontal: 16 },
  detailMeta: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.bgCard, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.border },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSub, textTransform: "capitalize" },
  detailSetsCard: { backgroundColor: C.amberGlow, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.amber + "33" },
  detailSetsLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.amber, marginBottom: 4 },
  detailSetsValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text },
  detailSection: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 8 },
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 10, alignItems: "flex-start" },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.amber + "22", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.amber },
  stepText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSub, flex: 1, lineHeight: 22 },
  tipRow: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, flex: 1, lineHeight: 20 },

  // Programs
  programCard: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: CARD_RADIUS, padding: 16, marginBottom: 12, overflow: "hidden" },
  programCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  programCardName: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text, flex: 1, marginRight: 8 },
  programCardDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 10 },
  programCardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  programCardMetaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.amber },
  programName: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, marginBottom: 8 },
  programDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSub, lineHeight: 22, marginBottom: 12 },
  programMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  programMetaText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted },
  programMetaDot: { color: C.textMuted },
  programDay: { backgroundColor: C.bgCard, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  programDayLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.amber, marginBottom: 10 },
  programExRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  programExName: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.text, flex: 1 },
  programExSets: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },

  // Metrics
  metricsCard: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: CARD_RADIUS, padding: 16, marginBottom: 12, overflow: "hidden" },
  metricsCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, marginBottom: 12 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricItem: { flex: 1, minWidth: "45%", backgroundColor: C.bgElevated, borderRadius: 12, padding: 12, alignItems: "center" },
  metricValue: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.text },
  metricLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, marginTop: 4 },
  sessionCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.bgCard, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  sessionName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  sessionDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textMuted },

  // Nutrition
  nutritionCard: { borderRadius: CARD_RADIUS, padding: 20, marginBottom: 12, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.green + "33", alignItems: "center", overflow: "hidden" },
  nutritionTitle: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted, marginBottom: 6 },
  nutritionCalories: { fontFamily: "Inter_700Bold", fontSize: 48, color: C.green, letterSpacing: -2 },
  nutritionSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginTop: 4 },
  macroGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  macroCard: { flex: 1, backgroundColor: C.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center" },
  macroValue: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.5 },
  macroLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textMuted, marginTop: 4 },
  macroKcal: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textMuted, marginTop: 2 },
  nutritionSectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  goalRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  goalBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  goalBtnActive: { backgroundColor: C.amber + "18", borderColor: C.amber + "55" },
  goalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted },
  nutritionNote: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, lineHeight: 18 },
});
