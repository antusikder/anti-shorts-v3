import React, { memo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { EXERCISES, Exercise } from "@/constants/exercises";
import { useWorkout } from "@/context/WorkoutContext";
import { C, R, S } from "@/constants/colors";

// ... [TDEE CALCULATOR HIDDEN]

// ════════════════════════════════════════════════════════════════════════════
// TDEE CALCULATOR
// ════════════════════════════════════════════════════════════════════════════

const TDEECalculator = memo(() => {
  const { metrics, updateMetrics } = useWorkout();
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const weightKg = metrics.unit === "metric" ? metrics.weight : metrics.weight * 0.453592;
    const heightCm = metrics.unit === "metric" ? metrics.height : metrics.height * 2.54;
    
    // Mifflin-St Jeor
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * metrics.age;
    bmr += metrics.gender === "male" ? 5 : -161;
    
    // Activity multiplier
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    
    setResult(Math.round(bmr * (multipliers[metrics.activityLevel] || 1.2)));
  };

  return (
    <View style={tc.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <View style={tc.iconBox}>
          <MaterialCommunityIcons name="calculator" size={18} color={C.accent} />
        </View>
        <Text style={tc.title}>Macro & TDEE Calculator</Text>
      </View>

      <View style={tc.row}>
        <View style={{ flex: 1 }}>
          <Text style={tc.label}>Weight ({metrics.unit === "metric" ? "kg" : "lbs"})</Text>
          <TextInput
            style={tc.input}
            value={metrics.weight.toString()}
            onChangeText={t => updateMetrics({ weight: parseFloat(t) || 0 })}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={tc.label}>Height ({metrics.unit === "metric" ? "cm" : "in"})</Text>
          <TextInput
            style={tc.input}
            value={metrics.height.toString()}
            onChangeText={t => updateMetrics({ height: parseFloat(t) || 0 })}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={tc.label}>Age</Text>
          <TextInput
            style={tc.input}
            value={metrics.age.toString()}
            onChangeText={t => updateMetrics({ age: parseInt(t) || 0 })}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={tc.row}>
        <TouchableOpacity
          style={[tc.toggleBtn, metrics.gender === "male" && tc.toggleActive]}
          onPress={() => updateMetrics({ gender: "male" })}
        >
          <Text style={[tc.toggleText, metrics.gender === "male" && { color: C.text }]}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[tc.toggleBtn, metrics.gender === "female" && tc.toggleActive]}
          onPress={() => updateMetrics({ gender: "female" })}
        >
          <Text style={[tc.toggleText, metrics.gender === "female" && { color: C.text }]}>Female</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={tc.calcBtn} onPress={calculate} activeOpacity={0.85}>
        <Text style={tc.calcBtnText}>Calculate Daily Calories</Text>
      </TouchableOpacity>

      {result !== null && (
        <View style={tc.resultBox}>
          <Text style={tc.resultLabel}>Maintenance Calories</Text>
          <Text style={tc.resultValue}>{result} kcal</Text>
          <View style={tc.macros}>
            <View style={tc.macroCol}>
              <Text style={tc.macroLabel}>Protein</Text>
              <Text style={tc.macroVal}>{Math.round((result * 0.3) / 4)}g</Text>
            </View>
            <View style={tc.macroCol}>
              <Text style={tc.macroLabel}>Carbs</Text>
              <Text style={tc.macroVal}>{Math.round((result * 0.4) / 4)}g</Text>
            </View>
            <View style={tc.macroCol}>
              <Text style={tc.macroLabel}>Fats</Text>
              <Text style={tc.macroVal}>{Math.round((result * 0.3) / 9)}g</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

const tc = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 16 },
  iconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  label: { fontFamily: "Nunito_500Medium", fontSize: 13, color: C.textMuted, marginBottom: 6 },
  input: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, borderRadius: R.input, paddingVertical: 10, paddingHorizontal: 12, fontFamily: "Nunito_600SemiBold", color: C.text, fontSize: 15 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: R.button, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  toggleActive: { backgroundColor: C.accentBg, borderColor: C.accentBorder },
  toggleText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.textMuted },
  calcBtn: { backgroundColor: C.accent, paddingVertical: 14, borderRadius: R.button, alignItems: "center", marginTop: 4 },
  calcBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.bg },
  resultBox: { marginTop: 16, padding: 16, backgroundColor: C.bgElevated, borderRadius: R.card, borderWidth: 1, borderColor: C.accentBorder, alignItems: "center" },
  resultLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.accent, textTransform: "uppercase", letterSpacing: 1 },
  resultValue: { fontFamily: "Nunito_800ExtraBold", fontSize: 36, color: C.text, letterSpacing: -1, marginVertical: 4 },
  macros: { flexDirection: "row", width: "100%", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  macroCol: { alignItems: "center" },
  macroLabel: { fontFamily: "Nunito_500Medium", fontSize: 12, color: C.textMuted },
  macroVal: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text, marginTop: 2 },
});

// ════════════════════════════════════════════════════════════════════════════
// EXERCISE LIBRARY
// ════════════════════════════════════════════════════════════════════════════

