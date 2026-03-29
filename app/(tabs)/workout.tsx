import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import React, { useState, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Dimensions,
  Animated,
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
    suggestions: ["Heavy Compounds (4-6 reps)", "Limit Cardio to 1x/wk", "Eat 1.2g Protein/lb"],
    days: ["Push", "Pull", "Legs", "Rest", "Upper", "Lower", "Rest"]
  },
  Healthy: {
    label: "Athletic Definition",
    focus: "Versatile Strength & Endurance",
    suggestions: ["Hypertrophy (8-12 reps)", "HIIT Cardio 2x/week", "Mobility Drills daily"],
    days: ["Strength", "Endurance", "Active Rec", "Strength", "HIIT", "Long Run", "Rest"]
  },
  Overweight: {
    label: "Elite Fat Incinerator",
    focus: "Caloric Deficit & High Intensity",
    suggestions: ["High Volume (15-20 reps)", "Steady State Cardio", "Zero Liquid Calories"],
    days: ["Circuit", "Walk 10k", "Circuit", "Yoga", "Swimming", "Long Walk", "Rest"]
  },
  Obese: {
    label: "Foundation Rebuild",
    focus: "Low Impact & Sustainable Flow",
    suggestions: ["Walking (5k steps/day)", "Joint Care Mobility", "Intermittent Fasting"],
    days: ["Walk", "Stretch", "Walk", "Pool", "Walk", "Low Impact", "Rest"]
  }
};

