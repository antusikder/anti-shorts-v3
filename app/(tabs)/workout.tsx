import React, { memo, useCallback, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Modal, Dimensions, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useWorkout } from "@/context/WorkoutContext";
import { EXERCISES, Exercise, ExerciseCategory, ExerciseMuscle } from "@/constants/exercises";
import { C, R } from "@/constants/colors";

const { width: SW } = Dimensions.get("window");

// ════════════════════════════════════════════════════════════════════════════
// TYPES & DATA
// ════════════════════════════════════════════════════════════════════════════

type WorkoutTab = "library" | "calculators";

interface ActivityType {
  id: string;
  name: string;
  icon: string;
  muscleFilter: string[];
  description: string;
  benefits: string[];
  color: string;
  metValue: number; // for calorie calculation
}

const ACTIVITY_TYPES: ActivityType[] = [
  {
    id: "freehand", name: "Freehand", icon: "human-handsup",
    muscleFilter: ["chest", "back", "shoulders", "arms", "legs", "core"],
    description: "Bodyweight exercises. No equipment needed.",
    benefits: ["Zero equipment cost", "Train anywhere", "Functional strength", "Better flexibility"],
    color: C.amber, metValue: 4.0,
  },
  {
    id: "gym", name: "Gym", icon: "dumbbell",
    muscleFilter: ["chest", "back", "shoulders", "arms", "legs", "core"],
    description: "Resistance training with barbells, dumbbells, and machines.",
    benefits: ["Maximum muscle growth", "Progressive overload", "Strength gains", "Hormonal boost"],
    color: C.amber, metValue: 6.0,
  },
  {
    id: "walk", name: "Walk / Run", icon: "walk",
    muscleFilter: ["legs", "core"],
    description: "Low to high intensity cardiovascular exercise.",
    benefits: ["Heart health", "Burns fat", "Clears the mind", "Improves sleep"],
    color: C.amber, metValue: 3.8,
  },
  {
    id: "swimming", name: "Swimming", icon: "swim",
    muscleFilter: ["chest", "back", "shoulders", "legs", "core"],
    description: "Full-body aquatic workout with minimal joint impact.",
    benefits: ["Full body workout", "Zero impact on joints", "Burns ~500 cal/hr", "Improves lung capacity"],
    color: C.amber, metValue: 7.0,
  },
  {
    id: "cycling", name: "Cycling", icon: "bike",
    muscleFilter: ["legs", "core"],
    description: "Endurance cardio focusing on lower body and core.",
    benefits: ["Builds leg power", "Low joint stress", "Eco-friendly transport", "Endurance builder"],
    color: C.amber, metValue: 5.5,
  },
  {
    id: "outdoor", name: "Outdoor", icon: "pine-tree",
    muscleFilter: ["chest", "back", "shoulders", "arms", "legs", "core"],
    description: "HIIT, calisthenics, running, park workouts.",
    benefits: ["Fresh air & sunlight", "Vitamin D boost", "Mental clarity", "Nature immersion"],
    color: C.amber, metValue: 5.0,
  },
];

const MUSCLE_ICONS: Record<string, string> = {
  chest: "human-handsdown", back: "human-handsup", shoulders: "arm-flex-outline", arms: "arm-flex",
  biceps: "arm-flex", triceps: "arm-flex", legs: "human-child", quadriceps: "human-child",
  hamstrings: "human-child", glutes: "human-child", calves: "human-child", core: "human",
  abs: "human", obliques: "human", forearms: "arm-flex", traps: "human-handsdown",
  lats: "human-handsup", deltoids: "arm-flex-outline",
};

// ════════════════════════════════════════════════════════════════════════════
// EXERCISE DETAIL MODAL
// ════════════════════════════════════════════════════════════════════════════

