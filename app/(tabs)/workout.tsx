import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/context/SettingsContext";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ─── Data ───────────────────────────────────────────────────────────────────

const EXERCISES = [
  { id: "e1", name: "Push-ups", muscle: "Chest", level: "Beginner", icon: "arm-flex", image: "https://images.unsplash.com/photo-1571019623452-c6c7b323ede0?q=80&w=400" },
  { id: "e2", name: "Bench Press", muscle: "Chest", level: "Advanced", icon: "weight-lifter", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400" },
  { id: "e3", name: "Squats", muscle: "Legs", level: "Intermediate", icon: "human-male-height", image: "https://images.unsplash.com/photo-1574673139081-37d45749cc1a?q=80&w=400" },
  { id: "e4", name: "Pull-ups", muscle: "Back", level: "Intermediate", icon: "pull-up", image: "https://images.unsplash.com/photo-1598971639058-aba3c72b7a22?q=80&w=400" },
  { id: "e5", name: "Plank", muscle: "Core", level: "Beginner", icon: "yoga", image: "https://images.unsplash.com/photo-1566241142559-40e1bfc26eb7?q=80&w=400" },
  { id: "e6", name: "Deadlifts", muscle: "Legs", level: "Advanced", icon: "weight-lifter", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400" },
];

const ROUTINES: Record<string, { label: string; focus: string; suggestions: string[] }> = {
  Underweight: {
    label: "Mass Gainer",
    focus: "Hypertrophy & Caloric Surplus",
    suggestions: ["Heavy Weights (4-6 reps)", "Compound Movements", "3000+ kcal/day"]
  },
  Healthy: {
    label: "Maintenance & Tone",
    focus: "Muscle Definition & Athleticism",
    suggestions: ["Hypertrophy (8-12 reps)", "Progressive Overload", "HIIT 2x/week"]
  },
  Overweight: {
    label: "Fat Loss & Endurance",
    focus: "Caloric Deficit & Cardiovascular Peak",
    suggestions: ["High Volume (15-20 reps)", "Steady State Cardio", "Intermittent Fasting"]
  },
  Obese: {
    label: "Recovery & Foundation",
    focus: "Low Impact & Sustainability",
    suggestions: ["Walking (5k steps)", "Swimming", "Low Impact Bodyweight"]
  }
};

const FOODS = [
  { name: "Egg", protein: 6, unit: "1 large" },
  { name: "Chicken Breast", protein: 31, unit: "100g" },
  { name: "Beef", protein: 26, unit: "100g" },
  { name: "Lentils", protein: 9, unit: "100g" },
  { name: "Greek Yogurt", protein: 10, unit: "100g" },
];

// ─── Components ──────────────────────────────────────────────────────────────

function Card({ children, style, C }: { children: React.ReactNode; style?: any; C: any }) {
  return (
    <View style={[styles.card, { backgroundColor: C.backgroundCard, borderColor: C.border }, style]}>
      {children}
    </View>
  );
}

function SectionHeader({ title, icon, C }: { title: string; icon: string; C: any }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon as any} size={20} color={C.amber} />
      <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateWorkout } = useSettings();
  const C = Colors.dark;

  const [activeTab, setActiveTab] = useState<"bmi" | "plan" | "nutrition">("bmi");

  // BMI Logic
  const bmi = useMemo(() => {
    const h = settings.workout.height / 100;
    if (h === 0) return 0;
    return parseFloat((settings.workout.weight / (h * h)).toFixed(1));
  }, [settings.workout.height, settings.workout.weight]);

  const bmiStatus = useMemo(() => {
    if (bmi < 18.5) return { label: "Underweight", color: C.info };
    if (bmi < 25) return { label: "Healthy", color: C.success };
    if (bmi < 30) return { label: "Overweight", color: C.amber };
    return { label: "Obese", color: C.danger };
  }, [bmi, C]);

  // Nutrition Logic
  const proteinGoal = useMemo(() => {
    const factor = settings.workout.activityLevel === "sedentary" ? 0.8 : 
                   settings.workout.activityLevel === "light" ? 1.2 :
                   settings.workout.activityLevel === "moderate" ? 1.5 : 1.8;
    return Math.round(settings.workout.weight * factor);
  }, [settings.workout.weight, settings.workout.activityLevel]);

  return (
    <LinearGradient colors={["#0D0B1E", "#1A1A2E"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Elite Health</Text>
        <Text style={styles.headerSubtitle}>Personalized Wellness & Nutrition</Text>

        <View style={styles.tabContainer}>
          {(["bmi", "plan", "nutrition"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab); }}
              style={[
                styles.tabButton,
                activeTab === tab && { backgroundColor: C.amber + "20", borderColor: C.amber }
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? C.amber : C.textMuted }]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "bmi" && (
          <View>
            <Card C={C}>
              <SectionHeader title="Body Composition" icon="scale-bathroom" C={C} />
              
              <View style={styles.bmiDisplay}>
                <View>
                  <Text style={styles.bmiValue}>{bmi}</Text>
                  <Text style={[styles.bmiStatus, { color: bmiStatus.color }]}>• {bmiStatus.label}</Text>
                </View>
                <View style={styles.bmiMeter}>
                   {/* Visual Meter Placeholder */}
                   <View style={{ height: 60, width: 2, backgroundColor: C.border }} />
                   <View style={{ position: 'absolute', top: (bmi / 40) * 100, width: 20, height: 2, backgroundColor: C.amber }} />
                </View>
              </View>

              <View style={styles.inputGrid}>
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={settings.workout.height.toString()}
                    onChangeText={(v) => updateWorkout({ height: parseInt(v) || 0 })}
                  />
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={settings.workout.weight.toString()}
                    onChangeText={(v) => updateWorkout({ weight: parseInt(v) || 0 })}
                  />
                </View>
              </View>
            </Card>

            <Card C={C} style={{ marginTop: 16 }}>
               <SectionHeader title="Elite Auto-Planner" icon="robot" C={C} />
               <View style={styles.routineInfo}>
                  <Text style={styles.routineLabel}>Prescribed Routine: {ROUTINES[bmiStatus.label]?.label}</Text>
                  <Text style={styles.routineFocus}>Focus: {ROUTINES[bmiStatus.label]?.focus}</Text>
                  <View style={{ gap: 6, marginTop: 10 }}>
                    {ROUTINES[bmiStatus.label]?.suggestions.map(s => (
                      <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                         <Ionicons name="flash" size={12} color={C.amber} />
                         <Text style={styles.tipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
               </View>
            </Card>
          </View>
        )}

        {activeTab === "plan" && (
          <View>
            <Card C={C}>
               <SectionHeader title="Elite Workouts" icon="dumbbell" C={C} />
               <View style={{ gap: 12, marginTop: 12 }}>
                 {EXERCISES.map(ex => (
                   <View key={ex.id} style={styles.exerciseRow}>
                     <View style={[styles.exerciseIcon, { backgroundColor: C.amber + '10' }]}>
                        <MaterialCommunityIcons name={ex.icon as any} size={24} color={C.amber} />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Text style={styles.exerciseMuscle}>{ex.muscle} • {ex.level}</Text>
                     </View>
                     <TouchableOpacity style={styles.viewBtn}>
                        <AntDesign name="right" size={14} color={C.textMuted} />
                     </TouchableOpacity>
                   </View>
                 ))}
               </View>
            </Card>
          </View>
        )}

        {activeTab === "nutrition" && (
           <View>
             <Card C={C}>
                <SectionHeader title="Protein Intake" icon="food-apple" C={C} />
                <View style={styles.proteinCircle}>
                   <Text style={styles.proteinValue}>{proteinGoal}g</Text>
                   <Text style={styles.proteinSub}>Daily Target</Text>
                </View>
                
                <Text style={styles.foodTitle}>Recommended Sources:</Text>
                <View style={{ gap: 8 }}>
                  {FOODS.map(f => {
                    const amountNeeded = Math.ceil(proteinGoal / f.protein);
                    return (
                      <View key={f.name} style={styles.foodRow}>
                         <Text style={styles.foodName}>{f.name}</Text>
                         <Text style={styles.foodQty}>{amountNeeded} {f.unit.includes('large') ? 'unit(s)' : 'x 100g'}</Text>
                      </View>
                    );
                  })}
                </View>
             </Card>
           </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

import { AntDesign } from "@expo/vector-icons";

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#FFFFFF", textAlign: "center" },
  headerSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#A0A0B0", textAlign: "center", marginTop: 4, marginBottom: 20 },
  tabContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  tabText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  card: { borderRadius: 24, padding: 20, borderWidth: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  bmiDisplay: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  bmiValue: { fontSize: 48, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  bmiStatus: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bmiMeter: { width: 50, height: 100, alignItems: 'center', justifyContent: 'center' },
  inputGrid: { flexDirection: "row", gap: 16 },
  inputBox: { flex: 1 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#A0A0B0", marginBottom: 6 },
  textInput: { height: 48, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, color: "#FFFFFF", paddingHorizontal: 16, fontSize: 16, fontFamily: "Inter_700Bold" },
  routineInfo: { marginTop: 4 },
  routineLabel: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  routineFocus: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 2 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A0A0B0", lineHeight: 20 },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  exerciseIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  exerciseName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  exerciseMuscle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0A0B0" },
  viewBtn: { padding: 8 },
  proteinCircle: { width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: "#FFB000", alignSelf: "center", alignItems: "center", justifyContent: "center", marginVertical: 20 },
  proteinValue: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  proteinSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0A0B0" },
  foodTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 12, marginTop: 10 },
  foodRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  foodName: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#FFFFFF" },
  foodQty: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#FFB000" },
});
