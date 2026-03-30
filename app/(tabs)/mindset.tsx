import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, AppState, AppStateStatus, Vibration, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useMindset } from "@/context/MindsetContext";
import { C, R, S } from "@/constants/colors";

const SCREEN_TIME_KEY = "@freshmind:screentime_v3";

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1: SCREEN TIME
// ════════════════════════════════════════════════════════════════════════════

const ScreenTimeSection = memo(() => {
  const { mindset, updateScreenTime } = useMindset();
  const st = mindset.screenTime;

  const [usedSeconds, setUsedSeconds] = useState(0);
  const [showBlocker, setShowBlocker] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const intervalRef = useRef<any>(null);

  // Load persisted seconds
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SCREEN_TIME_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.date === new Date().toDateString()) setUsedSeconds(d.usedSeconds ?? 0);
        }
      } catch {}
    })();
  }, []);

  // Track time while screen is active
  useEffect(() => {
    if (!st.enabled) { if (intervalRef.current) clearInterval(intervalRef.current); return; }

    intervalRef.current = setInterval(() => {
      setUsedSeconds(prev => {
        const next = prev + 1;
        if (next % 15 === 0) {
          AsyncStorage.setItem(SCREEN_TIME_KEY, JSON.stringify({
            date: new Date().toDateString(), usedSeconds: next,
          })).catch(() => {});
        }
        const limitSec = st.dailyLimitMin * 60;
        if (next >= limitSec && !showBlocker) {
          setShowBlocker(true);
          setCooldownSec(st.cooldownMin * 60);
          Vibration.vibrate([0, 300, 100, 300]);
          Notifications.scheduleNotificationAsync({
            content: { title: "Screen time limit reached", body: `Take a ${st.cooldownMin}-minute break.` },
            trigger: null,
          }).catch(() => {});
        }
        return next;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [st.enabled, st.dailyLimitMin]);

  // Cooldown countdown
  useEffect(() => {
    if (!showBlocker || cooldownSec <= 0) return;
    const t = setInterval(() => setCooldownSec(p => {
      if (p <= 1) { clearInterval(t); setShowBlocker(false); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [showBlocker]);

  const pct = Math.min(100, Math.round(usedSeconds / (st.dailyLimitMin * 60) * 100));
  const usedMin = Math.floor(usedSeconds / 60);
  const color = pct >= 100 ? C.danger : pct >= 80 ? C.warn : C.success;

  return (
    <>
      {showBlocker && (
        <View style={sov.overlay}>
          <MaterialCommunityIcons name="shield-lock" size={56} color={C.accent} />
          <Text style={sov.title}>Screen Time Limit Reached</Text>
          <Text style={sov.sub}>Take a break. Come back refreshed.</Text>
          <View style={sov.timerCard}>
            <Text style={sov.timerLabel}>Break cooldown</Text>
            <Text style={sov.timer}>
              {String(Math.floor(cooldownSec / 60)).padStart(2, "0")}:{String(cooldownSec % 60).padStart(2, "0")}
            </Text>
          </View>
        </View>
      )}

      <View style={ss.card}>
        <View style={ss.row}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <MaterialCommunityIcons name="timer-sand" size={18} color={C.accent} />
            <Text style={ss.title}>Screen Time</Text>
          </View>
          <Switch
            value={st.enabled}
            onValueChange={v => updateScreenTime({ ...st, enabled: v })}
            trackColor={{ false: "rgba(255,255,255,0.08)", true: C.accentBg }}
            thumbColor={st.enabled ? C.accent : C.textMuted}
          />
        </View>

        {st.enabled && (
          <>
            <Text style={ss.timeDisplay}>{usedMin}<Text style={ss.timeUnit}> / {st.dailyLimitMin} min</Text></Text>

            {/* Progress bar */}
            <View style={ss.barTrack}>
              <View style={[ss.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={[ss.pct, { color }]}>{pct}% of daily limit</Text>

            {/* Limit input */}
            <View style={ss.inputRow}>
              <Text style={ss.inputLabel}>Daily Limit (min)</Text>
              <TextInput
                style={ss.input}
                value={st.dailyLimitMin.toString()}
                onChangeText={t => { const n = parseInt(t) || 60; updateScreenTime({ ...st, dailyLimitMin: Math.max(1, Math.min(480, n)) }); }}
                keyboardType="number-pad"
                selectTextOnFocus
              />
            </View>
          </>
        )}
      </View>
    </>
  );
});

const sov = StyleSheet.create({
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
    backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 32,
  },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: C.text, textAlign: "center", marginBottom: 8, marginTop: 20 },
  sub: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, textAlign: "center", marginBottom: 32 },
  timerCard: { backgroundColor: C.bgCard, borderRadius: R.card, borderWidth: 1, borderColor: C.accentBorder, padding: 24, alignItems: "center", width: "100%" },
  timerLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  timer: { fontFamily: "Nunito_800ExtraBold", fontSize: 56, color: C.accent, letterSpacing: -2 },
});

const ss = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text },
  timeDisplay: { fontFamily: "Nunito_800ExtraBold", fontSize: 40, color: C.text, letterSpacing: -1, marginBottom: 12 },
  timeUnit: { fontFamily: "Nunito_400Regular", fontSize: 18, color: C.textMuted },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: C.bgElevated, overflow: "hidden", marginBottom: 6 },
  barFill: { height: "100%", borderRadius: 4 },
  pct: { fontFamily: "Nunito_600SemiBold", fontSize: 12, marginBottom: 16 },
  inputRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inputLabel: { fontFamily: "Nunito_500Medium", fontSize: 14, color: C.textSub },
  input: {
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    borderRadius: R.input, paddingVertical: 8, paddingHorizontal: 14,
    fontFamily: "Nunito_700Bold", fontSize: 18, color: C.text, textAlign: "center", minWidth: 70,
  },
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2: FOCUS TIMER
// ════════════════════════════════════════════════════════════════════════════

const FocusSection = memo(() => {
  const [durationMin, setDurationMin] = useState(25);
  const [running, setRunning] = useState(false);
  const [remainingSec, setRemainingSec] = useState(25 * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const timerRef = useRef<any>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const startSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRemainingSec(durationMin * 60);
    setRunning(true);
    Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
  };

  const stopSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRemainingSec(durationMin * 60);
    Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  };

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setRemainingSec(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setRunning(false);
          setSessionCount(c => c + 1);
          Vibration.vibrate([0, 200, 100, 200, 100, 400]);
          Notifications.scheduleNotificationAsync({
            content: { title: "Focus session complete! 🎉", body: `${durationMin} minutes of deep work done.` },
            trigger: null,
          }).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const percentage = Math.round((1 - remainingSec / (durationMin * 60)) * 100);

  return (
    <View style={fs.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <View style={fs.iconBox}>
          <MaterialCommunityIcons name="meditation" size={18} color={C.accent} />
        </View>
        <Text style={fs.cardTitle}>Focus Timer</Text>
        {sessionCount > 0 && (
          <View style={fs.badge}>
            <Text style={fs.badgeText}>{sessionCount} done today</Text>
          </View>
        )}
      </View>

      {/* Big timer display */}
      <View style={fs.timerDisplay}>
        <Text style={fs.timerText}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </Text>
        {running && <Text style={fs.progressText}>{percentage}% complete</Text>}
      </View>

      {/* Duration picker */}
      {!running && (
        <View style={fs.durationRow}>
          {[15, 25, 45, 60, 90].map(m => (
            <TouchableOpacity
              key={m}
              style={[fs.durChip, durationMin === m && fs.durChipActive]}
              onPress={() => { setDurationMin(m); setRemainingSec(m * 60); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Text style={[fs.durText, durationMin === m && { color: C.accent }]}>{m}m</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Control button */}
      <TouchableOpacity
        style={[fs.btn, running && fs.btnStop]}
        onPress={running ? stopSession : startSession}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name={running ? "pause" : "play"} size={20} color={running ? C.text : C.bg} />
        <Text style={[fs.btnText, running && { color: C.text }]}>
          {running ? "Stop Session" : "Start Focus"}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const fs = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accentBorder, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text, flex: 1 },
  badge: { backgroundColor: C.successBg, borderRadius: R.circle, paddingVertical: 3, paddingHorizontal: 10 },
  badgeText: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: C.success },
  timerDisplay: { alignItems: "center", paddingVertical: 24 },
  timerText: { fontFamily: "Nunito_800ExtraBold", fontSize: 64, color: C.text, letterSpacing: -3 },
  progressText: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textMuted, marginTop: 6 },
  durationRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  durChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: R.circle, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border },
  durChipActive: { backgroundColor: C.accentBg, borderColor: C.accentBorder },
  durText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textMuted },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: R.button, backgroundColor: C.accent },
  btnStop: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderMid },
  btnText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.bg },
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3: BEDTIME & SLEEP
// ════════════════════════════════════════════════════════════════════════════

const BedtimeSection = memo(() => {
  const { mindset, updateBedtime } = useMindset();
  const bt = mindset.bedtime;

  const formatHour = (h: number) => {
    const ampm = h < 12 ? "AM" : "PM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${ampm}`;
  };

  return (
    <View style={be.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <View style={be.iconBox}>
          <MaterialCommunityIcons name="weather-night" size={18} color={C.info} />
        </View>
        <Text style={be.title}>Bedtime</Text>
        <View style={{ flex: 1 }} />
        <Switch
          value={bt.enabled}
          onValueChange={v => updateBedtime({ ...bt, enabled: v })}
          trackColor={{ false: "rgba(255,255,255,0.08)", true: C.accentBg }}
          thumbColor={bt.enabled ? C.accent : C.textMuted}
        />
      </View>

      {bt.enabled && (
        <>
          {/* Sleep arc visualization */}
          <View style={be.arcRow}>
            <View style={be.timeCard}>
              <MaterialCommunityIcons name="sleep" size={16} color={C.info} />
              <Text style={be.timeLabel}>Bedtime</Text>
              <Text style={be.timeValue}>{formatHour(bt.bedHour)}</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={20} color={C.textMuted} />
            <View style={be.timeCard}>
              <MaterialCommunityIcons name="weather-sunny" size={16} color={C.accent} />
              <Text style={be.timeLabel}>Wake up</Text>
              <Text style={be.timeValue}>{formatHour(bt.wakeHour)}</Text>
            </View>
          </View>

          {/* Adjust bedtime */}
          <View style={be.adjustRow}>
            <Text style={be.adjustLabel}>Bedtime hour</Text>
            <View style={be.stepper}>
              <TouchableOpacity onPress={() => updateBedtime({ ...bt, bedHour: Math.max(18, bt.bedHour - 1) })} style={be.stepBtn}>
                <MaterialCommunityIcons name="minus" size={16} color={C.accent} />
              </TouchableOpacity>
              <Text style={be.stepValue}>{formatHour(bt.bedHour)}</Text>
              <TouchableOpacity onPress={() => updateBedtime({ ...bt, bedHour: Math.min(23, bt.bedHour + 1) })} style={be.stepBtn}>
                <MaterialCommunityIcons name="plus" size={16} color={C.accent} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={be.adjustRow}>
            <Text style={be.adjustLabel}>Wake hour</Text>
            <View style={be.stepper}>
              <TouchableOpacity onPress={() => updateBedtime({ ...bt, wakeHour: Math.max(4, bt.wakeHour - 1) })} style={be.stepBtn}>
                <MaterialCommunityIcons name="minus" size={16} color={C.accent} />
              </TouchableOpacity>
              <Text style={be.stepValue}>{formatHour(bt.wakeHour)}</Text>
              <TouchableOpacity onPress={() => updateBedtime({ ...bt, wakeHour: Math.min(12, bt.wakeHour + 1) })} style={be.stepBtn}>
                <MaterialCommunityIcons name="plus" size={16} color={C.accent} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={be.sleepDuration}>
            Goal: {(() => {
              const dur = bt.bedHour > bt.wakeHour
                ? (24 - bt.bedHour) + bt.wakeHour
                : bt.wakeHour - bt.bedHour;
              return `${dur} hours of sleep`;
            })()}
          </Text>
        </>
      )}
    </View>
  );
});

const be = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.infoBg, borderWidth: 1, borderColor: "rgba(107,159,212,0.25)", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text },
  arcRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 20 },
  timeCard: { alignItems: "center", gap: 4 },
  timeLabel: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  timeValue: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: C.text },
  adjustRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  adjustLabel: { fontFamily: "Nunito_500Medium", fontSize: 14, color: C.textSub },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  stepValue: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text, minWidth: 80, textAlign: "center" },
  sleepDuration: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.success, textAlign: "center", marginTop: 4 },
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function MindsetScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: S.pagePad, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingTop: 8, marginBottom: 20 }}>
            <Text style={pr.heading}>Mindset</Text>
            <Text style={pr.subheading}>Screen time, focus sessions, and sleep</Text>
          </View>

          <ScreenTimeSection />
          <FocusSection />
          <BedtimeSection />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const pr = StyleSheet.create({
  heading: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, color: C.text, letterSpacing: -0.5 },
  subheading: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, marginTop: 4 },
});
