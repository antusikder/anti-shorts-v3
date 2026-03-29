import React, { useState } from "react";
import {
  View, ScrollView, Text, TouchableOpacity, StyleSheet,
  Switch, TextInput, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSettings } from "@/context/SettingsContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useMindset } from "@/context/MindsetContext";
import { C } from "@/constants/colors";
import Constants from "expo-constants";

const CARD_RADIUS = 20;

function Section({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.section, style]}>{children}</View>;
}

function SettingsRow({
  icon, color, label, sub, right, onPress,
}: {
  icon: string; color: string; label: string; sub?: string;
  right?: React.ReactNode; onPress?: () => void;
}) {
  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: color + "22" }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right ?? (onPress ? <MaterialCommunityIcons name="chevron-right" size={18} color={C.textMuted} /> : null)}
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>
  ) : (
    content
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function PinEntryModal({ visible, onSuccess, onCancel }: {
  visible: boolean; onSuccess: () => void; onCancel: () => void;
}) {
  const { mindset } = useMindset();
  const [input, setInput] = useState("");

  const handleDigit = (d: string) => {
    const next = input + d;
    if (next.length > 4) return;
    setInput(next);
    if (next.length === 4) {
      if (next === mindset.pin) {
        setInput("");
        onSuccess();
      } else {
        setInput("");
        Alert.alert("Wrong PIN");
      }
    }
  };

  const dots = Array(4).fill(0).map((_, i) => (
    <View key={i} style={[styles.pinDot, input.length > i && styles.pinDotFilled]} />
  ));

  const pad = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  if (!visible) return null;

  return (
    <View style={styles.pinOverlay}>
      <View style={styles.pinCard}>
        <Text style={styles.pinTitle}>Enter PIN</Text>
        <View style={styles.pinDots}>{dots}</View>
        <View style={styles.pinGrid}>
          {pad.map((d, i) => (
            d === "" ? <View key={i} style={styles.pinKeyEmpty} /> :
            <TouchableOpacity key={i} onPress={() => d === "⌫" ? setInput(p => p.slice(0, -1)) : handleDigit(d)} style={styles.pinKey}>
              <Text style={styles.pinKeyText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.pinCancel}>
          <Text style={styles.pinCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, resetStats } = useSettings();
  const { workout, updateSettings: updateWorkoutSettings } = useWorkout();
  const { mindset, setPin } = useMindset();

  const [newPin, setNewPin] = useState("");
  const [settingPin, setSettingPin] = useState(false);
  const appVersion = Constants.expoConfig?.version ?? "4.1.3";

  const wSettings = workout.settings;

  const handleResetStats = () => {
    Alert.alert("Reset Stats", "This will clear all today's blocked counts. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetStats },
    ]);
  };

  const handleSetPin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
      return;
    }
    setPin(newPin);
    setNewPin("");
    setSettingPin(false);
    Alert.alert("PIN Set", "App lock is now active.");
  };

  const handleRemovePin = () => {
    Alert.alert("Remove PIN", "This will disable app lock.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setPin(null) },
    ]);
  };

  return (
    <LinearGradient colors={["#07060F", "#0D0B1E", "#07060F"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Profile & Fitness */}
          <Text style={styles.sectionLabel}>Fitness Profile</Text>
          <Section>
            <SettingsRow
              icon="human-male-height"
              color={C.blue}
              label="Height"
              sub={`${wSettings.height} cm`}
              onPress={() => Alert.prompt("Height (cm)", "", (val) => val && updateWorkoutSettings({ height: parseInt(val) || wSettings.height }))}
            />
            <Divider />
            <SettingsRow
              icon="weight"
              color={C.green}
              label="Weight"
              sub={`${wSettings.weight} kg`}
              onPress={() => Alert.prompt("Weight (kg)", "", (val) => val && updateWorkoutSettings({ weight: parseFloat(val) || wSettings.weight }))}
            />
            <Divider />
            <SettingsRow
              icon="cake-variant-outline"
              color={C.amber}
              label="Age"
              sub={`${wSettings.age} years`}
              onPress={() => Alert.prompt("Age", "", (val) => val && updateWorkoutSettings({ age: parseInt(val) || wSettings.age }))}
            />
            <Divider />
            <SettingsRow
              icon="gender-male-female"
              color={C.purple}
              label="Gender"
              sub={wSettings.gender === "male" ? "Male" : "Female"}
              onPress={() => Alert.alert("Select Gender", "", [
                { text: "Male", onPress: () => updateWorkoutSettings({ gender: "male" }) },
                { text: "Female", onPress: () => updateWorkoutSettings({ gender: "female" }) },
                { text: "Cancel", style: "cancel" },
              ])}
            />
            <Divider />
            <SettingsRow
              icon="run"
              color={C.cyan}
              label="Activity Level"
              sub={wSettings.activityLevel.charAt(0).toUpperCase() + wSettings.activityLevel.slice(1)}
              onPress={() => Alert.alert("Activity Level", "", [
                { text: "Sedentary", onPress: () => updateWorkoutSettings({ activityLevel: "sedentary" }) },
                { text: "Light", onPress: () => updateWorkoutSettings({ activityLevel: "light" }) },
                { text: "Moderate", onPress: () => updateWorkoutSettings({ activityLevel: "moderate" }) },
                { text: "Active", onPress: () => updateWorkoutSettings({ activityLevel: "active" }) },
                { text: "Athlete", onPress: () => updateWorkoutSettings({ activityLevel: "athlete" }) },
                { text: "Cancel", style: "cancel" },
              ])}
            />
          </Section>

          {/* Security */}
          <Text style={styles.sectionLabel}>Security</Text>
          <Section>
            <SettingsRow
              icon="lock-outline"
              color={C.amber}
              label="App PIN Lock"
              sub={mindset.pin ? "Enabled — tap to change" : "Not set"}
              onPress={() => setSettingPin(!settingPin)}
            />
            {settingPin && (
              <View style={styles.pinInputRow}>
                <TextInput
                  style={styles.pinInput}
                  placeholder="Enter new 4-digit PIN"
                  placeholderTextColor={C.textMuted}
                  value={newPin}
                  onChangeText={(v) => setNewPin(v.replace(/\D/g, "").slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
                <TouchableOpacity onPress={handleSetPin} style={styles.setPinBtn}>
                  <Text style={styles.setPinBtnText}>Set</Text>
                </TouchableOpacity>
              </View>
            )}
            {mindset.pin && (
              <>
                <Divider />
                <SettingsRow icon="lock-remove-outline" color={C.danger} label="Remove PIN" onPress={handleRemovePin} />
              </>
            )}
          </Section>

          {/* Data */}
          <Text style={styles.sectionLabel}>Data</Text>
          <Section>
            <SettingsRow
              icon="refresh"
              color={C.danger}
              label="Reset Today's Stats"
              sub="Clears blocked counts for today"
              onPress={handleResetStats}
            />
          </Section>

          {/* About */}
          <Text style={styles.sectionLabel}>About</Text>
          <Section>
            <SettingsRow icon="shield-crown" color={C.amber} label="Fresh Mind Elite" sub={`Version ${appVersion}`} />
            <Divider />
            <SettingsRow
              icon="github"
              color={C.textMuted}
              label="Open Source"
              sub="Built with Expo React Native"
              onPress={() => Linking.openURL("https://github.com")}
            />
          </Section>

          {/* Tip Jar */}
          <View style={styles.tipCard}>
            <LinearGradient colors={[C.amberGlow, "transparent"]} style={StyleSheet.absoluteFill} />
            <Text style={styles.tipEmoji}>☕</Text>
            <Text style={styles.tipTitle}>Buy Me a Coffee</Text>
            <Text style={styles.tipSub}>
              This app took months of effort to build. If it helps you focus, consider sending a tip!
            </Text>
            <View style={styles.tipMethods}>
              <View style={styles.tipMethod}>
                <Text style={styles.tipMethodLabel}>bKash / Nagad</Text>
                <Text style={styles.tipMethodValue}>01XXXXXXXXXX</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert("Thank You!", "Your support means everything! 🙏")}
              style={styles.tipBtn}
            >
              <Text style={styles.tipBtnText}>❤️ Say Thanks</Text>
            </TouchableOpacity>
          </View>

          {/* Credits */}
          <View style={styles.creditsCard}>
            <Text style={styles.creditsTitle}>Credits</Text>
            <Text style={styles.creditsText}>
              Designed & developed with care.{"\n"}
              Powered by Expo, React Native, and the open source community.{"\n\n"}
              Special thanks to everyone who provided feedback and helped shape Fresh Mind Elite.
            </Text>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text },
  scroll: { paddingHorizontal: 16 },

  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 16 },
  section: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: CARD_RADIUS, marginBottom: 4, overflow: "hidden" },

  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.text },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  pinInputRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: C.border },
  pinInput: { flex: 1, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, fontFamily: "Inter_400Regular", fontSize: 18, color: C.text, textAlign: "center", letterSpacing: 8 },
  setPinBtn: { backgroundColor: C.amber + "22", borderWidth: 1, borderColor: C.amber + "55", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  setPinBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.amber },

  // PIN overlay
  pinOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center", zIndex: 100 },
  pinCard: { backgroundColor: "#0D0B1E", borderRadius: 24, padding: 24, width: "80%", alignItems: "center", borderWidth: 1, borderColor: C.border },
  pinTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, marginBottom: 24 },
  pinDots: { flexDirection: "row", gap: 14, marginBottom: 24 },
  pinDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.bgElevated, borderWidth: 2, borderColor: C.textMuted },
  pinDotFilled: { backgroundColor: C.amber, borderColor: C.amber },
  pinGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 16 },
  pinKey: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  pinKeyEmpty: { width: 70, height: 70 },
  pinKeyText: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.text },
  pinCancel: { paddingVertical: 8 },
  pinCancelText: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.textMuted },

  // Tip Jar
  tipCard: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.amber + "33", borderRadius: CARD_RADIUS, padding: 20, marginTop: 16, alignItems: "center", overflow: "hidden" },
  tipEmoji: { fontSize: 36, marginBottom: 8 },
  tipTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.amber, marginBottom: 6 },
  tipSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  tipMethods: { gap: 8, marginBottom: 16, width: "100%" },
  tipMethod: { backgroundColor: C.bgElevated, borderRadius: 12, padding: 12, alignItems: "center" },
  tipMethodLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted },
  tipMethodValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text, marginTop: 4 },
  tipBtn: { backgroundColor: C.amber + "22", borderWidth: 1, borderColor: C.amber + "55", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  tipBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.amber },

  // Credits
  creditsCard: { marginTop: 16, padding: 20, backgroundColor: C.bgCard, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: C.border },
  creditsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, marginBottom: 10 },
  creditsText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, lineHeight: 20 },
});
