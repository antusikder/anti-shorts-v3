import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import React, { useState, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";

// ─── Constants & Data ────────────────────────────────────────────────────────
const { width } = Dimensions.get("window");

const MUSCLE_GROUPS = [
  { id: "chest", name: "Chest", icon: "dumbbell", color: "#FF5252" },
  { id: "back", name: "Back", icon: "running", color: "#448AFF" },
  { id: "legs", name: "Legs", icon: "walking", color: "#FFB300" },
  { id: "arms", name: "Arms", icon: "fist-raised", color: "#E040FB" },
  { id: "core", name: "Core", icon: "user-ninja", color: "#64FFDA" },
];

const ROUTINES: Record<string, { label: string; focus: string; suggestions: string[]; days: string[] }> = {
  Underweight: {
    label: "Elite Mass Gainer",
    focus: "Hypertrophy & High Caloric Intake",
    suggestions: ["Heavy Compunds (4-6 reps)", "Limit Cardio", "Eat 1.2g Protein/lb"],
    days: ["Push", "Pull", "Legs", "Rest", "Upper", "Lower", "Rest"]
  },
  Healthy: {
    label: "Athletic Definition",
    focus: "Versatile Strength & Endurance",
    suggestions: ["Hypertrophy (8-12 reps)", "HIIT Cardio 2x/week", "Mobility Drills"],
    days: ["Strength", "Endurance", "Active Recovery", "Strength", "HIIT", "Long Run", "Rest"]
  },
  Overweight: {
    label: "Elite Fat Incinerator",
    focus: "Caloric Deficit & High Intensity",
    suggestions: ["High Volume (15-20 reps)", "Steady State Cardio", "No Sugar Policy"],
    days: ["Circuit", "Walk 10k", "Circuit", "Yoga", "Swimming", "Long Walk", "Active Rest"]
  },
  Obese: {
    label: "Foundation Rebuild",
    focus: "Low Impact & Sustainable Flow",
    suggestions: ["Walking (5k steps)", "Joint Care", "Intermittent Fasting"],
    days: ["Walk", "Stretch", "Walk", "Pool", "Walk", "Low Impact", "Rest"]
  }
};

const FOODS = [
  { name: "Egg", protein: 6, unit: "1 large", cal: 70 },
  { name: "Chicken", protein: 31, unit: "100g", cal: 165 },
  { name: "Lentils (Dal)", protein: 9, unit: "1/2 cup", cal: 115 },
  { name: "Beef", protein: 26, unit: "100g", cal: 250 },
  { name: "Milk", protein: 8, unit: "1 glass", cal: 146 },
  { name: "Yogurt", protein: 10, unit: "1 cup", cal: 100 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, C }: { icon: string; title: string; subtitle?: string; C: any }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={C.amber} />
        <View>
          <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

function Card({ children, style, C }: { children: React.ReactNode; style?: object; C: any }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: C.border }, style]}>
      {children}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const { settings, updateWorkout } = useSettings();

  const [calcMode, setCalcMode] = useState<"bmi" | "nutrition">("bmi");
  
  // BMI Logic
  const h = settings.workout.height / 100;
  const bmi = settings.workout.weight / (h * h);
  const bmiStatus = useMemo(() => {
    if (bmi < 18.5) return { label: "Underweight", color: "#448AFF" };
    if (bmi < 25) return { label: "Healthy", color: "#64FFDA" };
    if (bmi < 30) return { label: "Overweight", color: "#FFB300" };
    return { label: "Obese", color: "#FF5252" };
  }, [bmi]);

  // BMR & Nutrition Logic
  const age = settings.workout.age || 25;
  const gender = settings.workout.gender || "male";
  
  // Mifflin-St Jeor Equation
  const bmr = gender === "male" 
    ? (10 * settings.workout.weight) + (6.25 * settings.workout.height) - (5 * age) + 5
    : (10 * settings.workout.weight) + (6.25 * settings.workout.height) - (5 * age) - 161;

  const dailyProtein = gender === "male" 
    ? settings.workout.weight * 1.8 
    : settings.workout.weight * 1.5;

  return (
    <LinearGradient colors={["#0D0B1E", "#05050A"]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }}
      >
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
           <Text style={{ fontSize: 32, fontFamily: "Inter_700Bold", color: "#FFFFFF" }}>Elite Fitness</Text>
           <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 4 }}>High-performance body engineering</Text>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabContainer}>
           <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setCalcMode("bmi"); }} style={[styles.tab, calcMode === "bmi" && styles.tabActive]}>
              <Text style={[styles.tabText, calcMode === "bmi" && { color: "#FFFFFF" }]}>Body Analysis</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setCalcMode("nutrition"); }} style={[styles.tab, calcMode === "nutrition" && styles.tabActive]}>
              <Text style={[styles.tabText, calcMode === "nutrition" && { color: "#FFFFFF" }]}>Nutrition Fuel</Text>
           </TouchableOpacity>
        </View>

        {calcMode === "bmi" ? (
          <View style={{ paddingHorizontal: 16 }}>
             {/* ── BMI Stats ── */}
             <Card C={C} style={{ borderColor: bmiStatus.color + '33' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View>
                      <Text style={styles.metricLabel}>Current BMI</Text>
                      <Text style={[styles.metricValue, { color: bmiStatus.color }]}>{bmi.toFixed(1)}</Text>
                   </View>
                   <View style={[styles.badge, { backgroundColor: bmiStatus.color + "20" }]}>
                      <Text style={{ color: bmiStatus.color, fontFamily: "Inter_700Bold", fontSize: 12 }}>{bmiStatus.label}</Text>
                   </View>
                </View>
                <View style={styles.inputGrid}>
                   <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Weight (kg)</Text>
                      <TextInput
                        value={String(settings.workout.weight)}
                        onChangeText={(v) => updateWorkout({ weight: parseFloat(v) || 0 })}
                        keyboardType="decimal-pad"
                        style={styles.numericInput}
                      />
                   </View>
                   <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Height (cm)</Text>
                      <TextInput
                        value={String(settings.workout.height)}
                        onChangeText={(v) => updateWorkout({ height: parseFloat(v) || 0 })}
                        keyboardType="decimal-pad"
                        style={styles.numericInput}
                      />
                   </View>
                </View>
                <View style={styles.inputGrid}>
                   <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Age</Text>
                      <TextInput
                        value={String(settings.workout.age)}
                        onChangeText={(v) => updateWorkout({ age: parseInt(v) || 0 })}
                        keyboardType="number-pad"
                        style={styles.numericInput}
                      />
                   </View>
                   <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Gender</Text>
                      <View style={styles.genderToggle}>
                         <TouchableOpacity 
                           onPress={() => updateWorkout({ gender: "male" })}
                           style={[styles.genderBtn, settings.workout.gender === "male" && styles.genderBtnActive]}
                         >
                            <Text style={[styles.genderBtnText, settings.workout.gender === "male" && { color: "#FFF" }]}>M</Text>
                         </TouchableOpacity>
                         <TouchableOpacity 
                           onPress={() => updateWorkout({ gender: "female" })}
                           style={[styles.genderBtn, settings.workout.gender === "female" && styles.genderBtnActive]}
                         >
                            <Text style={[styles.genderBtnText, settings.workout.gender === "female" && { color: "#FFF" }]}>F</Text>
                         </TouchableOpacity>
                      </View>
                   </View>
                </View>
             </Card>

             <View style={{ height: 16 }} />

             {/* ── Muscle Focus ── */}
             <SectionHeader title="Target Optimization" icon="human" C={C} />
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {MUSCLE_GROUPS.map(g => (
                   <TouchableOpacity key={g.id} style={styles.muscleBtn}>
                      <View style={[styles.muscleIcon, { backgroundColor: g.color + '15' }]}>
                         <FontAwesome5 name={g.icon} size={18} color={g.color} />
                      </View>
                      <Text style={styles.muscleName}>{g.name}</Text>
                   </TouchableOpacity>
                ))}
             </ScrollView>

             {/* ── Elite Disciplne Plan ── */}
             <Card C={C}>
                <SectionHeader title="Weekly Discipline Plan" icon="calendar-check" C={C} />
                <View style={styles.dayGrid}>
                   {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <View key={i} style={styles.dayCol}>
                         <Text style={styles.dayInitial}>{d}</Text>
                         <View style={[styles.dayTask, { borderColor: i === new Date().getDay() - 1 ? C.amber : 'transparent' }]}>
                            <Text style={styles.dayTaskText}>{ROUTINES[bmiStatus.label]?.days[i]}</Text>
                         </View>
                      </View>
                   ))}
                </View>
                <View style={styles.planDetails}>
                   <Text style={styles.planFocus}>Current Focus: {ROUTINES[bmiStatus.label]?.focus}</Text>
                   <View style={styles.planTips}>
                      {ROUTINES[bmiStatus.label]?.suggestions.map((s, i) => (
                         <View key={i} style={styles.tipRow}>
                            <Ionicons name="flash-sharp" size={14} color={C.amber} />
                            <Text style={styles.tipText}>{s}</Text>
                         </View>
                      ))}
                   </View>
                </View>
             </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
             {/* ── Nutrition Stats ── */}
             <Card C={C}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                   <View>
                      <Text style={styles.metricLabel}>Basal Metabolic Rate</Text>
                      <Text style={[styles.metricValue, { color: C.amber }]}>{Math.round(bmr)} kcal</Text>
                   </View>
                   <MaterialCommunityIcons name="lightning-bolt" size={40} color={C.amber} />
                </View>
                <View style={{ height: 16 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                   <View>
                      <Text style={styles.metricLabel}>Target Protein</Text>
                      <Text style={[styles.metricValue, { color: C.amber }]}>{Math.round(dailyProtein)}g</Text>
                   </View>
                   <MaterialCommunityIcons name="food-apple" size={40} color={C.amber} />
                </View>
                <Text style={styles.nutritionDesc}>
                   Bio-metrics synced: {settings.workout.gender} | age {settings.workout.age} | weight {settings.workout.weight}kg
                </Text>
             </Card>

             <View style={{ height: 16 }} />

             {/* ── Fuel Sources ── */}
             <SectionHeader title="Elite Fuel Sources" icon="nutrition" C={C} />
             <View style={styles.foodGrid}>
                {FOODS.map(f => (
                   <View key={f.name} style={styles.foodCard}>
                      <Text style={styles.foodName}>{f.name}</Text>
                      <Text style={styles.foodProtein}>{f.protein}g Protein</Text>
                      <Text style={styles.foodUnit}>{f.unit}</Text>
                      <Text style={styles.foodCal}>{f.cal} kcal</Text>
                   </View>
                ))}
             </View>

             <View style={{ height: 16 }} />

             <Card C={C} style={{ backgroundColor: 'rgba(50,200,100,0.05)' }}>
                <SectionHeader title="Hydration Elite" icon="water" C={C} />
                <Text style={styles.tipText}>Drink at least 3.5 liters of water daily to maintain cognitive and physical peak performance.</Text>
             </Card>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#A0A0B0' },
  metricLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#A0A0B0' },
  metricValue: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  inputGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#A0A0B0', marginBottom: 6 },
  numericInput: { height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, color: '#FFFFFF', paddingHorizontal: 12, fontSize: 16, fontWeight: '700' },
  genderToggle: { flexDirection: 'row', gap: 8, height: 44 },
  genderBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  genderBtnActive: { backgroundColor: 'rgba(255,176,0,0.2)', borderColor: 'rgba(255,176,0,0.5)' },
  genderBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#A0A0B0' },
  muscleBtn: { alignItems: 'center', marginRight: 20 },
  muscleIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  muscleName: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  dayGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCol: { alignItems: 'center', flex: 1 },
  dayInitial: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#A0A0B0', marginBottom: 8 },
  dayTask: { width: '90%', paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, alignItems: 'center' },
  dayTaskText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#FFFFFF', textAlign: 'center' },
  planDetails: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
  planFocus: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  planTips: { marginTop: 10, gap: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#A0A0B0', lineHeight: 18 },
  nutritionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#A0A0B0', marginTop: 8 },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  foodCard: { width: (width - 42) / 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  foodName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  foodProtein: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.dark.amber, marginTop: 4 },
  foodUnit: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#A0A0B0' },
  foodCal: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#64FFDA', marginTop: 4 },
});
