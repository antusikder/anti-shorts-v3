import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useSettings, FeedMode } from "@/context/SettingsContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, C }: { icon: React.ReactNode; title: string; subtitle?: string; C: any }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border }}>
          {icon}
        </View>
        <View>
          <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: C.text }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 }}>{subtitle}</Text>}
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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
      {icon && (
        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center" }}>
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: disabled ? C.textMuted : C.text }}>{label}</Text>
        {description && <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 }}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { Haptics.selectionAsync(); onValueChange(v); }}
        disabled={disabled}
        trackColor={{ false: "#333", true: C.amber + "88" }}
        thumbColor={value ? C.amber : "#f4f3f4"}
      />
    </View>
  );
}

function Card({ children, style, C }: { children: React.ReactNode; style?: object; C: any }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 24, marginHorizontal: 16, padding: 18, borderWidth: 1, borderColor: C.border }, style]}>
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
    updateYoutube, updateFacebook, updateInstagram, updateTiktok,
    updateSkipAds, updateScanSpeed, updateFeedMode, resetStats
  } = useSettings();

  const handleReset = () => {
    Alert.alert("Reset Stats", "Are you sure you want to clear all your progress stats?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetStats }
    ]);
  };

  return (
    <LinearGradient colors={["#0D0B1E", "#05050A"]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }}
      >
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
           <Text style={{ fontSize: 32, fontFamily: "Inter_700Bold", color: "#FFFFFF" }}>Access Control</Text>
           <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 4 }}>Fine-tune your Elite digital shield</Text>
        </View>

        {/* ── YouTube Control ── */}
        <Card C={C}>
          <SectionHeader title="YouTube Mastery" icon={<MaterialCommunityIcons name="youtube" size={18} color={C.youtube} />} C={C} />
          <ToggleItem C={C} label="Active Protection" description="Enable scanning on YouTube" value={settings.youtube.enabled} onValueChange={(v) => updateYoutube("enabled", v)} />
          <View style={styles.divider} />
          <ToggleItem C={C} label="Eliminate Shorts" description="Remove Shorts shelves from feed" value={settings.youtube.removeShorts} onValueChange={(v) => updateYoutube("removeShorts", v)} disabled={!settings.youtube.enabled} />
          <View style={styles.divider} />
          <ToggleItem C={C} label="Auto-Skip Ads" description="Bypass video ads instantly" value={settings.skipAds} onValueChange={updateSkipAds} disabled={!settings.youtube.enabled} />
          <View style={styles.divider} />
          <ToggleItem C={C} label="Subs Only Filter" description="Nudge toward followed channels" value={settings.youtube.subscribedOnly} onValueChange={(v) => updateYoutube("subscribedOnly", v)} disabled={!settings.youtube.enabled} />
        </Card>

        <View style={{ height: 16 }} />

        {/* ── Facebook Control ── */}
        <Card C={C}>
          <SectionHeader title="Facebook Guard" icon={<Feather name="facebook" size={18} color={C.facebook} />} C={C} />
          <ToggleItem C={C} label="Meta Protection" value={settings.facebook.enabled} onValueChange={(v) => updateFacebook("enabled", v)} />
          <View style={styles.divider} />
          <ToggleItem C={C} label="Remove Reels" value={settings.facebook.removeReels} onValueChange={(v) => updateFacebook("removeReels", v)} disabled={!settings.facebook.enabled} />
        </Card>

        <View style={{ height: 16 }} />

        {/* ── Algorithm Shaper ── */}
        <Card C={C}>
          <SectionHeader title="Smart Feed Engine" icon={<MaterialCommunityIcons name="brain" size={18} color={C.amber} />} C={C} />
          <Text style={styles.description}>Shape your social media algorithm by automatically preferring high-quality content categories.</Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            {FEED_MODES.map((mode) => {
              const selected = settings.feedMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  onPress={() => { Haptics.selectionAsync(); updateFeedMode(mode.id); }}
                  style={[styles.modeItem, { borderColor: selected ? C.amber : C.border, backgroundColor: selected ? C.amber + '10' : 'transparent' }]}
                >
                  <Text style={{ fontSize: 20 }}>{mode.emoji}</Text>
                  <View style={{ flex: 1 }}>
                     <Text style={[styles.modeLabel, { color: selected ? C.amber : C.text }]}>{mode.label}</Text>
                     <Text style={styles.modeDesc}>{mode.desc}</Text>
                  </View>
                  {selected && <MaterialCommunityIcons name="check-circle" size={18} color={C.amber} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={{ height: 16 }} />

        {/* ── Support & Reset ── */}
        <Card C={C}>
          <TouchableOpacity onPress={handleReset} style={styles.actionRow}>
             <MaterialCommunityIcons name="refresh" size={20} color={C.danger} />
             <Text style={[styles.actionText, { color: C.danger }]}>Reset Progress Stats</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow}>
             <MaterialCommunityIcons name="coffee" size={20} color={C.amber} />
             <Text style={styles.actionText}>Buy Me a Coffee</Text>
          </TouchableOpacity>
          <Text style={styles.supportInfo}>bKash/Nagad: +8801581872622</Text>
        </Card>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 4 },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A0A0B0", lineHeight: 20 },
  modeItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  modeLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  modeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0A0B0" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  actionText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  supportInfo: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: -4, marginLeft: 32 },
});
