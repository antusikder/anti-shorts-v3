import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceStatusCard } from "@/components/ServiceStatusCard";
import { StatsRow } from "@/components/StatsRow";
import { ToggleRow } from "@/components/ToggleRow";
import { SectionCard } from "@/components/SectionCard";
import { SpeedSelector } from "@/components/SpeedSelector";
import { SetupGuide } from "@/components/SetupGuide";
import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

export default function HomeScreen() {
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const { settings, updateYoutube, updateFacebook, updateScanSpeed, setServiceEnabled } =
    useSettings();

  useEffect(() => {
    syncSettingsToService();
  }, [settings]);

  const syncSettingsToService = () => {
    AccessibilityModule.updateSettings({
      youtubeRemoveShorts: settings.youtube.removeShortsFromFeed,
      youtubeAutoBack: settings.youtube.autoBackFromPlayer,
      youtubeRemoveAds: settings.youtube.removeAds,
      facebookRemoveReels: settings.facebook.removeReelsFromFeed,
      facebookRemoveAds: settings.facebook.removeAds,
      scanSpeed: settings.scanSpeed,
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appHeader}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons
              name="shield-sword"
              size={28}
              color={C.tint}
            />
            <Text style={[styles.appTitle, { color: C.text }]}>
              Anti Shorts
            </Text>
          </View>
          <Text style={[styles.appSubtitle, { color: C.textMuted }]}>
            Cognitive Protection Shield
          </Text>
        </View>

        <ServiceStatusCard onStatusChange={setServiceEnabled} />

        <View style={{ height: 20 }} />
        <StatsRow />

        <View style={{ height: 24 }} />

        <SectionCard
          title="YOUTUBE SETTINGS"
          titleIcon={<Feather name="youtube" size={13} color={Colors.dark.youtube} />}
          badge="YouTube"
          badgeColor={Colors.dark.youtube}
        >
          <ToggleRow
            label="Remove Shorts from Feed"
            description="Finds Shorts shelf and dismisses with 'Fewer Shorts'"
            value={settings.youtube.removeShortsFromFeed}
            onValueChange={(v) => updateYoutube("removeShortsFromFeed", v)}
            icon={<Feather name="skip-forward" size={18} color={Colors.dark.youtube} />}
          />
          <ToggleRow
            label="Auto-Back from Player"
            description="Instantly exits if Shorts player opens"
            value={settings.youtube.autoBackFromPlayer}
            onValueChange={(v) => updateYoutube("autoBackFromPlayer", v)}
            icon={<Feather name="arrow-left" size={18} color={Colors.dark.youtube} />}
          />
          <ToggleRow
            label="Remove Ads"
            description="Detects Sponsored content and dismisses"
            value={settings.youtube.removeAds}
            onValueChange={(v) => updateYoutube("removeAds", v)}
            icon={<Feather name="x-circle" size={18} color={Colors.dark.youtube} />}
            isLast
          />
        </SectionCard>

        <View style={{ height: 16 }} />

        <SectionCard
          title="FACEBOOK SETTINGS"
          titleIcon={<Feather name="facebook" size={13} color={Colors.dark.facebook} />}
          badge="Facebook"
          badgeColor={Colors.dark.facebook}
        >
          <ToggleRow
            label="Remove Reels from Feed"
            description="Finds Reels shelf and clicks 'See Fewer Reels'"
            value={settings.facebook.removeReelsFromFeed}
            onValueChange={(v) => updateFacebook("removeReelsFromFeed", v)}
            icon={<Feather name="skip-forward" size={18} color={Colors.dark.facebook} />}
          />
          <ToggleRow
            label="Remove Ads"
            description="Finds Sponsored posts and hides them"
            value={settings.facebook.removeAds}
            onValueChange={(v) => updateFacebook("removeAds", v)}
            icon={<Feather name="x-circle" size={18} color={Colors.dark.facebook} />}
            isLast
          />
        </SectionCard>

        <View style={{ height: 16 }} />

        <SectionCard
          title="SCAN SPEED"
          titleIcon={<Feather name="activity" size={13} color={C.textSecondary} />}
        >
          <SpeedSelector
            value={settings.scanSpeed}
            onChange={updateScanSpeed}
          />
        </SectionCard>

        <View style={{ height: 16 }} />

        {!settings.isServiceEnabled && <SetupGuide />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 0,
  },
  appHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  appSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingLeft: 38,
  },
});