const ExerciseModal = memo(({ exercise, visible, onClose }: {
  exercise: Exercise | null; visible: boolean; onClose: () => void;
}) => {
  if (!exercise) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={em.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={em.header}>
              <TouchableOpacity onPress={onClose} style={em.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={C.text} />
              </TouchableOpacity>
              <View style={em.badge}>
                <Text style={em.badgeText}>{exercise.difficulty.toUpperCase()}</Text>
              </View>
            </View>

            {/* Hero Graphic Image */}
            <View style={em.heroGraphic}>
               <Image 
                 source={{ uri: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop" }} 
                 style={em.heroImg} 
                 resizeMode="cover" 
               />
               <View style={em.heroOverlay} />
            </View>

            <Text style={em.title}>{exercise.name}</Text>
            <Text style={em.category}>{exercise.category.toUpperCase()}</Text>

            {/* Muscles targeted */}
            <View style={em.section}>
              <Text style={em.sectionTitle}>Muscles Targeted</Text>
              <View style={em.muscleGrid}>
                {exercise.muscles.map((m, i) => (
                  <View key={i} style={em.muscleChip}>
                    <MaterialCommunityIcons name={(MUSCLE_ICONS[m] || "arm-flex") as any} size={14} color={C.textMuted} />
                    <Text style={em.muscleName}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Benefits */}
            {exercise.benefits && exercise.benefits.length > 0 && (
              <View style={em.section}>
                <Text style={em.sectionTitle}>Benefits</Text>
                {exercise.benefits.map((b, i) => (
                  <View key={i} style={em.benefitRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={C.success} />
                    <Text style={em.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* How to do it */}
            <View style={em.section}>
              <Text style={em.sectionTitle}>How To Do It</Text>
              {exercise.steps.map((step, i) => (
                <View key={i} style={em.stepRow}>
                  <View style={em.stepNum}>
                    <Text style={em.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={em.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Pro tips */}
            {exercise.tips.length > 0 && (
              <View style={em.section}>
                <Text style={em.sectionTitle}>Pro Tips</Text>
                {exercise.tips.map((tip, i) => (
                  <View key={i} style={em.tipRow}>
                    <MaterialCommunityIcons name="lightbulb-on" size={14} color={C.amber} />
                    <Text style={em.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommended sets */}
            {exercise.sets && (
              <View style={em.section}>
                <Text style={em.sectionTitle}>Recommended Programming</Text>
                <View style={em.setsGrid}>
                  <View style={em.setCard}>
                    <Text style={em.setNum}>{exercise.sets.sets}</Text>
                    <Text style={em.setLabel}>Sets</Text>
                  </View>
                  <View style={em.setCard}>
                    <Text style={em.setNum}>{exercise.sets.reps}</Text>
                    <Text style={em.setLabel}>Reps</Text>
                  </View>
                  <View style={em.setCard}>
                    <Text style={em.setNum}>{exercise.sets.rest}</Text>
                    <Text style={em.setLabel}>Rest</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Equipment */}
            <View style={em.section}>
              <Text style={em.sectionTitle}>Equipment</Text>
              <View style={em.muscleGrid}>
                {exercise.equipment.map((e, i) => (
                  <View key={i} style={em.eqChip}>
                    <Text style={em.eqText}>{e}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

const em = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: R.circle, backgroundColor: C.amberBg, borderWidth: 1, borderColor: C.amberBorder },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: C.amber, letterSpacing: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, color: C.text, letterSpacing: -0.5, marginBottom: 4 },
  category: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textMuted, letterSpacing: 1.5, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textSub, marginBottom: 12 },
  muscleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  muscleChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: R.circle, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  heroGraphic: { height: 200, borderRadius: R.card, overflow: 'hidden', marginBottom: 20 },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,8,16,0.3)' },
  muscleName: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSub, textTransform: "capitalize" },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  benefitText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.text },
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.amberBg, borderWidth: 1, borderColor: C.amberBorder, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.amber },
  stepText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.text, flex: 1, lineHeight: 22 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, flex: 1, lineHeight: 20 },
  setsGrid: { flexDirection: "row", gap: 10 },
  setCard: { flex: 1, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16, alignItems: "center" },
  setNum: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.amber, marginBottom: 4 },
  setLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textMuted },
  eqChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: R.circle, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border },
  eqText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSub, textTransform: "capitalize" },
});

// ════════════════════════════════════════════════════════════════════════════
// EXERCISE LIBRARY
// ════════════════════════════════════════════════════════════════════════════

const LibraryTab = memo(() => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<ExerciseMuscle | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const filteredExercises = useMemo(() => {
    let result = EXERCISES;
    if (selectedActivity) {
      const act = ACTIVITY_TYPES.find(a => a.id === selectedActivity);
      if (act) {
        if (selectedActivity === "freehand") {
          result = result.filter(e => e.equipment.includes("none") || e.category === "bodyweight" || e.category === "calisthenics");
        } else if (selectedActivity === "gym") {
          result = result.filter(e => e.equipment.some(eq => ["barbell", "dumbbell", "machine", "cable", "kettlebell"].includes(eq)));
        } else if (selectedActivity === "walk" || selectedActivity === "cycling") {
          result = result.filter(e => e.muscles.some(m => act.muscleFilter.includes(m)));
        } else {
          result = result.filter(e => e.muscles.some(m => act.muscleFilter.includes(m)));
        }
      }
    }
    if (selectedMuscle) {
      result = result.filter(e => e.muscles.includes(selectedMuscle));
    }
    return result;
  }, [selectedActivity, selectedMuscle]);

  const muscles: ExerciseMuscle[] = useMemo(() => {
    const all = new Set<ExerciseMuscle>();
    EXERCISES.forEach(e => e.muscles.forEach(m => all.add(m)));
    return Array.from(all).sort();
  }, []);

  const activeType = ACTIVITY_TYPES.find(a => a.id === selectedActivity);

  return (
    <View style={{ flex: 1 }}>
      <ExerciseModal exercise={selectedExercise} visible={!!selectedExercise} onClose={() => setSelectedExercise(null)} />

      {/* Activity type selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 12 }}>
        <TouchableOpacity
          style={[lib.actBtn, !selectedActivity && lib.actBtnActive]}
          onPress={() => { setSelectedActivity(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="apps" size={18} color={!selectedActivity ? C.amber : C.textMuted} />
          <Text style={[lib.actText, !selectedActivity && { color: C.amber }]}>All</Text>
        </TouchableOpacity>
        {ACTIVITY_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[lib.actBtn, selectedActivity === type.id && lib.actBtnActive]}
            onPress={() => { setSelectedActivity(type.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name={type.icon as any} size={18} color={selectedActivity === type.id ? C.amber : C.textMuted} />
            <Text style={[lib.actText, selectedActivity === type.id && { color: C.amber }]}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Activity info card */}
      {activeType && (
        <View style={lib.infoCard}>
          <Text style={lib.infoDesc}>{activeType.description}</Text>
          <View style={lib.benefitsRow}>
            {activeType.benefits.map((b, i) => (
              <View key={i} style={lib.benefitChip}>
                <MaterialCommunityIcons name="check-circle-outline" size={12} color={C.success} />
                <Text style={lib.benefitChipText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Muscle filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {muscles.map(m => (
          <TouchableOpacity
            key={m}
            style={[lib.muscleChip, selectedMuscle === m && lib.muscleChipActive]}
            onPress={() => { setSelectedMuscle(selectedMuscle === m ? null : m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name={(MUSCLE_ICONS[m] || "arm-flex") as any} size={12} color={selectedMuscle === m ? C.amber : C.textMuted} />
            <Text style={[lib.muscleText, selectedMuscle === m && { color: C.amber }]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise count */}
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <Text style={lib.countText}>{filteredExercises.length} exercises</Text>
      </View>

      {/* Exercise list */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={lib.exCard}
            onPress={() => { setSelectedExercise(item); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={lib.exName}>{item.name}</Text>
              <View style={lib.exMeta}>
                <Text style={lib.exCat}>{item.category}</Text>
                <Text style={lib.exDot}>·</Text>
                <Text style={lib.exDiff}>{item.difficulty}</Text>
              </View>
              <View style={lib.exMuscles}>
                {item.muscles.slice(0, 3).map((m, i) => (
                  <View key={i} style={lib.exMuscleTagWrap}>
                    <MaterialCommunityIcons name={(MUSCLE_ICONS[m] || "arm-flex") as any} size={10} color={C.textMuted} />
                    <Text style={lib.exMuscleTag}>{m}</Text>
                  </View>
                ))}
              </View>
              {item.benefits && item.benefits.length > 0 && (
                <View style={{flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2}}>
                  <MaterialCommunityIcons name="check-circle" size={10} color={C.success} />
                  <Text style={lib.exBenefit} numberOfLines={1}>{item.benefits[0]}</Text>
                </View>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
});

const lib = StyleSheet.create({
  actBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: R.circle, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  actBtnActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  actText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted },
  infoCard: { marginHorizontal: 20, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 14, marginBottom: 12 },
  infoDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 10 },
  benefitsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  benefitChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: R.circle, backgroundColor: C.bgElevated },
  benefitChipText: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textSub },
  muscleChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: R.circle, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  muscleChipActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  muscleEmoji: { fontSize: 12 },
  muscleText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted },
  countText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted },
  exCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 14, marginBottom: 10 },
  exName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text, marginBottom: 4 },
  exMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  exCat: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textMuted, textTransform: "capitalize" },
  exDot: { color: C.textMuted },
  exDiff: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.amber },
  exMuscles: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  exMuscleTagWrap: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.bgElevated, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  exMuscleTag: { fontFamily: "Inter_500Medium", fontSize: 10, color: C.textSub, textTransform: "capitalize" },
  exBenefit: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.success },
});

// ════════════════════════════════════════════════════════════════════════════
// CALCULATORS
// ════════════════════════════════════════════════════════════════════════════

const InputField = memo(({ label, value, onChangeText, unit }: {
  label: string; value: string; onChangeText: (v: string) => void; unit: string;
}) => (
  <View style={calc.inputRow}>
    <Text style={calc.inputLabel}>{label}</Text>
    <View style={calc.inputWrap}>
      <TextInput
        style={calc.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        selectTextOnFocus
      />
      <Text style={calc.inputUnit}>{unit}</Text>
    </View>
  </View>
));

const CalculatorsTab = memo(() => {
  const { workout, updateSettings } = useWorkout();
  const s = workout.settings;

  // TDEE & Macros
  const [weight, setWeight] = useState(s.weight.toString());
  const [height, setHeight] = useState(s.height.toString());
  const [age, setAge] = useState(s.age.toString());
  const [gender, setGender] = useState(s.gender);
  const [actLevel, setActLevel] = useState(s.activityLevel);
  const [goal, setGoal] = useState(s.goal);

  // 1RM Calculator
  const [rmWeight, setRmWeight] = useState("100");
  const [rmReps, setRmReps] = useState("5");

  // Calorie Burn
  const [burnActivity, setBurnActivity] = useState(ACTIVITY_TYPES[0].id);
  const [burnMinutes, setBurnMinutes] = useState("30");

  // ── Computed TDEE ──────────────────────────────────────────────────────
  const tdeeData = useMemo(() => {
    const w = parseFloat(weight) || 70;
    const h = parseFloat(height) || 170;
    const a = parseInt(age) || 25;
    // Mifflin-St Jeor
    const bmr = gender === "male"
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 };
    const tdee = Math.round(bmr * (multipliers[actLevel] || 1.55));
    const goalAdj = goal === "cut" ? -500 : goal === "bulk" ? +500 : 0;
    const target = tdee + goalAdj;
    const protein = Math.round(w * (goal === "bulk" ? 2.2 : goal === "cut" ? 2.4 : 1.8));
    const fat = Math.round(w * 0.8);
    const fatCal = fat * 9;
    const proteinCal = protein * 4;
    const carbs = Math.round((target - proteinCal - fatCal) / 4);
    const bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10;
    return { bmr: Math.round(bmr), tdee, target, protein, carbs, fat, bmi };
  }, [weight, height, age, gender, actLevel, goal]);

  // ── Computed 1RM ───────────────────────────────────────────────────────
  const oneRM = useMemo(() => {
    const w = parseFloat(rmWeight) || 100;
    const r = parseInt(rmReps) || 5;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30)); // Epley formula
  }, [rmWeight, rmReps]);

  const rmPercentages = useMemo(() => [
    { pct: 100, reps: "1", label: "Max" },
    { pct: 95, reps: "2-3", label: "Power" },
    { pct: 90, reps: "3-4", label: "Strength" },
    { pct: 85, reps: "4-6", label: "Hypertrophy" },
    { pct: 80, reps: "6-8", label: "Volume" },
    { pct: 75, reps: "8-10", label: "Endurance" },
    { pct: 70, reps: "10-12", label: "Toning" },
    { pct: 65, reps: "12-15", label: "Warm-up" },
  ].map(r => ({ ...r, weight: Math.round(oneRM * (r.pct / 100)) })), [oneRM]);

  // ── Calorie Burn ───────────────────────────────────────────────────────
  const caloriesBurned = useMemo(() => {
    const w = parseFloat(weight) || 70;
    const mins = parseInt(burnMinutes) || 30;
    const act = ACTIVITY_TYPES.find(a => a.id === burnActivity);
    const MET = act?.metValue || 5;
    return Math.round(MET * w * (mins / 60));
  }, [weight, burnActivity, burnMinutes]);

  // ── BMI Category ───────────────────────────────────────────────────────
  const bmiCategory = useMemo(() => {
    const bmi = tdeeData.bmi;
    if (bmi < 18.5) return { label: "Underweight", color: C.info };
    if (bmi < 25) return { label: "Normal", color: C.success };
    if (bmi < 30) return { label: "Overweight", color: C.amber };
    return { label: "Obese", color: C.danger };
  }, [tdeeData.bmi]);

  const bmiBarPosition = Math.min(100, Math.max(0, ((tdeeData.bmi - 12) / 30) * 100));

  const saveProfile = () => {
    updateSettings({
      weight: parseFloat(weight) || 70,
      height: parseFloat(height) || 170,
      age: parseInt(age) || 25,
      gender,
      activityLevel: actLevel,
      goal,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Your fitness profile has been updated."); // Keeping standard alert here temporarily unless deeply required
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* ── TDEE / MACRO CALCULATOR ──────────────────────────────────────── */}
      <View style={calc.card}>
        <View style={calc.header}>
          <MaterialCommunityIcons name="calculator-variant" size={20} color={C.amber} />
          <Text style={calc.title}>TDEE & Macro Calculator</Text>
        </View>

        <InputField label="Weight" value={weight} onChangeText={setWeight} unit="kg" />
        <InputField label="Height" value={height} onChangeText={setHeight} unit="cm" />
        <InputField label="Age" value={age} onChangeText={setAge} unit="yrs" />

        {/* Gender */}
        <View style={calc.segRow}>
          <Text style={calc.inputLabel}>Gender</Text>
          <View style={calc.segWrap}>
            {(["male", "female"] as const).map(g => (
              <TouchableOpacity key={g} style={[calc.seg, gender === g && calc.segActive]} onPress={() => setGender(g)} activeOpacity={0.8}>
                <Text style={[calc.segText, gender === g && { color: C.amber }]}>{g === "male" ? "Male" : "Female"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Level */}
        <View style={{ marginBottom: 14 }}>
          <Text style={calc.inputLabel}>Activity Level</Text>
          <View style={calc.actGrid}>
            {(["sedentary", "light", "moderate", "active", "athlete"] as const).map(l => (
              <TouchableOpacity key={l} style={[calc.actChip, actLevel === l && calc.actChipActive]} onPress={() => setActLevel(l)} activeOpacity={0.8}>
                <Text style={[calc.actChipText, actLevel === l && { color: C.amber }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View style={calc.segRow}>
          <Text style={calc.inputLabel}>Goal</Text>
          <View style={calc.segWrap}>
            {(["cut", "maintain", "bulk"] as const).map(g => (
              <TouchableOpacity key={g} style={[calc.seg, goal === g && calc.segActive]} onPress={() => setGoal(g)} activeOpacity={0.8}>
                <Text style={[calc.segText, goal === g && { color: C.amber }]}>
                  {g === "cut" ? "Cut" : g === "bulk" ? "Bulk" : "Maintain"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Results */}
        <View style={calc.resultGrid}>
          <View style={calc.resultCard}>
            <Text style={calc.resultNum}>{tdeeData.target}</Text>
            <Text style={calc.resultLabel}>Daily Cal</Text>
          </View>
          <View style={calc.resultCard}>
            <Text style={calc.resultNum}>{tdeeData.protein}g</Text>
            <Text style={calc.resultLabel}>Protein</Text>
          </View>
          <View style={calc.resultCard}>
            <Text style={calc.resultNum}>{tdeeData.carbs}g</Text>
            <Text style={calc.resultLabel}>Carbs</Text>
          </View>
          <View style={calc.resultCard}>
            <Text style={calc.resultNum}>{tdeeData.fat}g</Text>
            <Text style={calc.resultLabel}>Fat</Text>
          </View>
        </View>

        <View style={calc.metaRow}>
          <Text style={calc.metaText}>BMR: {tdeeData.bmr} cal | TDEE: {tdeeData.tdee} cal</Text>
        </View>

        <TouchableOpacity onPress={saveProfile} style={calc.saveBtn} activeOpacity={0.85}>
          <Text style={calc.saveBtnText}>Save Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ── BMI VISUALIZER ─────────────────────────────────────────────── */}
      <View style={calc.card}>
        <View style={calc.header}>
          <MaterialCommunityIcons name="human" size={20} color={C.amber} />
          <Text style={calc.title}>BMI Visualizer</Text>
        </View>
        <View style={calc.bmiRow}>
          <Text style={[calc.bmiNum, { color: bmiCategory.color }]}>{tdeeData.bmi}</Text>
          <Text style={[calc.bmiLabel, { color: bmiCategory.color }]}>{bmiCategory.label}</Text>
        </View>
        <View style={calc.bmiBar}>
          <View style={[calc.bmiZone, { flex: 1, backgroundColor: C.infoBg }]} />
          <View style={[calc.bmiZone, { flex: 2, backgroundColor: C.successBg }]} />
          <View style={[calc.bmiZone, { flex: 1, backgroundColor: C.amberBg }]} />
          <View style={[calc.bmiZone, { flex: 1, backgroundColor: C.dangerBg }]} />
          <View style={[calc.bmiPointer, { left: `${bmiBarPosition}%` as any }]} />
        </View>
        <View style={calc.bmiLabels}>
          <Text style={calc.bmiLabelText}>18.5</Text>
          <Text style={calc.bmiLabelText}>25</Text>
          <Text style={calc.bmiLabelText}>30</Text>
          <Text style={calc.bmiLabelText}>40+</Text>
        </View>
      </View>

      {/* ── 1RM CALCULATOR ────────────────────────────────────────────── */}
      <View style={calc.card}>
        <View style={calc.header}>
          <MaterialCommunityIcons name="weight-lifter" size={20} color={C.amber} />
          <Text style={calc.title}>1RM Calculator (Epley)</Text>
        </View>
        <InputField label="Weight Lifted" value={rmWeight} onChangeText={setRmWeight} unit="kg" />
        <InputField label="Reps Done" value={rmReps} onChangeText={setRmReps} unit="reps" />

        <View style={calc.rmResult}>
          <Text style={calc.rmLabel}>Estimated 1RM</Text>
          <Text style={calc.rmValue}>{oneRM} kg</Text>
        </View>

        <View style={calc.rmTable}>
          {rmPercentages.map(r => (
            <View key={r.pct} style={calc.rmRow}>
              <Text style={calc.rmPct}>{r.pct}%</Text>
              <Text style={calc.rmWeight}>{r.weight} kg</Text>
              <Text style={calc.rmReps}>{r.reps} reps</Text>
              <Text style={calc.rmRange}>{r.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── CALORIE BURN ESTIMATOR ─────────────────────────────────────── */}
      <View style={calc.card}>
        <View style={calc.header}>
          <MaterialCommunityIcons name="fire" size={20} color={C.amber} />
          <Text style={calc.title}>Calorie Burn Estimator</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
          {ACTIVITY_TYPES.map(a => (
            <TouchableOpacity
              key={a.id}
              style={[calc.burnChip, burnActivity === a.id && calc.burnChipActive]}
              onPress={() => setBurnActivity(a.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={a.icon as any} size={16} color={burnActivity === a.id ? C.amber : C.textMuted} />
              <Text style={[calc.burnChipText, burnActivity === a.id && { color: C.amber }]}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <InputField label="Duration" value={burnMinutes} onChangeText={setBurnMinutes} unit="min" />

        <View style={calc.burnResult}>
          <Text style={calc.burnResultNum}>{caloriesBurned}</Text>
          <Text style={calc.burnResultUnit}>calories burned</Text>
        </View>

        <Text style={calc.burnNote}>
          Based on MET value of {ACTIVITY_TYPES.find(a => a.id === burnActivity)?.metValue || 5} ×
          weight ({weight} kg) × duration ({burnMinutes} min)
        </Text>
      </View>
      </ScrollView>
    </View>
  );
});

const calc = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text },
  inputRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSub, marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  input: {
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    borderRadius: R.button, paddingVertical: 8, paddingHorizontal: 14,
    fontFamily: "Inter_600SemiBold", fontSize: 18, color: C.text, textAlign: "center",
    minWidth: 80,
  },
  inputUnit: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted },
  segRow: { marginBottom: 14 },
  segWrap: { flexDirection: "row", gap: 8, marginTop: 6 },
  seg: { flex: 1, paddingVertical: 10, borderRadius: R.button, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  segActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  segText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textMuted },
  actGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  actChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.circle, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border },
  actChipActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  actChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted, textTransform: "capitalize" },
  resultGrid: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 10 },
  resultCard: { flex: 1, backgroundColor: C.bgElevated, borderRadius: R.card, padding: 12, alignItems: "center" },
  resultNum: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.amber, letterSpacing: -0.5 },
  resultLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textMuted, marginTop: 4 },
  metaRow: { alignItems: "center", marginBottom: 14 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
  saveBtn: { backgroundColor: C.amber, borderRadius: R.button, paddingVertical: 12, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.bg },
  bmiRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 12 },
  bmiNum: { fontFamily: "Inter_700Bold", fontSize: 40, letterSpacing: -1 },
  bmiLabel: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  bmiBar: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 6, position: "relative" },
  bmiZone: { height: 10 },
  bmiPointer: { position: "absolute", top: -4, width: 4, height: 18, borderRadius: 2, backgroundColor: C.text },
  bmiLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  bmiLabelText: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textMuted },
  rmResult: { alignItems: "center", marginVertical: 16, padding: 20, backgroundColor: C.bgElevated, borderRadius: R.card },
  rmLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted, marginBottom: 4 },
  rmValue: { fontFamily: "Inter_700Bold", fontSize: 40, color: C.amber, letterSpacing: -2 },
  rmTable: { gap: 4 },
  rmRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  rmPct: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted, width: 50 },
  rmWeight: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.text, width: 80 },
  rmReps: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSub, flex: 1 },
  rmRange: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.amber },
  burnChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.circle, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border },
  burnChipActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  burnChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted },
  burnResult: { alignItems: "center", marginVertical: 16, padding: 20, backgroundColor: C.bgElevated, borderRadius: R.card },
  burnResultNum: { fontFamily: "Inter_700Bold", fontSize: 48, color: C.amber, letterSpacing: -2 },
  burnResultUnit: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted, marginTop: 4 },
  burnNote: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, textAlign: "center" },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default memo(function WorkoutScreen() {
  const [tab, setTab] = useState<WorkoutTab>("library");

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, marginBottom: 12 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, letterSpacing: -0.5 }}>
            Workout
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginTop: 4 }}>
            Exercise library, calculators, and visual guides.
          </Text>
        </View>

        {/* Tab selector */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 14 }}>
          {([
            { id: "library" as WorkoutTab, label: "Library", icon: "bookshelf" },
            { id: "calculators" as WorkoutTab, label: "Calculators", icon: "calculator" },
          ]).map(t => (
            <TouchableOpacity
              key={t.id}
              style={[wt.tabBtn, tab === t.id && wt.tabBtnActive]}
              onPress={() => { setTab(t.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={t.icon as any} size={16} color={tab === t.id ? C.amber : C.textMuted} />
              <Text style={[wt.tabText, tab === t.id && { color: C.amber }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          {tab === "library" ? <LibraryTab /> : <CalculatorsTab />}
        </View>
      </SafeAreaView>
    </View>
  );
});

const wt = StyleSheet.create({
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: R.button, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  tabBtnActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textMuted },
});
