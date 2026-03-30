import React, { memo, useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "@/context/SettingsContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";
import { C, R, S } from "@/constants/colors";

// ════════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const SectionCard = memo(({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[sec.card, style]}>{children}</View>
));

const SectionHeader = memo(({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
  <View style={sec.header}>
    <View style={sec.iconBox}>
      <MaterialCommunityIcons name={icon as any} size={18} color={C.accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={sec.title}>{title}</Text>
      {subtitle && <Text style={sec.subtitle}>{subtitle}</Text>}
    </View>
  </View>
));

const sec = StyleSheet.create({
  card: {
    backgroundColor: C.bgCard, borderRadius: R.card,
    borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  iconBox: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text },
  subtitle: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted, marginTop: 1 },
});

const ToggleRow = memo(({ label, description, value, onChange, indent }: {
  label: string; description?: string; value: boolean;
  onChange: (v: boolean) => void; indent?: boolean;
}) => (
  <View style={[tr.row, indent && { paddingLeft: 12 }]}>
    <View style={{ flex: 1 }}>
      <Text style={tr.label}>{label}</Text>
      {description && <Text style={tr.desc}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={(v) => { Haptics.selectionAsync(); onChange(v); }}
      trackColor={{ false: "rgba(255,255,255,0.08)", true: C.accentBg }}
      thumbColor={value ? C.accent : C.textMuted}
      ios_backgroundColor="rgba(255,255,255,0.08)"
    />
  </View>
));

const tr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  label: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.text, marginBottom: 2 },
  desc: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted, lineHeight: 17 },
});

// ════════════════════════════════════════════════════════════════════════════
// SERVICE STATUS HERO
// ════════════════════════════════════════════════════════════════════════════

const ServiceStatus = memo(({ active, onTap }: { active: boolean; onTap: () => void }) => (
  <TouchableOpacity
    style={[sv.card, { borderColor: active ? C.accentBorder : C.dangerBorder }]}
    onPress={onTap}
    activeOpacity={0.88}
  >
    <View style={[sv.dot, { backgroundColor: active ? C.success : C.danger }]} />
    <View style={{ flex: 1 }}>
      <Text style={sv.title}>{active ? "Accessibility Service: ON" : "Accessibility Service: OFF"}</Text>
      <Text style={sv.desc}>{active ? "Protection is running in the background." : "Tap to grant accessibility permission."}</Text>
    </View>
    <MaterialCommunityIcons
      name={active ? "check-circle" : "alert-circle"}
      size={22}
      color={active ? C.success : C.danger}
    />
  </TouchableOpacity>
));

const sv = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.bgCard, borderRadius: R.card,
    borderWidth: 1, padding: 16, marginBottom: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text, marginBottom: 2 },
  desc: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted },
});

// ════════════════════════════════════════════════════════════════════════════
// STRICT MODE
// ════════════════════════════════════════════════════════════════════════════

const STRICT_APPS = [
  { pkg: "com.google.android.youtube", name: "YouTube", icon: "youtube" },
  { pkg: "com.facebook.katana",        name: "Facebook", icon: "facebook" },
  { pkg: "com.facebook.orca",          name: "Messenger", icon: "message-text" },
  { pkg: "com.whatsapp",               name: "WhatsApp", icon: "whatsapp" },
  { pkg: "com.instagram.android",      name: "Instagram", icon: "instagram" },
  { pkg: "com.android.chrome",         name: "Chrome", icon: "google-chrome" },
  { pkg: "com.zhiliaoapp.musically",   name: "TikTok", icon: "music-note" },
  { pkg: "com.reddit.frontpage",       name: "Reddit", icon: "reddit" },
];

