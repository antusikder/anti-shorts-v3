import React, { useEffect, useState } from "react";
import {
  View, ScrollView, Text, Switch, TouchableOpacity, StyleSheet,
  Alert, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSettings } from "@/context/SettingsContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";
import { C } from "@/constants/colors";

const CARD_RADIUS = 20;

type FeedCategory = { id: string; label: string; emoji: string; selected: boolean };

const INITIAL_CATEGORIES: FeedCategory[] = [
  { id: "study", label: "Study & Learning", emoji: "📚", selected: false },
  { id: "tech", label: "Technology & Dev", emoji: "💻", selected: false },
  { id: "science", label: "Science", emoji: "🔬", selected: false },
  { id: "history", label: "History & Culture", emoji: "🏛️", selected: false },
  { id: "informatics", label: "Informatics", emoji: "📊", selected: false },
  { id: "fitness", label: "Fitness & Health", emoji: "💪", selected: false },
  { id: "nature", label: "Nature & Wildlife", emoji: "🌿", selected: false },
  { id: "philosophy", label: "Philosophy", emoji: "🧠", selected: false },
  { id: "finance", label: "Finance & Investing", emoji: "💹", selected: false },
  { id: "art", label: "Art & Design", emoji: "🎨", selected: false },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function ToggleItem({
  icon, iconColor, label, sub, value, onToggle,
}: {
  icon: string; iconColor: string; label: string; sub?: string;
  value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: iconColor + "20" }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub && <Text style={styles.toggleSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        thumbColor={value ? C.amber : "#555"}
        trackColor={{ false: "#333", true: C.amber + "44" }}
      />
    </View>
  );
}

function PlatformCard({
  color, icon, label, enabled, onToggle, children,
}: {
  color: string; icon: string; label: string; enabled: boolean;
  onToggle: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <View style={[styles.platformCard, { borderColor: enabled ? color + "44" : C.border }]}>
      <LinearGradient colors={enabled ? [color + "18", "transparent"] : ["transparent", "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={styles.platformHeader}>
        <View style={[styles.platformIcon, { backgroundColor: color + "22" }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        <Text style={[styles.platformLabel, { color: enabled ? C.text : C.textMuted }]}>{label}</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          thumbColor={enabled ? color : "#555"}
          trackColor={{ false: "#333", true: color + "44" }}
        />
      </View>
      {enabled && children && <View style={styles.platformOptions}>{children}</View>}
    </View>
  );
}

export default function ShieldScreen() {
  const { settings, updateSystemEnabled, updateYoutube, updateFacebook, updateInstagram, updateTiktok, updateSkipAds } = useSettings();
  const [serviceActive, setServiceActive] = useState(false);
  const [categories, setCategories] = useState<FeedCategory[]>(INITIAL_CATEGORIES);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    checkService();
  }, []);

  useEffect(() => {
    if (serviceActive && settings.systemEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [serviceActive, settings.systemEnabled]);

  const checkService = async () => {
    const enabled = await AccessibilityModule.isServiceEnabled();
    setServiceActive(enabled);
  };

  const handleEnableService = () => {
    Alert.alert(
      "Enable Accessibility Service",
      "Find 'Fresh Mind Elite' in the list and enable it to activate the Smart Shield.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings", onPress: () => {
            AccessibilityModule.openAccessibilitySettings();
          }
        },
      ]
    );
  };

  const toggleCategory = (id: string) => {
    setCategories((cats) =>
      cats.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const selectedCount = categories.filter((c) => c.selected).length;

  return (
    <LinearGradient colors={["#07060F", "#0D0B1E", "#07060F"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="shield-crown" size={22} color={C.amber} />
            <Text style={styles.headerTitle}>Smart Shield</Text>
          </View>
          <Text style={styles.headerSub}>Block shorts, skip ads, reshape your algorithm</Text>

          {/* Service Status */}
          {!serviceActive ? (
            <TouchableOpacity onPress={handleEnableService} style={styles.offlineBanner}>
              <View style={styles.bannerLeft}>
                <MaterialCommunityIcons name="shield-off-outline" size={22} color={C.danger} />
                <View>
                  <Text style={styles.bannerTitle}>Accessibility Not Active</Text>
                  <Text style={styles.bannerSub}>Tap to enable in Settings</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="open-in-new" size={18} color={C.danger} />
            </TouchableOpacity>
          ) : (
            <Animated.View style={[styles.activeBanner, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient colors={[C.greenGlow, "transparent"]} style={StyleSheet.absoluteFill} />
              <MaterialCommunityIcons name="shield-check" size={22} color={C.green} />
              <Text style={styles.activeBannerText}>Shield is Active</Text>
            </Animated.View>
          )}

          {/* Master Kill Switch */}
          <Section title="Master Control">
            <ToggleItem
              icon="power"
              iconColor={settings.systemEnabled ? C.green : C.danger}
              label="System Active"
              sub="Turn off to pause all blocking"
              value={settings.systemEnabled}
              onToggle={updateSystemEnabled}
            />
            <View style={styles.divider} />
            <ToggleItem
              icon="advertisement-off"
              iconColor={C.blue}
              label="Skip Ads"
              sub="Auto-dismiss video ads on YouTube"
              value={settings.skipAds}
              onToggle={updateSkipAds}
            />
          </Section>

          {/* Per-Platform */}
          <Text style={styles.sectionTitle}>Platform Controls</Text>

          <PlatformCard
            color={C.youtube}
            icon="youtube"
            label="YouTube"
            enabled={settings.youtube.enabled}
            onToggle={(v) => updateYoutube("enabled", v)}
          >
            <ToggleItem
              icon="skip-next-circle-outline"
              iconColor={C.youtube}
              label="Remove Shorts"
              sub="Back out of Shorts automatically"
              value={settings.youtube.removeShorts}
              onToggle={(v) => updateYoutube("removeShorts", v)}
            />
            <View style={styles.divider} />
            <ToggleItem
              icon="star-outline"
              iconColor={C.youtube}
              label="Subscribed Channels First"
              sub="Prefer content from channels you follow"
              value={settings.youtube.subscribedOnly}
              onToggle={(v) => updateYoutube("subscribedOnly", v)}
            />
          </PlatformCard>

          <PlatformCard
            color={C.facebook}
            icon="facebook"
            label="Facebook"
            enabled={settings.facebook.enabled}
            onToggle={(v) => updateFacebook("enabled", v)}
          >
            <ToggleItem
              icon="video-off-outline"
              iconColor={C.facebook}
              label="Block Reels"
              sub="Exit Facebook Reels automatically"
              value={settings.facebook.removeReels}
              onToggle={(v) => updateFacebook("removeReels", v)}
            />
          </PlatformCard>

          <PlatformCard
            color={C.instagram}
            icon="instagram"
            label="Instagram"
            enabled={settings.instagram.enabled}
            onToggle={(v) => updateInstagram(v)}
          >
            <Text style={styles.platformNote}>
              ⚡ Instagram Reels will be blocked by pressing Back automatically.
            </Text>
          </PlatformCard>

          <PlatformCard
            color="#EE1D52"
            icon="music-note"
            label="TikTok"
            enabled={settings.tiktok.enabled}
            onToggle={(v) => updateTiktok(v)}
          >
            <Text style={styles.platformNote}>
              🚫 Enabling this will exit TikTok every time it's opened.
            </Text>
          </PlatformCard>

          {/* Algorithm Shaper */}
          <Section title="Algorithm Shaper">
            <Text style={styles.shaperInfo}>
              Select topics to prioritize in your feed. The shield will deprioritize gaming,
              unboxing, and entertainment content while boosting your selections.
            </Text>
            <Text style={styles.shaperCount}>
              {selectedCount > 0 ? `${selectedCount} category${selectedCount > 1 ? "s" : ""} selected` : "None selected — all content allowed"}
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  style={[styles.categoryChip, cat.selected && styles.categoryChipActive]}
                  activeOpacity={0.8}
                >
                  {cat.selected && <LinearGradient colors={[C.amberGlow, "transparent"]} style={StyleSheet.absoluteFill} />}
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryLabel, cat.selected && { color: C.amber }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.shaperDisclaimer}>
              ℹ️ Algorithm reshaping guides the service to deprioritize brainrot content and surface category-aligned videos from your subscribed channels.
            </Text>
          </Section>

          {/* Web Notice */}
          <View style={styles.webNotice}>
            <MaterialCommunityIcons name="web" size={18} color={C.textMuted} />
            <Text style={styles.webNoticeText}>
              Web browsers cannot be controlled by accessibility services. Website blocking is not supported.
            </Text>
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4, marginTop: 8 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, letterSpacing: -0.5 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginBottom: 20 },

  offlineBanner: {
    backgroundColor: C.dangerGlow,
    borderWidth: 1, borderColor: C.danger + "44",
    borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 20,
  },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  bannerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.danger },
  bannerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
  activeBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.greenGlow,
    borderWidth: 1, borderColor: C.green + "44",
    borderRadius: 16, padding: 14, marginBottom: 20, overflow: "hidden",
  },
  activeBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.green },

  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: CARD_RADIUS, overflow: "hidden" },

  toggleRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  toggleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  toggleText: { flex: 1 },
  toggleLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.text },
  toggleSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  platformCard: { marginBottom: 12, backgroundColor: C.bgCard, borderWidth: 1, borderRadius: CARD_RADIUS, overflow: "hidden" },
  platformHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  platformIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  platformLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
  platformOptions: { paddingHorizontal: 0, paddingBottom: 8, borderTopWidth: 1, borderTopColor: C.border },
  platformNote: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, padding: 14, lineHeight: 18 },

  shaperInfo: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 12, padding: 14, paddingBottom: 0 },
  shaperCount: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.amber, paddingHorizontal: 14, marginBottom: 12 },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14 },
  categoryChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, overflow: "hidden",
  },
  categoryChipActive: { borderColor: C.amber + "55" },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSub },
  shaperDisclaimer: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, padding: 14, paddingTop: 12, lineHeight: 17 },

  webNotice: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: C.bgCard, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  webNoticeText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, flex: 1, lineHeight: 18 },
});