const ExerciseLibrary = memo(() => {
  const [selectedCat, setSelectedCat] = useState<string>("strength");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [modalEx, setModalEx] = useState<Exercise | null>(null);

  const filtered = EXERCISES.filter((e: Exercise) => 
    (e.category === selectedCat || e.category === selectedCat.toLowerCase()) && 
    (!selectedMuscle || e.muscles.includes(selectedMuscle as any))
  );

  const muscles = Array.from(new Set(
    EXERCISES.filter((e: Exercise) => e.category === selectedCat || e.category === selectedCat.toLowerCase())
    .flatMap((e: Exercise) => e.muscles)
  ));

  return (
    <View style={el.container}>
      {/* Type Selector */}
      <View style={el.typeRow}>
        {["strength", "cardio", "bodyweight"].map(t => (
          <TouchableOpacity
            key={t}
            style={[el.typeBtn, selectedCat === t && el.typeBtnActive]}
            onPress={() => { setSelectedCat(t); setSelectedMuscle(null); Haptics.selectionAsync(); }}
          >
            <Text style={[el.typeBtnText, selectedCat === t && { color: C.bg }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Muscle Filter */}
      {muscles.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={el.muscleScroll} contentContainerStyle={{ paddingRight: 20 }}>
          <TouchableOpacity
            style={[el.muscleChip, !selectedMuscle && el.muscleChipActive]}
            onPress={() => { setSelectedMuscle(null); Haptics.selectionAsync(); }}
          >
            <Text style={[el.muscleChipText, !selectedMuscle && { color: C.accent }]}>All</Text>
          </TouchableOpacity>
          {muscles.map(m => (
            <TouchableOpacity
              key={m}
              style={[el.muscleChip, selectedMuscle === m && el.muscleChipActive]}
              onPress={() => { setSelectedMuscle(m as string); Haptics.selectionAsync(); }}
            >
              <Text style={[el.muscleChipText, selectedMuscle === m && { color: C.accent }]}>{String(m).charAt(0).toUpperCase() + String(m).slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* List */}
      <Text style={el.countText}>{filtered.length} exercises</Text>
      {filtered.map(ex => (
        <TouchableOpacity key={ex.id} style={el.exCard} onPress={() => { setModalEx(ex); Haptics.selectionAsync(); }}>
          <View style={el.exIconBox}>
            <MaterialCommunityIcons name="dumbbell" size={20} color={C.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={el.exName}>{ex.name}</Text>
            <Text style={el.exMuscle}>{ex.muscles[0]} • {ex.difficulty}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
        </TouchableOpacity>
      ))}

      {/* Detail Modal */}
      <Modal visible={!!modalEx} transparent animationType="slide" onRequestClose={() => setModalEx(null)}>
        <View style={el.modalBg}>
          <View style={el.modalCard}>
            <View style={el.modalHeader}>
              <Text style={el.modalTitle}>{modalEx?.name}</Text>
              <TouchableOpacity onPress={() => setModalEx(null)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={24} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={el.modalSub}>{modalEx?.muscles.join(", ")} • {modalEx?.difficulty}</Text>
            
            <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
              {modalEx?.steps.map((step: string, i: number) => (
                <View key={i} style={el.stepRow}>
                  <View style={el.stepNumBox}><Text style={el.stepNum}>{i + 1}</Text></View>
                  <Text style={el.stepText}>{step}</Text>
                </View>
              ))}
              {modalEx?.tips && modalEx.tips.length > 0 && (
                <View style={el.tipsBox}>
                  <MaterialCommunityIcons name="lightbulb-on" size={16} color={C.accent} style={{ marginBottom: 6 }} />
                  {modalEx.tips.map((tip: string, i: number) => (
                    <Text key={i} style={el.tipText}>• {tip}</Text>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const el = StyleSheet.create({
  container: { marginTop: 8 },
  typeRow: { flexDirection: "row", backgroundColor: C.bgElevated, borderRadius: R.circle, padding: 4, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: R.circle },
  typeBtnActive: { backgroundColor: C.text },
  typeBtnText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.textMuted },
  muscleScroll: { marginBottom: 16 },
  muscleChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: R.circle, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, marginRight: 8 },
  muscleChipActive: { backgroundColor: C.accentBg, borderColor: C.accentBorder },
  muscleChipText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textMuted },
  countText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textMuted, marginBottom: 12 },
  exCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.bgCard, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 },
  exIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.bgElevated, alignItems: "center", justifyContent: "center" },
  exName: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text },
  exMuscle: { fontFamily: "Nunito_500Medium", fontSize: 13, color: C.textMuted, marginTop: 2 },
  modalBg: { flex: 1, backgroundColor: C.bgOverlay, justifyContent: "flex-end" },
  modalCard: { backgroundColor: C.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, height: "80%", borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 24, color: C.text, flex: 1 },
  modalSub: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.accent, marginTop: 4 },
  stepRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  stepNumBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.bgElevated, alignItems: "center", justifyContent: "center", marginTop: 2 },
  stepNum: { fontFamily: "Nunito_700Bold", fontSize: 12, color: C.text },
  stepText: { fontFamily: "Nunito_400Regular", fontSize: 15, color: C.text, lineHeight: 22, flex: 1 },
  tipsBox: { backgroundColor: C.accentBg, borderRadius: R.card, padding: 16, marginTop: 12 },
  tipText: { fontFamily: "Nunito_500Medium", fontSize: 14, color: C.accent, marginBottom: 4 },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function WorkoutScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: S.pagePad, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: 8, marginBottom: 20 }}>
            <Text style={pr.heading}>Workout</Text>
            <Text style={pr.subheading}>Exercise library & nutrition</Text>
          </View>
          <TDEECalculator />
          <ExerciseLibrary />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const pr = StyleSheet.create({
  heading: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, color: C.text, letterSpacing: -0.5 },
  subheading: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, marginTop: 4 },
});
