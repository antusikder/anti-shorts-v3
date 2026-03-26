import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useSettings, BedtimeSettings } from "@/context/SettingsContext";

const C = Colors.dark;

function pad2(n: number) { return n.toString().padStart(2, "0"); }

/** Formats minutes since midnight as a 12-hour time string */
function formatTime(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${pad2(m)} ${period}`;
}

/** Computes sleep duration between two HH:MM points */
function sleepDurationHours(startH: number, startM: number, endH: number, endM: number): number {
  let start = startH * 60 + startM;
  let end = endH * 60 + endM;
  if (end <= start) end += 24 * 60; // overnight
  return (end - start) / 60;
}

function getSleepRating(hours: number) {
  if (hours >= 8) return { text: "Excellent", color: C.green };
  if (hours >= 7) return { text: "Good", color: C.tint };
  if (hours >= 6) return { text: "Fair", color: C.amber };
  return { text: "Too short", color: C.danger };
}

function TimeWheel({
  label,
  hour,
  minute,
  onHourChange,
  onMinChange,
}: {
  label: string;
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinChange: (m: number) => void;
}) {
  return (
    <View style={tw.wrap}>
      <Text style={tw.label}>{label}</Text>
      <View style={tw.wheel}>
        {/* Hour */}
        <View style={tw.col}>
          <TouchableOpacity onPress={() => onHourChange((hour + 1) % 24)} style={tw.arrow}>
            <Feather name="chevron-up" size={18} color={C.tint} />
          </TouchableOpacity>
          <View style={tw.valueBg}>
            <Text style={tw.value}>{pad2(hour)}</Text>
          </View>
          <TouchableOpacity onPress={() => onHourChange((hour - 1 + 24) % 24)} style={tw.arrow}>
            <Feather name="chevron-down" size={18} color={C.tint} />
          </TouchableOpacity>
        </View>

        <Text style={tw.colon}>:</Text>

        {/* Minute — snaps to 0/15/30/45 */}
        <View style={tw.col}>
          <TouchableOpacity onPress={() => onMinChange((minute + 15) % 60)} style={tw.arrow}>
            <Feather name="chevron-up" size={18} color={C.tint} />
          </TouchableOpacity>
          <View style={tw.valueBg}>
            <Text style={tw.value}>{pad2(minute)}</Text>
          </View>
          <TouchableOpacity onPress={() => onMinChange((minute - 15 + 60) % 60)} style={tw.arrow}>
            <Feather name="chevron-down" size={18} color={C.tint} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={tw.period}>{hour >= 12 ? "PM" : "AM"}</Text>
    </View>
  );
}

export default function BedtimeScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateBedtime } = useSettings();
  const bt = settings.bedtime;

  const sleepHrs = sleepDurationHours(bt.startHour, bt.startMin, bt.endHour, bt.endMin);
  const rating = getSleepRating(sleepHrs);

  const update = (patch: Partial<BedtimeSettings>) => {
    Haptics.selectionAsync();
    updateBedtime({ ...bt, ...patch });
  };

  // Suggestions
  const SUGGESTIONS = [
    { label: "🌙 Adult (8h)", startH: 22, startM: 0, endH: 6, endM: 0 },
    { label: "🌙 Early (7h)", startH: 22, startM: 30, endH: 5, endM: 30 },
    { label: "🌙 Late (6.5h)", startH: 23, startM: 30, endH: 6, endM: 0 },
  ];

  return (
    <LinearGradient colors={["#05050F", "#0A0818", "#05050F"]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 60 : insets.top) + 16, paddingBottom: insets.bottom + 110 }}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Bedtime Guard</Text>
          <Text style={s.subtitle}>Block distracting apps at night</Text>
        </View>

        {/* Master toggle */}
        <View style={[s.card, { flexDirection: "row", alignItems: "center" }]}>
          <View style={s.moonIcon}>
            <Text style={{ fontSize: 24 }}>🌙</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.cardTitle}>Enable Bedtime Mode</Text>
            <Text style={s.cardDesc}>
              {bt.enabled
                ? `Protecting ${formatTime(bt.startHour, bt.startMin)} → ${formatTime(bt.endHour, bt.endMin)}`
                : "Tap to enable"}
            </Text>
          </View>
          <Switch
            value={bt.enabled}
            onValueChange={(v) => update({ enabled: v })}
            trackColor={{ false: C.switchTrack, true: C.tint + "88" }}
            thumbColor={bt.enabled ? C.tint : C.textMuted}
          />
        </View>

        {/* Sleep stats card */}
        <View style={s.card}>
          <Text style={s.cardSection}>Sleep Analysis</Text>
          <View style={s.sleepStatsRow}>
            <View style={s.sleepStat}>
              <Text style={[s.sleepStatNum, { color: rating.color }]}>
                {sleepHrs.toFixed(1)}h
              </Text>
              <Text style={s.sleepStatLabel}>Duration</Text>
            </View>
            <View style={s.divider} />
            <View style={s.sleepStat}>
              <Text style={[s.sleepStatNum, { color: rating.color }]}>{rating.text}</Text>
              <Text style={s.sleepStatLabel}>Rating</Text>
            </View>
            <View style={s.divider} />
            <View style={s.sleepStat}>
              <Text style={[s.sleepStatNum, { color: C.tint }]}>
                {formatTime(bt.endHour, bt.endMin)}
              </Text>
              <Text style={s.sleepStatLabel}>Wake up</Text>
            </View>
          </View>

          {/* Sleep quality bar */}
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${Math.min(100, (sleepHrs / 9) * 100)}%` as any, backgroundColor: rating.color }]} />
          </View>
          <Text style={s.barNote}>Recommended: 7–9 hours for adults</Text>
        </View>

        {/* Time wheels */}
        <View style={s.card}>
          <Text style={s.cardSection}>Bedtime Window</Text>
          <View style={s.wheelsRow}>
            <TimeWheel
              label="Bedtime"
              hour={bt.startHour}
              minute={bt.startMin}
              onHourChange={(h) => update({ startHour: h })}
              onMinChange={(m) => update({ startMin: m })}
            />
            <View style={s.arrowMiddle}>
              <Feather name="arrow-right" size={20} color={C.textMuted} />
              <Text style={s.arrowLabel}>until</Text>
            </View>
            <TimeWheel
              label="Wake up"
              hour={bt.endHour}
              minute={bt.endMin}
              onHourChange={(h) => update({ endHour: h })}
              onMinChange={(m) => update({ endMin: m })}
            />
          </View>
        </View>

        {/* Suggestions */}
        <View style={s.card}>
          <Text style={s.cardSection}>Suggestions</Text>
          <View style={s.suggestRow}>
            {SUGGESTIONS.map((sug) => (
              <TouchableOpacity
                key={sug.label}
                style={s.suggestChip}
                onPress={() => update({ startHour: sug.startH, startMin: sug.startM, endHour: sug.endH, endMin: sug.endM })}
                activeOpacity={0.8}
              >
                <Text style={s.suggestText}>{sug.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* What gets blocked */}
        <View style={[s.card, { borderColor: C.tint + "44" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <MaterialCommunityIcons name="shield-lock" size={18} color={C.tint} />
            <Text style={s.cardSection}>What Gets Blocked</Text>
          </View>
          <Text style={s.blockDesc}>
            During bedtime, all apps in your Block List (Settings tab) are closed automatically when opened. Go to Settings to customise which apps are blocked.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const tw = StyleSheet.create({
  wrap: { alignItems: "center", gap: 6 },
  label: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginBottom: 2 },
  wheel: { flexDirection: "row", alignItems: "center", gap: 6 },
  col: { alignItems: "center", gap: 4 },
  arrow: { width: 40, height: 32, alignItems: "center", justifyContent: "center" },
  valueBg: { backgroundColor: C.backgroundElevated, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, minWidth: 56, alignItems: "center" },
  value: { fontSize: 30, fontFamily: "Inter_700Bold", color: C.text },
  colon: { fontSize: 30, fontFamily: "Inter_700Bold", color: C.tint, marginTop: 2 },
  period: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
});

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 4 },
  card: { marginHorizontal: 16, marginBottom: 14, backgroundColor: C.backgroundCard, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  cardDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  cardSection: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.textSecondary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 },
  moonIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center" },
  sleepStatsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 14 },
  sleepStat: { alignItems: "center", gap: 4 },
  sleepStatNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sleepStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  divider: { width: 1, height: 40, backgroundColor: C.border },
  barBg: { height: 6, backgroundColor: C.backgroundElevated, borderRadius: 3, marginBottom: 6 },
  barFill: { height: 6, borderRadius: 3 },
  barNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  wheelsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  arrowMiddle: { alignItems: "center", gap: 4 },
  arrowLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textMuted },
  suggestRow: { gap: 8 },
  suggestChip: { backgroundColor: C.backgroundElevated, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  suggestText: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  blockDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 20 },
});