const StrictModeSection = memo(({
  strictMode, setStrict, blockList, setBlockList,
}: {
  strictMode: boolean;
  setStrict: (v: boolean) => void;
  blockList: string[];
  setBlockList: (l: string[]) => void;
}) => {
  const handleStartStrict = () => {
    if (!strictMode) {
      Alert.alert(
        "Start Strict Mode",
        "Strict mode will block all checked apps for 45 minutes. You won't be able to turn it off early.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start 45 min", style: "destructive", onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setStrict(true); } },
        ]
      );
    } else {
      setStrict(false);
    }
  };

  const toggleApp = (pkg: string) => {
    Haptics.selectionAsync();
    setBlockList(
      blockList.includes(pkg)
        ? blockList.filter(p => p !== pkg)
        : [...blockList, pkg]
    );
  };

  return (
    <SectionCard>
      <SectionHeader icon="lock-clock" title="Strict Mode" subtitle="Block distracting apps for a set time" />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {STRICT_APPS.map(app => {
          const selected = blockList.includes(app.pkg);
          return (
            <TouchableOpacity
              key={app.pkg}
              style={[sm.chip, selected && sm.chipActive]}
              onPress={() => toggleApp(app.pkg)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={app.icon as any} size={14} color={selected ? C.accent : C.textMuted} />
              <Text style={[sm.chipText, selected && { color: C.accent }]}>{app.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[sm.button, strictMode && sm.buttonActive]}
        onPress={handleStartStrict}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name={strictMode ? "lock-open-variant" : "lock"}
          size={18} color={strictMode ? C.text : C.bg}
        />
        <Text style={[sm.buttonText, strictMode && { color: C.text }]}>
          {strictMode ? "End Strict Mode" : "Start Strict Mode (45 min)"}
        </Text>
      </TouchableOpacity>
    </SectionCard>
  );
});

const sm = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: R.circle,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.accentBg, borderColor: C.accentBorder },
  chipText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  button: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: R.button,
    backgroundColor: C.accent,
  },
  buttonActive: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderMid },
  buttonText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.bg },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function ShieldScreen() {
  const {
    settings, updateYoutube, updateFacebook, updateInstagram,
    updateSkipAds, updateSystemEnabled, setBlockActive, updateBlockList,
  } = useSettings();

  const [serviceActive, setServiceActive] = useState(false);
  const [strictMode, setStrictModeLocal] = useState(false);

  // Poll service status
  useEffect(() => {
    const check = async () => {
      const active = await AccessibilityModule.isServiceEnabled();
      setServiceActive(active);
    };
    check();
    const t = setInterval(check, 4000);
    return () => clearInterval(t);
  }, []);

  const handleStrictToggle = useCallback((enabled: boolean) => {
    const endTime = Date.now() + 45 * 60 * 1000;
    setStrictModeLocal(enabled);
    setBlockActive(enabled);
    AccessibilityModule.updateSettings({
      strictMode:   enabled,
      strictEndTime: enabled ? endTime : 0,
      strictPackages: settings.blockList.join(","),
    });
  }, [settings.blockList]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: S.pagePad, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingTop: 8, marginBottom: 20 }}>
            <Text style={pr.heading}>Shield</Text>
            <Text style={pr.subheading}>Content blocking & protection controls</Text>
          </View>

          {/* Service Status */}
          <ServiceStatus
            active={serviceActive}
            onTap={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              AccessibilityModule.openAccessibilitySettings();
            }}
          />

          {/* Master toggle */}
          <SectionCard>
            <SectionHeader icon="shield-crown" title="Master Shield" subtitle="Enable or disable all protection" />
            <ToggleRow
              label="System Protection"
              description="Master switch — controls everything"
              value={settings.systemEnabled}
              onChange={(v) => { updateSystemEnabled(v); AccessibilityModule.updateSettings({ enabled: v }); }}
            />
          </SectionCard>

          {/* YouTube */}
          <SectionCard>
            <SectionHeader icon="youtube" title="YouTube" />
            <ToggleRow
              label="Remove Shorts (Menu Method)"
              description='When a Shorts menu appears, auto-click "Not interested"'
              value={settings.youtube.removeShorts}
              onChange={(v) => { updateYoutube("removeShorts", v); AccessibilityModule.updateSettings({ removeShorts: v }); }}
            />
            <ToggleRow
              label="Back-Bounce from Shorts"
              description="Instantly navigate back if a Shorts player is detected"
              value={settings.youtube.autoBack}
              onChange={(v) => { updateYoutube("autoBack", v); AccessibilityModule.updateSettings({ backBounce: v }); }}
              indent
            />
            <ToggleRow
              label="Skip Ads"
              description="Automatically tap Skip Ad when available"
              value={settings.skipAds}
              onChange={(v) => { updateSkipAds(v); AccessibilityModule.updateSettings({ skipAds: v }); }}
            />
          </SectionCard>

          {/* Facebook */}
          <SectionCard>
            <SectionHeader icon="facebook" title="Facebook" />
            <ToggleRow
              label="Block Reels"
              description="Back-bounce from Reels player + menu heuristic"
              value={settings.facebook.removeReels}
              onChange={(v) => { updateFacebook("removeReels", v); AccessibilityModule.updateSettings({ removeReels: v }); }}
            />
            <ToggleRow
              label="Auto-back from Reels"
              description="Immediately navigate away when Reels feed is detected"
              value={settings.facebook.autoBack}
              onChange={(v) => { updateFacebook("autoBack", v); AccessibilityModule.updateSettings({ backBounce: v }); }}
              indent
            />
          </SectionCard>

          {/* Instagram */}
          <SectionCard>
            <SectionHeader icon="instagram" title="Instagram" />
            <ToggleRow
              label="Block Reels"
              description="Back-bounce from Reels / Clips player"
              value={settings.instagram.enabled}
              onChange={(v) => { updateInstagram(v); AccessibilityModule.updateSettings({ removeReels: v }); }}
            />
          </SectionCard>

          {/* Strict Mode */}
          <StrictModeSection
            strictMode={strictMode}
            setStrict={handleStrictToggle}
            blockList={settings.blockList}
            setBlockList={updateBlockList}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const pr = StyleSheet.create({
  heading: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, color: C.text, letterSpacing: -0.5 },
  subheading: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, marginTop: 4 },
});
