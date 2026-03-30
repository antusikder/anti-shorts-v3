import React, { memo, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, AppState, AppStateStatus, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/context/SettingsContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";
import { C, R } from "@/constants/colors";

// ════════════════════════════════════════════════════════════════════════════
// SERVICE STATUS HERO
// ════════════════════════════════════════════════════════════════════════════

const ServiceHero = memo(() => {
  const { setServiceEnabled } = useSettings();
  const [active, setActive] = useState(false);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") check();
    });
    return () => sub.remove();
  }, []);

  const check = async () => {
    const enabled = await AccessibilityModule.isServiceEnabled();
    setActive(enabled);
    setServiceEnabled(enabled);
  };

  return (
    <TouchableOpacity
      style={[svc.card, active ? svc.cardOk : svc.cardBad]}
      onPress={() => {
        if (!active) AccessibilityModule.openAccessibilitySettings();
      }}
      activeOpacity={active ? 1 : 0.8}
    >
      <View style={svc.row}>
        <View style={[svc.icon, { backgroundColor: active ? C.amberBg : C.dangerBg }]}>
          <MaterialCommunityIcons
            name={active ? "shield-check" : "shield-alert"}
            size={24}
            color={active ? C.amber : C.danger}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={svc.title}>Neural Engine {active ? "Running" : "Offline"}</Text>
          <Text style={svc.sub}>
            {active ? "Multi-model scanner is enforcing limits." : "Tap to enable accessibility service."}
          </Text>
        </View>
        {active ? (
          <View style={svc.livePulse} />
        ) : (
          <MaterialCommunityIcons name="arrow-right" size={20} color={C.danger} />
        )}
      </View>
    </TouchableOpacity>
  );
});

const svc = StyleSheet.create({
  card: { borderRadius: R.card, padding: 18, marginBottom: 20, borderWidth: 1, backgroundColor: C.bgCard },
  cardOk: { borderColor: C.amberBorder },
  cardBad: { borderColor: C.dangerBorder },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text, marginBottom: 2 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSub },
  livePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success },
});

// ════════════════════════════════════════════════════════════════════════════
// MASTER CONTROLS
// ════════════════════════════════════════════════════════════════════════════

