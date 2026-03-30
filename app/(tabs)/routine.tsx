import React, { memo, useCallback, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMindset } from "@/context/MindsetContext";
import { C, R } from "@/constants/colors";

const { width: SW } = Dimensions.get("window");

// ── Circadian Card ───────────────────────────────────────────────────────────

const CircadianCard = memo(() => {
  const wakeUpTimes = useMemo(() => {
    const now = new Date();
    const fallAsleepMin = 14; // Average time to fall asleep
    const cycleMin = 90;
    
    return [3, 4, 5, 6].map((cycles) => {
      const time = new Date(now.getTime() + (cycles * cycleMin + fallAsleepMin) * 60000);
      return {
        cycles,
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        label: cycles === 5 ? "Optimal" : cycles === 6 ? "Restorative" : cycles === 4 ? "Viable" : "Emergency",
        hours: (cycles * 1.5).toFixed(1),
      };
    });
  }, []);

  return (
    <View style={rs.card}>
      <View style={rs.cardHeader}>
        <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={C.amber} />
        <Text style={rs.cardTitle}>Circadian Alignment</Text>
      </View>
      <Text style={rs.cardDesc}>
        Sleep cycles are 90 minutes. Waking up between cycles prevents grogginess.
      </Text>
      
      <View style={rs.sleepGrid}>
        {wakeUpTimes.map((item) => (
          <View key={item.cycles} style={[rs.cycleBox, item.cycles === 5 && rs.cycleBoxActive]}>
            <Text style={[rs.cycleTime, item.cycles === 5 && { color: C.amber }]}>{item.time}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
               <Text style={rs.cycleMeta}>{item.hours}h</Text>
               <Text style={rs.cycleMeta}>·</Text>
               <Text style={[rs.cycleLabel, item.cycles === 5 && { color: C.amber }]}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={rs.tipRow}>
        <MaterialCommunityIcons name="information-outline" size={14} color={C.textMuted} />
        <Text style={rs.tipText}>Calculated for sleep starting right now (+14m fall-asleep buffer).</Text>
      </View>
    </View>
  );
});

// ── Routine Tracker ──────────────────────────────────────────────────────────

const RoutineTracker = memo(() => {
  const { mindset, updateWeeklyRoutine } = useMindset();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }) as any;
  const todayRoutine = mindset.weeklyRoutine.find(r => r.day === today) || mindset.weeklyRoutine[0];

  const handleAdd = () => {
    Alert.alert("Custom Routine", "Routine editing is available in the Mindset tab under 'Deep Work Routine'.");
  };

  return (
    <View style={rs.card}>
       <View style={rs.cardHeader}>
        <MaterialCommunityIcons name="calendar-sync" size={20} color={C.amber} />
        <Text style={rs.cardTitle}>Current Routine: {today}</Text>
      </View>
      
      {todayRoutine.blocks.length === 0 ? (
        <View style={rs.emptyBlock}>
           <Text style={rs.emptyBlockText}>No blocks scheduled for {today}.</Text>
           <TouchableOpacity onPress={handleAdd} style={rs.addBtn}>
              <Text style={rs.addBtnText}>Schedule Deep Work</Text>
           </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 8, marginTop: 4 }}>
          {todayRoutine.blocks.map((block) => (
            <View key={block.id} style={rs.blockRow}>
              <View style={[rs.blockDot, { backgroundColor: block.type === 'work' ? C.amber : block.type === 'exercise' ? C.success : C.info }]} />
              <View style={{ flex: 1 }}>
                <Text style={rs.blockLabel}>{block.label}</Text>
                <Text style={rs.blockTime}>
                  {block.startHour}:{block.startMin.toString().padStart(2,'0')} - {block.endHour}:{block.endMin.toString().padStart(2,'0')}
                </Text>
              </View>
              <View style={rs.blockTypeBadge}>
                 <Text style={rs.blockTypeText}>{block.type}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

// ── Recovery Tips ─────────────────────────────────────────────────────────────

const RECOVERY_TIPS = [
  { icon: "eye-off", title: "No Blue Light", desc: "Turn off screens 60m before bed to boost Melatonin." },
  { icon: "cup-water", title: "Hydrate", desc: "Drink 500ml of water immediately upon waking." },
  { icon: "brain", title: "Mindfulness", desc: "5 minutes of deep breathing resets the nervous system." },
  { icon: "weather-sunny", title: "Morning Sun", desc: "10m of morning sun anchors your circadian clock." },
];

const RecoverySection = memo(() => (
  <View style={{ marginTop: 20 }}>
    <Text style={rs.sectionLabel}>Recovery Protocols</Text>
    <View style={rs.tipsGrid}>
      {RECOVERY_TIPS.map((tip, i) => (
        <View key={i} style={rs.tipCard}>
          <MaterialCommunityIcons name={tip.icon as any} size={22} color={C.amber} style={{ marginBottom: 8 }} />
          <Text style={rs.tipTitle}>{tip.title}</Text>
          <Text style={rs.tipDescText}>{tip.desc}</Text>
        </View>
      ))}
    </View>
  </View>
));

// ── Main Screen ───────────────────────────────────────────────────────────────

export default memo(function RoutineScreen() {
  return (
    <View style={rs.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={rs.scroll} showsVerticalScrollIndicator={false}>
          <View style={rs.header}>
            <Text style={rs.title}>Routine</Text>
            <Text style={rs.subtitle}>Biological and tactical optimization.</Text>
          </View>

          <CircadianCard />
          <RoutineTracker />
          <RecoverySection />

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
});

const rs = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  header: { marginBottom: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginTop: 4 },
  
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text },
  cardDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 16 },

  sleepGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cycleBox: { flex: 1, minWidth: "45%", backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12 },
  cycleBoxActive: { borderColor: C.amberBorder, backgroundColor: C.amberBg },
  cycleTime: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.text },
  cycleMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted },
  cycleLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textMuted },
  
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, flex: 1 },

  emptyBlock: { alignItems: "center", paddingVertical: 20 },
  emptyBlockText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginBottom: 12 },
  addBtn: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, borderRadius: R.button, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textSub },

  blockRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.bgElevated, padding: 12, borderRadius: 10, marginBottom: 6 },
  blockDot: { width: 8, height: 8, borderRadius: 4 },
  blockLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  blockTime: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, marginTop: 2 },
  blockTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  blockTypeText: { fontFamily: "Inter_500Medium", fontSize: 10, color: C.textMuted, textTransform: "capitalize" },

  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 },
  tipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tipCard: { width: "48.5%", backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 14 },
  tipTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text, marginBottom: 4 },
  tipDescText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, lineHeight: 16 },
});
