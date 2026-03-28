import React, { useState, useEffect, useCallback } from "react";
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

function ToggleItem({
  C,
  label,
  description,
  value,
  onValueChange,
  icon,
  disabled = false,
}: {
  C: any;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const ar = getAr(C);
  return (
    <View style={[ar.row, { opacity: disabled ? 0.5 : 1 }]}>
      <View style={ar.iconBg}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={ar.name}>{label}</Text>
        <Text style={{ fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" }}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: C.switchTrack, true: C.tint + "88" }}
        thumbColor={value ? C.tint : C.textMuted}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const C = Colors[colorScheme === "dark" ? "dark" : "light"];
  const s = getS(C);
  
  const insets = useSafeAreaInsets();
  const { settings, updateBlockList, updatePrivacy, setServiceEnabled } = useSettings();
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);

  const [pinInput, setPinInput] = useState(settings.privacy.pin || "");
  const [emailInput, setEmailInput] = useState(settings.privacy.recoveryEmail || "");

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const list = await AccessibilityModule.getInstalledApps();
      list.sort((a, b) => {
        const aB = settings.blockList.includes(a.pkg);
        const bB = settings.blockList.includes(b.pkg);
        if (aB === bB) return a.name.localeCompare(b.name);
        return aB ? -1 : 1;
      });
      setApps(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleApp = (pkg: string, block: boolean) => {
    let current = [...settings.blockList];
    if (block && !current.includes(pkg)) current.push(pkg);
    else if (!block) current = current.filter((p) => p !== pkg);
    updateBlockList(current);
  };

  const savePrivacy = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (pinInput.length > 0 && pinInput.length < 4) {
      Alert.alert("Invalid PIN", "PIN must be exactly 4 digits or empty to disable.");
      return;
    }
    updatePrivacy("pin", pinInput === "" ? null : pinInput);
    updatePrivacy("recoveryEmail", emailInput);
    Alert.alert("Saved", "Privacy settings updated.");
  };

  return (
    <LinearGradient colors={[C.background, "#0A0A14", C.background]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 60 : insets.top) + 16, paddingBottom: insets.bottom + 110 }}
      >
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
             <MaterialCommunityIcons name="leaf" size={28} color={C.tint} />
             <Text style={s.title}>Settings</Text>
          </View>
          <Text style={s.subtitle}>Customise your Fresh Mind experience</Text>
        </View>

        {/* Master Active Toggle */}
        <View style={s.card}>
           <ToggleItem
            C={C}
            label="Master Shield"
            description="Enable or disable all protection features system-wide."
            value={settings.isServiceEnabled}
            onValueChange={setServiceEnabled}
            icon={<Feather name="shield" size={18} color={C.tint} />}
          />
        </View>

        {/* PIN & Privacy Section */}
        <View style={s.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Feather name="lock" size={18} color={C.tint} />
            <Text style={s.cardTitle}>Privacy & Parental Control</Text>
          </View>
          
          <View style={s.entryRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.entryLabel}>4-Digit PIN</Text>
              <Text style={s.entryDesc}>Secure access to the app</Text>
            </View>
            <TextInput 
              style={[s.inputBox, { backgroundColor: C.backgroundElevated, color: C.text, width: 80, textAlign: 'center' }]}
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="numeric"
              maxLength={4}
              placeholder="None"
              placeholderTextColor={C.textMuted}
            />
          </View>

          <View style={s.divider} />

          <View style={s.entryRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.entryLabel}>Recovery Email</Text>
              <Text style={s.entryDesc}>To reset PIN if forgotten</Text>
            </View>
            <TextInput 
              style={[s.inputBox, { backgroundColor: C.backgroundElevated, color: C.text, width: 160, paddingHorizontal: 10 }]}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="email@example.com"
              placeholderTextColor={C.textMuted}
            />
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={savePrivacy}>
            <Text style={s.saveBtnText}>Update PIN & Recovery Info</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
          <View style={s.divider} />

          <ToggleItem
            C={C}
            label="Calculator Disguise"
            description="Decoy icon & UI. Requires manual restart."
            value={settings.privacy.isDisguised}
            onValueChange={(v: boolean) => {
               Alert.alert(
                 "Icon Toggle",
                 "Switching the icon will momentarily close the app to refresh the system launcher. Continue?",
                 [
                   { text: "Cancel", style: "cancel" },
                   { 
                     text: "Switch Now", 
                     onPress: () => {
                       updatePrivacy("isDisguised", v);
                       if (Platform.OS === 'android') {
                         const { NativeModules } = require('react-native');
                         NativeModules.LauncherModule.setIcon(v ? 'calculator' : 'default');
                       }
                     }
                   }
                 ]
               );
            }}
            icon={<MaterialCommunityIcons name="calculator" size={20} color={C.tint} />}
            disabled={!settings.privacy.pin}
          />
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Feather name="shield" size={18} color={C.danger} />
            <Text style={s.cardTitle}>App Block List</Text>
          </View>
          <Text style={s.cardDesc}>
            Select the apps you want to block during sessions. Checked apps will instantly close.
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
            <Feather name="coffee" size={18} color={C.amber} />
            <Text style={s.cardTitle}>Support Development</Text>
          </View>
          <Text style={s.cardDesc}>
            If Fresh Mind helps you stay productive, consider buying me a coffee! Your support keeps this project alive.
          </Text>
          <View style={[s.creditsBox, { backgroundColor: C.amber + '12', borderColor: C.amber + '30', borderWidth: 1 }]}>
             <Text style={[s.creditHeader, { color: C.amber }]}>Buy Me a Coffee (BKash / Nagad)</Text>
             <Text style={s.creditText}>+8801581872622</Text>
             <Text style={s.creditSub}>Personal Account · Bangladesh</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Feather name="info" size={18} color={C.textSecondary} />
            <Text style={s.cardTitle}>About Fresh Mind</Text>
          </View>
          <Text style={s.aboutText}>Version 3.2.0 (Production Stable)</Text>
          <Text style={s.aboutText}>Accessibility Service: {settings.isServiceEnabled ? "Active" : "Inactive"}</Text>
          
          <View style={s.creditsBox}>
             <Text style={s.creditHeader}>Creator &amp; Developer</Text>
             <Text style={s.creditText}>Alman Sikder</Text>
             <Text style={s.creditSub}>Studying Meteorology · University of Dhaka</Text>
             <Text style={{...s.creditSub, marginTop: 14, opacity: 0.7}}>
               Copyright © {new Date().getFullYear()} Alman Sikder · All rights reserved
             </Text>
          </View>
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
  entryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  entryLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  entryDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  inputBox: { borderRadius: 12, height: 44, justifyContent: 'center' },
  saveBtn: { backgroundColor: C.tint + '15', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: C.tint, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  appList: { marginTop: 4 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  endNote: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center", marginTop: 16 },
  aboutText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 6 },
  creditsBox: { marginTop: 16, padding: 16, backgroundColor: C.backgroundSecondary, borderRadius: 12 },
  creditHeader: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  creditText: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, marginTop: 2 },
  creditSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 4 },
});
