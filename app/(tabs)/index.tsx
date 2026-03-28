import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Switch,
  ActivityIndicator,
  Animated,
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
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center" }}>
          {icon}
        </View>
        <View>
          <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text }}>{title}</Text>
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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 }}>
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
        trackColor={{ false: C.switchTrack, true: C.tint + "88" }}
        thumbColor={value ? C.tint : C.textMuted}
        ios_backgroundColor={C.switchTrack}
      />
    </View>
  );
}

function Card({ children, style, C }: { children: React.ReactNode; style?: object; C: any }) {
  return (
    <View style={[{ backgroundColor: C.backgroundCard, borderRadius: 20, marginHorizontal: 16, padding: 18, borderWidth: 1, borderColor: C.border }, style]}>
      {children}
    </View>
  );
}

// ─── Feed Mode Data ───────────────────────────────────────────────────────────

const FEED_MODES: { id: FeedMode; label: string; emoji: string; desc: string }[] = [
  { id: "off", label: "Off", emoji: "🔕", desc: "No algorithm shaping" },
  { id: "knowledge", label: "Knowledge", emoji: "📚", desc: "Prefer educational & science content" },
  { id: "study", label: "Study", emoji: "🎓", desc: "Focus on tutorials & documentaries" },
  { id: "productive", label: "Productive", emoji: "⚡", desc: "Tech, business & how-to content" },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ShieldScreen() {
  const colorScheme = useColorScheme();
  const C = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const {
    settings,
    updateYoutube, updateFacebook, updateInstagram, updateTiktok,
    updateSkipAds, updateSystemEnabled, updateScanSpeed, updateFeedMode, setServiceEnabled,
  } = useSettings();

  const [isChecking, setIsChecking] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isEnabled && settings.systemEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.07, duration: 1600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isEnabled, settings.systemEnabled]);

  const checkStatus = async () => {
    const enabled = await AccessibilityModule.isServiceEnabled();
    setIsEnabled(enabled);
    setIsChecking(false);
    setServiceEnabled(enabled);
  };

  const active = isEnabled && settings.systemEnabled;
  const topPad = Platform.OS === "web" ? 60 : insets.top;

  return (
    <LinearGradient
      colors={active ? ["#0D1A12", "#0A1E14", "#0D0B1E"] : ["#140D0B", "#1A1412", "#0D0B1E"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: insets.bottom + 110 }}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <MaterialCommunityIcons name="brain" size={28} color={C.tint} />
            <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: C.text }}>Fresh Mind</Text>
            <View style={{ flex: 1 }} />
            {isChecking ? (
              <ActivityIndicator size="small" color={C.tint} />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: (active ? C.green : C.danger) + "22" }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: active ? C.green : C.danger }} />
                <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, color: active ? C.green : C.danger }}>
                  {active ? "ACTIVE" : "OFF"}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, paddingLeft: 38 }}>
            Digital Wellness Shield
          </Text>
        </View>

        {/* ── Shield Card ── */}
        <Card C={C} style={{ marginBottom: 16 }}>
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  updateSystemEnabled(!settings.systemEnabled);
                }}
                style={{
                  width: 120, height: 120, borderRadius: 60,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: active ? C.green + "20" : C.tint + "18",
                  borderWidth: 2, borderColor: active ? C.green : C.tintDark,
                  shadowColor: active ? C.green : C.tint,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: active ? 24 : 8,
                  shadowOpacity: active ? 0.45 : 0.2,
                  elevation: active ? 16 : 4,
                }}
              >
                <MaterialCommunityIcons
                  name={active ? "shield-check" : "shield-off"}
                  size={60}
                  color={active ? C.green : C.tint}
                />
              </TouchableOpacity>
            </Animated.View>

            <Text style={{ marginTop: 14, fontSize: 18, fontFamily: "Inter_700Bold", color: active ? C.green : C.text }}>
              {active ? "Shield Active" : isEnabled ? "Shield Paused" : "Needs Setup"}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" }}>
              {active
                ? "Monitoring & blocking short-form content"
                : isEnabled
                ? "Tap shield to enable"
                : "Enable in Accessibility Settings"}
            </Text>

            {!isEnabled && (
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.tint, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 16 }}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); AccessibilityModule.openAccessibilitySettings(); }}
                activeOpacity={0.85}
              >
                <Feather name="settings" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" }}>Open Accessibility Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* ── Quick Stats ── */}
        <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 16 }}>
          {[
            { num: settings.stats.shortsShieldedToday, label: "Shorts\nBlocked Today", color: C.youtube },
            { num: settings.stats.reelsRejectedToday, label: "Reels\nBlocked Today", color: C.facebook },
            { num: settings.stats.adsRemovedToday, label: "Ads\nSkipped Today", color: C.amber },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: C.border, backgroundColor: C.backgroundCard }}>
              <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: stat.color }}>{stat.num}</Text>
              <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── YouTube ── */}
        <Card C={C}>
          <SectionHeader C={C} icon={<MaterialCommunityIcons name="youtube" size={18} color={C.youtube} />} title="YouTube" subtitle="Shorts blocking & ad skipping" />
          <ToggleItem C={C} label="YouTube Protection" description="Master switch for all YouTube features" value={settings.youtube.enabled} onValueChange={(v) => updateYoutube("enabled", v)} icon={<MaterialCommunityIcons name="youtube" size={20} color={settings.youtube.enabled ? C.youtube : C.textMuted} />} />
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
          <ToggleItem C={C} label="Auto-Skip Ads" description="Instantly skips video ads (view-ID + text)" value={settings.skipAds} onValueChange={updateSkipAds} icon={<MaterialCommunityIcons name="gesture-tap" size={18} color={C.info} />} disabled={!settings.youtube.enabled} />
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
          <ToggleItem C={C} label="Remove Shorts from Feed" description="Dismisses Shorts shelf via 3-dot menu" value={settings.youtube.removeShorts} onValueChange={(v) => updateYoutube("removeShorts", v)} icon={<Feather name="list" size={18} color={C.tint} />} disabled={!settings.youtube.enabled} />
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
          <ToggleItem C={C} label="Auto-Back from Short" description="Exits immediately if a Short video opens" value={settings.youtube.autoBack} onValueChange={(v) => updateYoutube("autoBack", v)} icon={<Feather name="corner-up-left" size={18} color={C.amber} />} disabled={!settings.youtube.enabled} />
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
          <ToggleItem C={C} label="Subscribed Channels Only" description="Filters feed to only show videos from channels you follow" value={settings.youtube.subscribedOnly} onValueChange={(v) => updateYoutube("subscribedOnly", v)} icon={<MaterialCommunityIcons name="account-heart" size={18} color={C.green} />} disabled={!settings.youtube.enabled} />
        </Card>

        <View style={{ height: 12 }} />

        {/* ── Facebook ── */}
        <Card C={C}>
          <SectionHeader C={C} icon={<Feather name="facebook" size={18} color={C.facebook} />} title="Facebook" subtitle="Reels removal & auto-back" />
          <ToggleItem C={C} label="Facebook Protection" description="Master switch for all Facebook filtering" value={settings.facebook.enabled} onValueChange={(v) => updateFacebook("enabled", v)} icon={<Feather name="facebook" size={20} color={settings.facebook.enabled ? C.facebook : C.textMuted} />} />
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
          <ToggleItem C={C} label="Remove Reels from Feed" description="Dismisses Reels shelf via 3-dot menu" value={settings.facebook.removeReels} onValueChange={(v) => updateFacebook("removeReels", v)} icon={<Feather name="list" size={18} color={C.tint} />} disabled={!settings.facebook.enabled} />
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
          <ToggleItem C={C} label="Auto-Back from Reel" description="Exits if a Reel player opens" value={settings.facebook.autoBack} onValueChange={(v) => updateFacebook("autoBack", v)} icon={<Feather name="corner-up-left" size={18} color={C.amber} />} disabled={!settings.facebook.enabled} />
        </Card>

        <View style={{ height: 12 }} />

        {/* ── Instagram & TikTok ── */}
        <Card C={C}>
          <SectionHeader C={C} icon={<MaterialCommunityIcons name="instagram" size={18} color={C.instagram} />} title="Instagram & TikTok" />
          <ToggleItem C={C} label="Block Instagram Reels" description="Exits automatically when Reels are opened" value={settings.instagram.enabled} onValueChange={updateInstagram} icon={<MaterialCommunityIcons name="instagram" size={20} color={settings.instagram.enabled ? C.instagram : C.textMuted} />} />
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
          <ToggleItem C={C} label="Block TikTok" description="Blocks entirely — sends HOME on open" value={settings.tiktok.enabled} onValueChange={updateTiktok} icon={<MaterialCommunityIcons name="music-note" size={20} color={settings.tiktok.enabled ? C.tiktok : C.textMuted} />} />
        </Card>

        <View style={{ height: 12 }} />

        {/* ── Smart Feed Mode ── */}
        <Card C={C}>
          <SectionHeader C={C}
            icon={<MaterialCommunityIcons name="brain" size={18} color={C.tint} />}
            title="Smart Feed Mode"
            subtitle="Optional — nudges your algorithm toward quality content"
          />
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginBottom: 12, lineHeight: 18 }}>
            When active, Fresh Mind interacts with long-form content in your feed to help train the YouTube, Facebook & Instagram algorithms toward the selected content type.
          </Text>
          <View style={{ gap: 8 }}>
            {FEED_MODES.map((mode) => {
              const selected = settings.feedMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  activeOpacity={0.8}
                  onPress={() => { Haptics.selectionAsync(); updateFeedMode(mode.id); }}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    padding: 14, borderRadius: 14, borderWidth: 1.5,
                    borderColor: selected ? C.tint : C.border,
                    backgroundColor: selected ? C.tint + "18" : C.backgroundElevated,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{mode.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: selected ? C.tint : C.text }}>{mode.label}</Text>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 }}>{mode.desc}</Text>
                  </View>
                  {selected && <MaterialCommunityIcons name="check-circle" size={20} color={C.tint} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={{ height: 12 }} />

        {/* ── Scan Speed ── */}
        <Card C={C}>
          <SectionHeader C={C} icon={<Feather name="activity" size={18} color={C.textSecondary} />} title="Scan Speed" subtitle="Balance between responsiveness and battery" />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {(["battery", "balanced", "aggressive"] as const).map((speed) => (
              <TouchableOpacity
                key={speed}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: settings.scanSpeed === speed ? C.tint : C.backgroundElevated }}
                onPress={() => { Haptics.selectionAsync(); updateScanSpeed(speed); }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: settings.scanSpeed === speed ? "#fff" : C.textSecondary }}>
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" }}>
            {settings.scanSpeed === "battery"
              ? "300ms — lowest battery drain"
              : settings.scanSpeed === "balanced"
              ? "150ms — recommended (balanced)"
              : "80ms — fastest, higher CPU"}
          </Text>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}
