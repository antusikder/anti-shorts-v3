import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  useColorScheme,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { AccessibilityModule, InstalledApp } from "@/modules/AccessibilityModule";

function AppToggleRow({
  app,
  isBlocked,
  onToggle,
  C,
}: {
  app: InstalledApp;
  isBlocked: boolean;
  onToggle: (v: boolean) => void;
  C: any;
}) {
  const ar = getAr(C);
  return (
    <View style={ar.row}>
      <View style={ar.iconBg}>
        <Text style={ar.iconText}>{app.name.charAt(0)}</Text>
      </View>
      <Text style={ar.name}>{app.name}</Text>
      <Switch
        value={isBlocked}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onToggle(v);
        }}
        trackColor={{ false: C.switchTrack, true: C.danger + "88" }}
        thumbColor={isBlocked ? C.danger : C.textMuted}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const C = Colors[colorScheme === "dark" ? "dark" : "light"];
  const s = getS(C);
  
  const insets = useSafeAreaInsets();
  const { settings, updateBlockList } = useSettings();
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    const list = await AccessibilityModule.getInstalledApps();
    // Sort so already blocked apps are at top
    list.sort((a, b) => {
      const aB = settings.blockList.includes(a.pkg);
      const bB = settings.blockList.includes(b.pkg);
      if (aB === bB) return a.name.localeCompare(b.name);
      return aB ? -1 : 1;
    });
    setApps(list);
    setLoading(false);
  };

  const toggleApp = (pkg: string, block: boolean) => {
    let current = [...settings.blockList];
    if (block && !current.includes(pkg)) current.push(pkg);
    else if (!block) current = current.filter((p) => p !== pkg);
    updateBlockList(current);
  };

  return (
    <LinearGradient colors={[C.background, "#0A0A14", C.background]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 60 : insets.top) + 16, paddingBottom: insets.bottom + 110 }}
      >
        <View style={s.header}>
          <Text style={s.title}>Settings</Text>
          <Text style={s.subtitle}>Customise your Mind experience</Text>
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Feather name="shield" size={18} color={C.danger} />
            <Text style={s.cardTitle}>App Block List</Text>
          </View>
          <Text style={s.cardDesc}>
            Select the apps you want to block during Strict Mode sessions and Bedtime. Checked apps will instantly close.
          </Text>

          {loading ? (
            <Text style={{ color: C.textMuted, marginVertical: 20, textAlign: "center" }}>Loading installed apps…</Text>
          ) : (
            <View style={s.appList}>
              {apps.slice(0, 50).map((app) => (
                <View key={app.pkg}>
                  <AppToggleRow
                    C={C}
                    app={app}
                    isBlocked={settings.blockList.includes(app.pkg)}
                    onToggle={(v) => toggleApp(app.pkg, v)}
                  />
                  <View style={s.divider} />
                </View>
              ))}
              <Text style={s.endNote}>Showing top 50 launchable apps</Text>
            </View>
          )}
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Feather name="info" size={18} color={C.textSecondary} />
            <Text style={s.cardTitle}>About Fresh Mind</Text>
          </View>
          <Text style={s.aboutText}>Version 3.0.0</Text>
          <Text style={s.aboutText}>Accessibility Service: {settings.isServiceEnabled ? "Active" : "Inactive"}</Text>
          
          <View style={s.creditsBox}>
             <Text style={s.creditHeader}>Creator & Developer:</Text>
             <Text style={s.creditText}>Alman Sikder</Text>
             <Text style={s.creditSub}>Alman studies Meteorology at University of Dhaka</Text>
             <Text style={{...s.creditSub, marginTop: 12}}>Copyright © {new Date().getFullYear()}</Text>
          </View>

          <TouchableOpacity
            style={s.resetBtn}
            onPress={() => Alert.alert("Reset Stats", "Clear all time stats today?", [
              { text: "Cancel" },
              { text: "Reset", style: "destructive", onPress: () => console.log("implement reset") }
            ])}
            activeOpacity={0.8}
          >
            <Text style={s.resetBtnText}>Reset Today's Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getAr = (C: any) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  iconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  name: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: C.text },
});

const getS = (C: any) => StyleSheet.create({
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 4 },
  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: C.backgroundCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 20, marginBottom: 16 },
  creditName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  creditDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  entryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  entryLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  entryDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  inputBox: { borderRadius: 8, paddingHorizontal: 4 },
  saveBtn: { backgroundColor: C.tint + '22', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: C.tint, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  appList: { marginTop: 4 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 2 },
  endNote: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center", marginTop: 16 },
  aboutText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 6 },
  creditsBox: { marginTop: 16, padding: 16, backgroundColor: C.backgroundSecondary, borderRadius: 12 },
  creditHeader: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  creditText: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text, marginTop: 2 },
  creditSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 4, fontStyle: "italic" },
  resetBtn: { marginTop: 16, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.danger + "22" },
  resetBtnText: { color: C.danger, fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
