import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import Colors from "@/constants/colors";
import { useSettings, FeedMode } from "@/context/SettingsContext";

const { width } = Dimensions.get("window");

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, C }: { icon: React.ReactNode; title: string; subtitle?: string; C: any }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, shadowColor: C.amber, shadowOpacity: 0.1, shadowRadius: 10 }}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: C.text }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

function ToggleItem({ label, description, value, onValueChange, icon, disabled, C }: {
  label: string; description?: string; value: boolean; onValueChange: (v: boolean) => void;
  icon?: React.ReactNode; disabled?: boolean; C: any;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10, opacity: disabled ? 0.5 : 1 }}>
      {icon && (
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center" }}>
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text }}>{label}</Text>
        {description && <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 3 }}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { Haptics.selectionAsync(); onValueChange(v); }}
        disabled={disabled}
        trackColor={{ false: "rgba(255,255,255,0.1)", true: C.amber + "66" }}
        thumbColor={value ? C.amber : "#f4f3f4"}
        ios_backgroundColor="rgba(255,255,255,0.1)"
      />
    </View>
  );
}

function Card({ children, style, C, glowColor }: { children: React.ReactNode; style?: object; C: any; glowColor?: string }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 24, marginHorizontal: 16, padding: 20, borderWidth: 1, borderColor: glowColor ? glowColor + '50' : C.border, overflow: 'hidden' }, style]}>
      {glowColor && (
        <View style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, borderRadius: 50, backgroundColor: glowColor, opacity: 0.1, transform: [{ scale: 2 }] }} />
      )}
      {children}
    </View>
  );
}

