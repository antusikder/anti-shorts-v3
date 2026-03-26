import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

const C = Colors.dark;

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <View style={sh.sectionHeader}>
      <View style={sh.sectionHeaderLeft}>
        <View style={sh.sectionIconWrap}>{icon}</View>
        <View>
          <Text style={sh.sectionTitle}>{title}</Text>
          {subtitle && <Text style={sh.sectionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

function ToggleItem({
  label,
  description,
  value,
  onValueChange,
  icon,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const handleToggle = (v: boolean) => {
    Haptics.selectionAsync();
    onValueChange(v);
  };
  return (
    <View style={ti.row}>
      {icon && <View style={ti.iconWrap}>{icon}</View>}
      <View style={ti.textWrap}>
        <Text style={[ti.label, disabled && { color: C.textMuted }]}>{label}</Text>
        {description && <Text style={ti.desc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={handleToggle}
        disabled={disabled}
        trackColor={{ false: C.switchTrack, true: C.tint + "88" }}
        thumbColor={value ? C.tint : C.textMuted}
        ios_backgroundColor={C.switchTrack}
      />
    </View>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[card.container, style]}>{children}</View>;
}

export default function ShieldScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateYoutube, updateFacebook, updateScanSpeed, setServiceEnabled } = useSettings();
  const [isChecking, setIsChecking] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isEnabled]);

  const checkStatus = async () => {
    const enabled = await AccessibilityModule.isServiceEnabled();
    setIsEnabled(enabled);
    setIsChecking(false);
    setServiceEnabled(enabled);
  };

  const topPad = Platform.OS === "web" ? 60 : insets.top;

  return (
    <LinearGradient colors={[C.background, "#0F0C2A", C.background]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: insets.bottom + 110 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="brain" size={30} color={C.tint} />
            <Text style={styles.appTitle}>Productive</Text>
          </View>
          <Text style={styles.appSubtitle}>Digital Wellness Shield</Text>
        </View>

        {/* Service Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusTop}>
            <Text style={styles.cardLabel}>Protection Status</Text>
            {isChecking ? (
              <ActivityIndicator size="small" color={C.tint} />
            ) : (
              <View style={[styles.badge, { backgroundColor: isEnabled ? C.green + "22" : C.danger + "22" }]}>
                <View style={[styles.dot, { backgroundColor: isEnabled ? C.green : C.danger }]} />
                <Text style={[styles.badgeText, { color: isEnabled ? C.green : C.danger }]}>
                  {isEnabled ? "ACTIVE" : "INACTIVE"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.shieldCenter}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={[styles.shieldBg, { backgroundColor: isEnabled ? C.green + "22" : C.tint + "22" }]}>
                <MaterialCommunityIcons
                  name={isEnabled ? "shield-check" : "shield-off"}
                  size={56}
                  color={isEnabled ? C.green : C.tint}
                />
              </View>
            </Animated.View>
          </View>

          {isEnabled ? (
            <View style={styles.statusMsg}>
              <Text style={[styles.statusText, { color: C.green }]}>Shield is active</Text>
              <Text style={styles.statusSub}>Shorts and Reels are being filtered automatically</Text>
            </View>
          ) : (
            <View style={styles.statusMsg}>
              <Text style={styles.statusText}>Accessibility permission needed</Text>
              <Text style={styles.statusSub}>Tap below to enable the service once</Text>
              <TouchableOpacity
                style={styles.enableBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  AccessibilityModule.openAccessibilitySettings();
                }}
                activeOpacity={0.8}
              >
                <Feather name="settings" size={16} color="#fff" />
                <Text style={styles.enableBtnText}>Open Accessibility Settings</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.backgroundCard }]}>
            <Text style={[styles.statNum, { color: C.tint }]}>{settings.stats.shortsShieldedToday}</Text>
            <Text style={styles.statLabel}>Shorts Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.backgroundCard }]}>
            <Text style={[styles.statNum, { color: C.facebook }]}>{settings.stats.reelsRejectedToday}</Text>
            <Text style={styles.statLabel}>Reels Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.backgroundCard }]}>
            <Text style={[styles.statNum, { color: C.amber }]}>
              {settings.stats.totalShortsShielded + settings.stats.totalReelsRejected}
            </Text>
            <Text style={styles.statLabel}>All Time</Text>
          </View>
        </View>

        {/* YouTube Section */}
        <Card>
          <SectionHeader
            icon={<MaterialCommunityIcons name="youtube" size={18} color={C.youtube} />}
            title="YouTube"
            subtitle="Control YouTube Shorts removal"
          />
          <ToggleItem
            label="YouTube Protection"
            description="Master switch — enable/disable all YouTube filtering"
            value={settings.youtube.enabled}
            onValueChange={(v) => updateYoutube("enabled", v)}
            icon={<MaterialCommunityIcons name="youtube" size={20} color={settings.youtube.enabled ? C.youtube : C.textMuted} />}
          />
          <View style={styles.divider} />
          <ToggleItem
            label="Remove Shorts from Feed"
            description="Detects Shorts shelf and dismisses it quietly"
            value={settings.youtube.removeShorts}
            onValueChange={(v) => updateYoutube("removeShorts", v)}
            icon={<Feather name="skip-forward" size={18} color={C.tint} />}
            disabled={!settings.youtube.enabled}
          />
          <View style={styles.divider} />
          <ToggleItem
            label="Auto-Back from Short"
            description="Instantly exits if a Short video opens"
            value={settings.youtube.autoBack}
            onValueChange={(v) => updateYoutube("autoBack", v)}
            icon={<Feather name="arrow-left" size={18} color={C.amber} />}
            disabled={!settings.youtube.enabled}
          />
        </Card>

        <View style={{ height: 12 }} />

        {/* Facebook Section */}
        <Card>
          <SectionHeader
            icon={<Feather name="facebook" size={18} color={C.facebook} />}
            title="Facebook"
            subtitle="Control Facebook Reels removal"
          />
          <ToggleItem
            label="Facebook Protection"
            description="Master switch — enable/disable all Facebook filtering"
            value={settings.facebook.enabled}
            onValueChange={(v) => updateFacebook("enabled", v)}
            icon={<Feather name="facebook" size={20} color={settings.facebook.enabled ? C.facebook : C.textMuted} />}
          />
          <View style={styles.divider} />
          <ToggleItem
            label="Remove Reels from Feed"
            description="Dismisses Reels shelf with 'See fewer Reels'"
            value={settings.facebook.removeReels}
            onValueChange={(v) => updateFacebook("removeReels", v)}
            icon={<Feather name="skip-forward" size={18} color={C.tint} />}
            disabled={!settings.facebook.enabled}
          />
          <View style={styles.divider} />
          <ToggleItem
            label="Auto-Back from Reel"
            description="Exits if a Reel player opens"
            value={settings.facebook.autoBack}
            onValueChange={(v) => updateFacebook("autoBack", v)}
            icon={<Feather name="arrow-left" size={18} color={C.amber} />}
            disabled={!settings.facebook.enabled}
          />
        </Card>

        <View style={{ height: 12 }} />

        {/* Scan Speed */}
        <Card>
          <SectionHeader
            icon={<Feather name="activity" size={18} color={C.textSecondary} />}
            title="Scan Speed"
            subtitle="Balance between speed and battery"
          />
          <View style={styles.speedRow}>
            {(["battery", "balanced", "aggressive"] as const).map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedBtn,
                  settings.scanSpeed === speed && { backgroundColor: C.tint },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateScanSpeed(speed);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.speedLabel, settings.scanSpeed === speed && { color: "#fff" }]}>
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.speedHint}>
            {settings.scanSpeed === "battery"
              ? "300ms interval — lowest battery drain"
              : settings.scanSpeed === "balanced"
              ? "150ms interval — recommended"
              : "80ms interval — fastest, uses more battery"}
          </Text>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const card = StyleSheet.create({
  container: {
    backgroundColor: C.backgroundCard,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
});

const sh = StyleSheet.create({
  sectionHeader: { marginBottom: 14 },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  sectionSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 },
});

const ti = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  desc: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
});

const styles = StyleSheet.create({
  scroll: { gap: 0, paddingHorizontal: 0 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  appTitle: { fontSize: 30, fontFamily: "Inter_700Bold", color: C.text },
  appSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, paddingLeft: 40 },
  statusCard: { backgroundColor: C.backgroundCard, borderRadius: 20, marginHorizontal: 16, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  statusTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  shieldCenter: { alignItems: "center", marginBottom: 16 },
  shieldBg: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  statusMsg: { alignItems: "center", gap: 6 },
  statusText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  statusSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },
  enableBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.tint, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
  enableBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: C.border },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  speedRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  speedBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: C.backgroundElevated },
  speedLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  speedHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },
});