const FOODS = [
  { name: "Egg", protein: 6, unit: "1 large", cal: 70 },
  { name: "Chicken", protein: 31, unit: "100g", cal: 165 },
  { name: "Lentils", protein: 9, unit: "1/2 cup", cal: 115 },
  { name: "Beef", protein: 26, unit: "100g", cal: 250 },
  { name: "Milk", protein: 8, unit: "1 glass", cal: 146 },
  { name: "Yogurt", protein: 10, unit: "1 cup", cal: 100 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, C }: { icon: string; title: string; subtitle?: string; C: any }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, shadowColor: C.amber, shadowOpacity: 0.1, shadowRadius: 10 }}>
          <MaterialCommunityIcons name={icon as any} size={20} color={C.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 2 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

function Card({ children, style, C, glowColor }: { children: React.ReactNode; style?: object; C: any; glowColor?: string }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: glowColor ? glowColor + '50' : C.border, overflow: 'hidden' }, style]}>
      {glowColor && (
        <View style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, borderRadius: 50, backgroundColor: glowColor, opacity: 0.1, transform: [{ scale: 2 }] }} />
      )}
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
  
  // Mifflin-St Jeor
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
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }}
      >
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
           <Text style={{ fontSize: 34, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -0.5 }}>Elite Physical</Text>
           <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 6, lineHeight: 22 }}>High-performance body engineering protocols.</Text>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabContainer}>
           <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setCalcMode("bmi"); }} style={[styles.tab, calcMode === "bmi" && styles.tabActive]}>
              <Text style={[styles.tabText, calcMode === "bmi" && { color: "#FFF" }]}>Body Analysis</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setCalcMode("nutrition"); }} style={[styles.tab, calcMode === "nutrition" && styles.tabActive]}>
              <Text style={[styles.tabText, calcMode === "nutrition" && { color: "#FFF" }]}>Nutrition Fuel</Text>
           </TouchableOpacity>
        </View>

        {calcMode === "bmi" ? (
          <View style={{ paddingHorizontal: 16 }}>
             {/* ── BMI Stats ── */}
             <Card C={C} glowColor={bmiStatus.color}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View>
                      <Text style={styles.metricLabel}>Neural BMI Index</Text>
                      <Text style={[styles.metricValue, { color: bmiStatus.color }]}>{bmi.toFixed(1)}</Text>
                   </View>
                   <View style={[styles.badge, { backgroundColor: bmiStatus.color + "20", borderColor: bmiStatus.color + "50", borderWidth: 1 }]}>
                      <Text style={{ color: bmiStatus.color, fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.5 }}>{bmiStatus.label}</Text>
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
                            <Text style={[styles.genderBtnText, settings.workout.gender === "male" && { color: C.amber }]}>M</Text>
                         </TouchableOpacity>
                         <TouchableOpacity 
                           onPress={() => updateWorkout({ gender: "female" })}
                           style={[styles.genderBtn, settings.workout.gender === "female" && styles.genderBtnActive]}
                         >
                            <Text style={[styles.genderBtnText, settings.workout.gender === "female" && { color: C.amber }]}>F</Text>
                         </TouchableOpacity>
                      </View>
                   </View>
                </View>
             </Card>

             <View style={{ height: 20 }} />

             {/* ── Muscle Focus ── */}
             <SectionHeader title="Target Optimization" icon="human" C={C} />
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ paddingHorizontal: 4 }}>
                {MUSCLE_GROUPS.map(g => (
                   <TouchableOpacity key={g.id} style={styles.muscleBtn}>
                      <View style={[styles.muscleIcon, { backgroundColor: g.color + '15', borderColor: g.color + '40', borderWidth: 1 }]}>
                         <FontAwesome5 name={g.icon} size={20} color={g.color} />
                      </View>
                      <Text style={styles.muscleName}>{g.name}</Text>
                   </TouchableOpacity>
                ))}
             </ScrollView>

             {/* ── Elite Discipline Plan ── */}
             <Card C={C} glowColor={C.amber}>
                <SectionHeader title="Weekly Discipline Plan" icon="calendar-check" C={C} />
                <View style={styles.dayGrid}>
                   {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
                      const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                      return (
                         <View key={i} style={styles.dayCol}>
                            <Text style={[styles.dayInitial, isToday && { color: C.amber, fontFamily: "Inter_700Bold" }]}>{d}</Text>
                            <View style={[styles.dayTask, { borderColor: isToday ? C.amber : 'rgba(255,255,255,0.05)', backgroundColor: isToday ? 'rgba(255,176,0,0.1)' : 'rgba(255,255,255,0.02)' }]}>
                               <Text style={[styles.dayTaskText, isToday && { color: C.amber }]}>{ROUTINES[bmiStatus.label]?.days[i]}</Text>
                            </View>
                         </View>
                      );
                   })}
                </View>
                <View style={styles.planDetails}>
                   <Text style={styles.planFocus}>Current Focus: <Text style={{ color: C.amber }}>{ROUTINES[bmiStatus.label]?.focus}</Text></Text>
                   <View style={styles.planTips}>
                      {ROUTINES[bmiStatus.label]?.suggestions.map((s, i) => (
                         <View key={i} style={styles.tipRow}>
                            <Ionicons name="flash-sharp" size={16} color={C.amber} style={{ marginTop: 2 }} />
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
             <Card C={C} glowColor={C.amber}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                   <View>
                      <Text style={styles.metricLabel}>Basal Metabolic Rate</Text>
                      <Text style={[styles.metricValue, { color: C.amber }]}>{Math.round(bmr)} <Text style={{ fontSize: 16 }}>kcal</Text></Text>
                   </View>
                   <MaterialCommunityIcons name="lightning-bolt" size={48} color={C.amber} style={{ opacity: 0.8 }} />
                </View>
                <View style={{ height: 24, paddingHorizontal: 10 }}>
                   <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                   <View>
                      <Text style={styles.metricLabel}>Target Protein Goal</Text>
                      <Text style={[styles.metricValue, { color: C.amber }]}>{Math.round(dailyProtein)}<Text style={{ fontSize: 20 }}>g</Text></Text>
                   </View>
                   <MaterialCommunityIcons name="food-apple" size={44} color={C.amber} style={{ opacity: 0.8 }} />
                </View>
                <Text style={styles.nutritionDesc}>
                   Bio-metrics synced: {settings.workout.gender.toUpperCase()} | Age {settings.workout.age} | {settings.workout.weight}kg
                </Text>
             </Card>

             <View style={{ height: 24 }} />

             {/* ── Fuel Sources ── */}
             <SectionHeader title="Elite Fuel Sources" icon="nutrition" C={C} />
             <View style={styles.foodGrid}>
                {FOODS.map(f => (
                   <View key={f.name} style={styles.foodCard}>
                      <Text style={styles.foodName}>{f.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                         <Text style={styles.foodProtein}>{f.protein}g Protein</Text>
                         <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#555', marginHorizontal: 6 }} />
                         <Text style={styles.foodCal}>{f.cal} kcal</Text>
                      </View>
                      <Text style={styles.foodUnit}>{f.unit}</Text>
                   </View>
                ))}
             </View>

             <View style={{ height: 20 }} />

             <Card C={C} style={{ backgroundColor: 'rgba(50,200,100,0.05)', borderColor: 'rgba(50,200,100,0.2)' }} glowColor="#32C864">
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
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#808090', letterSpacing: 0.5 },
  metricLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#A0A0B0', marginBottom: 4 },
  metricValue: { fontSize: 36, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  inputGrid: { flexDirection: 'row', gap: 16, marginTop: 20 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#A0A0B0', marginBottom: 8 },
  numericInput: { height: 48, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, color: '#FFFFFF', paddingHorizontal: 16, fontSize: 18, fontFamily: 'Inter_700Bold', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  genderToggle: { flexDirection: 'row', gap: 8, height: 48 },
  genderBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  genderBtnActive: { backgroundColor: 'rgba(255,176,0,0.1)', borderColor: 'rgba(255,176,0,0.4)' },
  genderBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#808090' },
  muscleBtn: { alignItems: 'center', marginRight: 24 },
  muscleIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  muscleName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  dayGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  dayCol: { alignItems: 'center', flex: 1 },
  dayInitial: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#808090', marginBottom: 8 },
  dayTask: { width: '92%', paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', height: 40 },
  dayTaskText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#A0A0B0', textAlign: 'center' },
  planDetails: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
  planFocus: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  planTips: { marginTop: 12, gap: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#A0A0B0', lineHeight: 20, flex: 1 },
  nutritionDesc: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#606070', marginTop: 16, textAlign: 'center' },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  foodCard: { width: (width - 44) / 2, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  foodName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  foodProtein: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.dark.amber },
  foodUnit: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#808090', marginTop: 4 },
  foodCal: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64FFDA' },
});