const ToggleRow = memo(({ label, desc, value, onValueChange, icon, indent }: {
  label: string; desc?: string; value: boolean; onValueChange: (v: boolean) => void;
  icon?: string; indent?: boolean;
}) => (
  <View style={[tc.wrapper, indent && { paddingLeft: 42 }]}>
    <View style={tc.row}>
      {icon && <MaterialCommunityIcons name={icon as any} size={20} color={C.amber} style={{ width: 26 }} />}
      <View style={{ flex: 1 }}>
        <Text style={tc.label}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { onValueChange(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        trackColor={{ false: "rgba(255,255,255,0.08)", true: C.amberBg }}
        thumbColor={value ? C.amber : C.textMuted}
      />
    </View>
    {desc && <Text style={[tc.desc, { paddingLeft: icon ? 36 : 0 }]}>{desc}</Text>}
  </View>
));

const MultiModelConfig = memo(() => {
  const { settings, updateMethodToggles, updateScanSpeed } = useSettings();

  const SpeedSelector = () => (
    <View style={tc.speedRow}>
      {(["balanced", "aggressive", "battery"] as const).map(speed => (
        <TouchableOpacity
          key={speed}
          style={[tc.speedBtn, settings.scanSpeed === speed && tc.speedBtnActive]}
          onPress={() => {
            updateScanSpeed(speed);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.8}
        >
          <Text style={[tc.speedText, settings.scanSpeed === speed && tc.speedTextActive]}>
            {speed.charAt(0).toUpperCase() + speed.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={tc.section}>
      <Text style={tc.sectionTitle}>Multi-Model Interceptors</Text>
      <View style={tc.card}>
        <ToggleRow
          icon="broom"
          label="Method 1: Shelf Sweeper"
          desc="Finds 'Shorts/Reels' containers and clicks 'Show less'."
          value={settings.method1_sweeper}
          onValueChange={(v) => updateMethodToggles("method1_sweeper", v)}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="target"
          label="Method 2: The Sniper"
          desc="Detects individual video nodes and clicks their specific menu."
          value={settings.method2_sniper}
          onValueChange={(v) => updateMethodToggles("method2_sniper", v)}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="vector-rectangle"
          label="Method 3: Geometric Analyst"
          desc="Detects vertical video frames natively via aspect ratio math."
          value={settings.method3_geometric}
          onValueChange={(v) => updateMethodToggles("method3_geometric", v)}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="keyboard-return"
          label="Method 4: Back-Bouncer"
          desc="Instantly bounces you out if you enter a Shorts/Reels tab/link."
          value={settings.method4_bouncer}
          onValueChange={(v) => updateMethodToggles("method4_bouncer", v)}
        />
      </View>

      <Text style={[tc.sectionTitle, { marginTop: 8 }]}>Engine Speed</Text>
      <View style={tc.card}>
         <SpeedSelector />
         <Text style={[tc.desc, { padding: 16, paddingTop: 0 }]}>
           Aggressive = 80ms (Very Fast). Balanced = 150ms. Battery = 300ms. Keep on balanced unless experiencing lag.
         </Text>
      </View>
    </View>
  );
});

const PlatformToggles = memo(() => {
  const { settings, updateYoutube, updateFacebook, updateInstagram, updateTiktok, updateMethodToggles, updateSystemEnabled, updateSkipAds } = useSettings();

  return (
    <View style={tc.section}>
      <Text style={tc.sectionTitle}>Target Platforms</Text>
      <View style={tc.card}>
        <ToggleRow
          icon="power" label="Master Shield" desc="Toggle entirely on/off."
          value={settings.systemEnabled} onValueChange={updateSystemEnabled}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="youtube" label="YouTube" value={settings.youtube.enabled}
          onValueChange={(v) => updateYoutube("enabled", v)}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="facebook" label="Facebook & Lite" value={settings.facebook.enabled}
          onValueChange={(v) => updateFacebook("enabled", v)}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="instagram" label="Instagram" value={settings.instagram.enabled}
          onValueChange={updateInstagram}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="music-note" label="TikTok" value={settings.tiktok.enabled}
          onValueChange={updateTiktok}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="web" label="Browser Shield" desc="Active URL inspection for YT/FB/IG reels."
          value={settings.browser_monitoring} onValueChange={(v) => updateMethodToggles("browser_monitoring", v)}
        />
        <View style={tc.divider} />
        <ToggleRow
          icon="fast-forward" label="Ad Skipper" desc="Auto-clicks 'Skip Ad' when visible."
          value={settings.skipAds} onValueChange={updateSkipAds}
        />
      </View>
    </View>
  );
});

const tc = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, overflow: "hidden" },
  wrapper: { paddingVertical: 14, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.text },
  desc: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSub, marginTop: 4, lineHeight: 18 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  speedRow: { flexDirection: "row", gap: 8, padding: 16 },
  speedBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: R.button, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border },
  speedBtnActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  speedText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSub },
  speedTextActive: { color: C.amber },
});

// ════════════════════════════════════════════════════════════════════════════
// ALGORITHM SHAPER
// ════════════════════════════════════════════════════════════════════════════

const SHAPER_CATEGORIES = [
  { id: "gaming", label: "Gaming", icon: "gamepad-variant" },
  { id: "gossip", label: "Gossip", icon: "account-multiple" },
  { id: "clickbait", label: "Clickbait", icon: "cursor-default-click" },
  { id: "pranks", label: "Pranks", icon: "emoticon-lol" },
  { id: "political", label: "Political", icon: "vote" },
  { id: "nsfw", label: "NSFW", icon: "eye-off" },
  { id: "mukbang", label: "Mukbang", icon: "food" },
  { id: "asmr", label: "ASMR", icon: "ear-hearing" },
];

const AlgorithmShaper = memo(() => {
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  useEffect(() => {
    if (activeCategories.length > 0) {
      AccessibilityModule.updateSettings({
        shaperCategories: activeCategories.join(","),
      } as any);
    } else {
      AccessibilityModule.updateSettings({
        shaperCategories: "",
      } as any);
    }
  }, [activeCategories]);

  const toggleCategory = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <View style={tc.section}>
      <Text style={tc.sectionTitle}>Algorithm Shaper</Text>
      <View style={[tc.card, { padding: 16 }]}>
        <Text style={[tc.desc, { marginTop: 0, marginBottom: 14 }]}>
          Scanner will aggressively flag matching feed items as "Not interested" to retrain your algorithms.
        </Text>
        <View style={as.grid}>
          {SHAPER_CATEGORIES.map(cat => {
            const active = activeCategories.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[as.chip, active && as.chipActive]}
                onPress={() => toggleCategory(cat.id)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={cat.icon as any} size={16} color={active ? C.amber : C.textMuted} />
                <Text style={[as.chipText, active && { color: C.amber }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const as = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.circle, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.amberBg, borderColor: C.amberBorder },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ShieldScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 28, color: C.text, letterSpacing: -0.5 }}>
              Neural Shield
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSub, marginTop: 4 }}>
              Configure the multi-model interception engine.
            </Text>
          </View>

          <ServiceHero />
          <MultiModelConfig />
          <PlatformToggles />
          <AlgorithmShaper />

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
});