const FEED_MODES: { id: FeedMode; label: string; emoji: string; desc: string }[] = [
  { id: "off", label: "Off", emoji: "🔕", desc: "Standard feed" },
  { id: "knowledge", label: "Knowledge", emoji: "📚", desc: "Focus on Science & History" },
  { id: "study", label: "Study", emoji: "🎓", desc: "Tutorials & Coding" },
  { id: "productive", label: "Productive", emoji: "⚡", desc: "Tech & Business" },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AccessScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const {
    settings,
    updateYoutube, updateFacebook,
    updateSkipAds, updateFeedMode, resetStats, updatePrivacy
  } = useSettings();

  const [userName, setUserName] = useState("Elite Member");

  useEffect(() => {
    AsyncStorage.getItem("@productive:user_name").then(name => {
      if (name) setUserName(name);
    });
  }, []);

  const handleReset = () => {
    Alert.alert("Reset Stats", "Are you sure you want to clear all your progress stats?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetStats }
    ]);
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await AsyncStorage.removeItem("@productive:user_token");
        router.replace("/login");
      }}
    ]);
  };

  const togglePin = () => {
    if (settings.privacy.pin) {
       Alert.alert("Disable Lock", "Remove PIN protection?", [
         { text: "Cancel", style: "cancel" },
         { text: "Remove", style: "destructive", onPress: () => updatePrivacy("pin", null) }
       ]);
    } else {
       Alert.prompt("Set PIN", "Enter a 4-digit code to lock Fresh Mind", (pin) => {
         if (pin.length === 4 && /^\d+$/.test(pin)) {
           updatePrivacy("pin", pin);
           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
         } else {
           Alert.alert("Error", "PIN must be strictly 4 numbers.");
         }
       });
    }
  };

  return (
    <LinearGradient colors={["#0D0B1E", "#05050A"]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }}
      >
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
           <Text style={{ fontSize: 34, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -0.5 }}>Access Control</Text>
           <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 6, lineHeight: 22 }}>Manage your neural shields and elite configurations.</Text>
        </View>

        {/* ── User Profile Card ── */}
        <Card C={C} style={{ marginBottom: 20 }}>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
             <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,176,0,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.amber }}>
                <MaterialCommunityIcons name="account" size={36} color={C.amber} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFF" }}>{userName}</Text>
                <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: C.amber, marginTop: 2 }}>Google Authenticated</Text>
             </View>
             <TouchableOpacity style={{ padding: 10, backgroundColor: 'rgba(255,176,0,0.1)', borderRadius: 12 }} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={24} color={C.danger} />
             </TouchableOpacity>
           </View>
        </Card>

        {/* ── Security Card ── */}
        <Card C={C} style={{ marginBottom: 20 }}>
          <SectionHeader title="Security & Privacy" icon={<MaterialCommunityIcons name="shield-lock-outline" size={22} color={C.amber} />} C={C} />
          <TouchableOpacity onPress={togglePin} style={styles.actionRow}>
             <View style={{ flex: 1 }}>
                <Text style={styles.actionText}>{settings.privacy.pin ? "Change Shield PIN" : "Enable App Lock"}</Text>
                <Text style={styles.actionDesc}>Prevent unauthorized access to settings.</Text>
             </View>
             <MaterialCommunityIcons name={settings.privacy.pin ? "lock" : "lock-open-outline"} size={24} color={settings.privacy.pin ? C.amber : C.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* ── YouTube Control ── */}
        <Card C={C} style={{ marginBottom: 20 }}>
          <SectionHeader title="YouTube Mastery" icon={<MaterialCommunityIcons name="youtube" size={22} color={C.youtube} />} C={C} />
          <ToggleItem C={C} label="Active Protection" value={settings.youtube.enabled} onValueChange={(v) => updateYoutube("enabled", v)} />
          <View style={styles.divider} />
          <ToggleItem C={C} label="Eliminate Shorts" value={settings.youtube.removeShorts} onValueChange={(v) => updateYoutube("removeShorts", v)} disabled={!settings.youtube.enabled} />
          <View style={styles.divider} />
          <ToggleItem C={C} label="Auto-Skip Ads" value={settings.skipAds} onValueChange={updateSkipAds} disabled={!settings.youtube.enabled} />
          <View style={styles.divider} />
          <ToggleItem C={C} label="Subs Only Filter" value={settings.youtube.subscribedOnly} onValueChange={(v) => updateYoutube("subscribedOnly", v)} disabled={!settings.youtube.enabled} />
        </Card>

        {/* ── Facebook Control ── */}
        <Card C={C} style={{ marginBottom: 20 }}>
          <SectionHeader title="Meta Shield" icon={<Feather name="facebook" size={20} color={C.facebook} />} C={C} />
          <ToggleItem C={C} label="Active Protection" value={settings.facebook.enabled} onValueChange={(v) => updateFacebook("enabled", v)} />
          <View style={styles.divider} />
          <ToggleItem C={C} label="Eliminate Reels" value={settings.facebook.removeReels} onValueChange={(v) => updateFacebook("removeReels", v)} disabled={!settings.facebook.enabled} />
        </Card>

        {/* ── Algorithm Shaper ── */}
        <Card C={C} style={{ marginBottom: 20 }}>
          <SectionHeader title="Neural Feed Shaper" subtitle="Force algorithms into productive states." icon={<MaterialCommunityIcons name="brain" size={22} color={C.amber} />} C={C} />
          <View style={{ gap: 10, marginTop: 4 }}>
            {FEED_MODES.map((mode) => {
              const selected = settings.feedMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  onPress={() => { Haptics.selectionAsync(); updateFeedMode(mode.id); }}
                  style={[styles.modeItem, { borderColor: selected ? C.amber : 'rgba(255,255,255,0.05)', backgroundColor: selected ? 'rgba(255,176,0,0.08)' : 'rgba(255,255,255,0.02)' }]}
                >
                  <Text style={{ fontSize: 24 }}>{mode.emoji}</Text>
                  <View style={{ flex: 1 }}>
                     <Text style={[styles.modeLabel, { color: selected ? C.amber : C.text }]}>{mode.label}</Text>
                     <Text style={styles.modeDesc}>{mode.desc}</Text>
                  </View>
                  <View style={[styles.radio, selected && { borderColor: C.amber }]}>
                    {selected && <View style={[styles.radioFill, { backgroundColor: C.amber }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* ── Elite Premium / Support (Buy me a coffee redesign) ── */}
        <Card C={C} style={{ marginBottom: 20, paddingTop: 30, paddingBottom: 30 }} glowColor={C.amber}>
          <View style={{ alignItems: 'center' }}>
             <MaterialCommunityIcons name="crown" size={60} color={C.amber} style={{ marginBottom: 16 }} />
             <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 8 }}>Elite Platinum Pro</Text>
             <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#A0A0B0", textAlign: "center", lineHeight: 22, paddingHorizontal: 10, marginBottom: 24 }}>
               Support the development of Fresh Mind and unlock permanent mastery over your digital dopamine.
             </Text>

             <View style={styles.proFeatures}>
                <View style={styles.proFeatureRow}><Ionicons name="checkmark-circle" size={18} color={C.amber} /><Text style={styles.proFeatureText}>Unlimited Neural Scanning</Text></View>
                <View style={styles.proFeatureRow}><Ionicons name="checkmark-circle" size={18} color={C.amber} /><Text style={styles.proFeatureText}>Advanced Workout AI</Text></View>
                <View style={styles.proFeatureRow}><Ionicons name="checkmark-circle" size={18} color={C.amber} /><Text style={styles.proFeatureText}>Priority Feature Updates</Text></View>
             </View>

             <TouchableOpacity style={styles.proButton} onPress={() => Alert.alert("Join Elite Support", "Send your contributions to keep the project alive.\n\nbKash/Nagad: +8801581872622")}>
                <LinearGradient colors={["#FFA000", "#FFD54F"]} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.proButtonGradient}>
                   <Text style={styles.proButtonText}>Upgrade Now — $5/LIFETIME</Text>
                </LinearGradient>
             </TouchableOpacity>

             <Text style={styles.supportInfo}>bKash/Nagad Direct: <Text style={{ color: C.amber }}>+8801581872622</Text></Text>
          </View>
        </Card>

        {/* ── Danger Zone ── */}
        <Card C={C} style={{ marginBottom: 40 }}>
           <TouchableOpacity onPress={handleReset} style={styles.actionRow}>
              <View style={{ flex: 1 }}>
                 <Text style={[styles.actionText, { color: C.danger }]}>Clear all Progress Data</Text>
                 <Text style={styles.actionDesc}>This action cannot be undone.</Text>
              </View>
              <MaterialCommunityIcons name="delete-forever" size={24} color={C.danger} />
           </TouchableOpacity>
        </Card>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 8 },
  modeItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  modeLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#555', alignItems: 'center', justifyContent: 'center' },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  actionText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  actionDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 4 },
  proFeatures: { marginBottom: 24, alignSelf: 'stretch', paddingHorizontal: 20, gap: 10 },
  proFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  proFeatureText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#E0E0E0" },
  proButton: { alignSelf: 'stretch', shadowColor: "#FFB000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, marginBottom: 16 },
  proButtonGradient: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  proButtonText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#000" },
  supportInfo: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#808090" },
});
