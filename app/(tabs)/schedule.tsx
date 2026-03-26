import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { usePlanner, ScheduleSlot } from "@/context/PlannerContext";
import { AccessibilityModule, InstalledApp } from "@/modules/AccessibilityModule";

const C = Colors.dark;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const APP_COLORS = [C.tint, C.youtube, C.facebook, C.amber, C.green, C.info];

function pad2(n: number) { return n.toString().padStart(2, "0"); }

function formatSlotTime(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${pad2(m)} ${period}`;
}

function SlotCard({ slot, onDelete }: { slot: ScheduleSlot; onDelete: () => void }) {
  const dayLabel = DAY_LABELS[slot.dayOfWeek];
  const appColor = APP_COLORS[slot.appPkg.length % APP_COLORS.length];
  return (
    <View style={sc.slotCard}>
      <View style={[sc.slotDayBadge, { backgroundColor: C.tint + "22" }]}>
        <Text style={[sc.slotDay, { color: C.tint }]}>{dayLabel}</Text>
      </View>
      <View style={sc.slotInfo}>
        <Text style={sc.slotApp}>{slot.appName}</Text>
        <Text style={sc.slotTime}>
          {formatSlotTime(slot.allowedStartHour, slot.allowedStartMin)} —{" "}
          {formatSlotTime(slot.allowedEndHour, slot.allowedEndMin)}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={sc.delBtn} activeOpacity={0.7}>
        <Feather name="trash-2" size={14} color={C.danger} />
      </TouchableOpacity>
    </View>
  );
}

function TimeStepper({
  hour,
  min,
  onHourChange,
  onMinChange,
  label,
}: {
  hour: number;
  min: number;
  onHourChange: (h: number) => void;
  onMinChange: (m: number) => void;
  label: string;
}) {
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity onPress={() => onHourChange((hour + 1) % 24)} style={ts.stepBtn}>
            <Feather name="chevron-up" size={14} color={C.text} />
          </TouchableOpacity>
          <Text style={ts.val}>{pad2(hour)}</Text>
          <TouchableOpacity onPress={() => onHourChange((hour - 1 + 24) % 24)} style={ts.stepBtn}>
            <Feather name="chevron-down" size={14} color={C.text} />
          </TouchableOpacity>
        </View>
        <Text style={ts.colon}>:</Text>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity onPress={() => onMinChange((min + 15) % 60)} style={ts.stepBtn}>
            <Feather name="chevron-up" size={14} color={C.text} />
          </TouchableOpacity>
          <Text style={ts.val}>{pad2(min)}</Text>
          <TouchableOpacity onPress={() => onMinChange((min - 15 + 60) % 60)} style={ts.stepBtn}>
            <Feather name="chevron-down" size={14} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function AddSlotModal({
  visible,
  onDismiss,
  onAdd,
}: {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (slot: Omit<ScheduleSlot, "id">) => void;
}) {
  const [step, setStep] = useState<"app" | "time">("app");
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<InstalledApp | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [startH, setStartH] = useState(18);
  const [startM, setStartM] = useState(0);
  const [endH, setEndH] = useState(20);
  const [endM, setEndM] = useState(0);

  const loadApps = async () => {
    setLoading(true);
    const list = await AccessibilityModule.getInstalledApps();
    setApps(list.slice(0, 40));
    setLoading(false);
  };

  React.useEffect(() => {
    if (visible) { setStep("app"); setSelectedApp(null); loadApps(); }
  }, [visible]);

  const handleAdd = () => {
    if (!selectedApp) return;
    onAdd({
      dayOfWeek: selectedDay,
      appPkg: selectedApp.pkg,
      appName: selectedApp.name,
      allowedStartHour: startH,
      allowedStartMin: startM,
      allowedEndHour: endH,
      allowedEndMin: endM,
    });
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          {step === "app" ? (
            <>
              <Text style={modal.title}>Select App</Text>
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {loading && <Text style={{ color: C.textMuted, textAlign: "center", padding: 20 }}>Loading…</Text>}
                {apps.map((app) => (
                  <TouchableOpacity
                    key={app.pkg}
                    style={[modal.appRow, selectedApp?.pkg === app.pkg && { backgroundColor: C.tint + "33" }]}
                    onPress={() => setSelectedApp(app)}
                    activeOpacity={0.7}
                  >
                    <View style={modal.appIcon}>
                      <Text style={{ fontSize: 16 }}>{app.name.charAt(0)}</Text>
                    </View>
                    <Text style={modal.appName}>{app.name}</Text>
                    {selectedApp?.pkg === app.pkg && <Feather name="check" size={16} color={C.tint} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={modal.btnRow}>
                <TouchableOpacity style={modal.cancelBtn} onPress={onDismiss}><Text style={modal.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[modal.addBtn, !selectedApp && { opacity: 0.4 }]} onPress={() => selectedApp && setStep("time")} disabled={!selectedApp}>
                  <Text style={modal.addText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={modal.title}>Set Schedule</Text>
              <Text style={modal.subtitle}>{selectedApp?.name}</Text>

              {/* Day picker */}
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {DAY_LABELS.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[modal.dayBtn, selectedDay === i && { backgroundColor: C.tint }]}
                    onPress={() => setSelectedDay(i)}
                    activeOpacity={0.8}
                  >
                    <Text style={[modal.dayBtnText, selectedDay === i && { color: "#fff" }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time selectors */}
              <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12 }}>
                <TimeStepper hour={startH} min={startM} onHourChange={setStartH} onMinChange={setStartM} label="From" />
                <View style={{ alignSelf: "center" }}>
                  <Text style={{ color: C.textMuted, fontSize: 20 }}>→</Text>
                </View>
                <TimeStepper hour={endH} min={endM} onHourChange={setEndH} onMinChange={setEndM} label="Until" />
              </View>

              <Text style={{ color: C.textMuted, fontSize: 12, textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" }}>
                Outside this window, {selectedApp?.name} will be blocked
              </Text>

              <View style={modal.btnRow}>
                <TouchableOpacity style={modal.cancelBtn} onPress={() => setStep("app")}><Text style={modal.cancelText}>← Back</Text></TouchableOpacity>
                <TouchableOpacity style={modal.addBtn} onPress={handleAdd}><Text style={modal.addText}>Add Rule</Text></TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { scheduleSlots, addScheduleSlot, removeScheduleSlot } = usePlanner();
  const [showAdd, setShowAdd] = useState(false);
  const [activeDay, setActiveDay] = useState(new Date().getDay());

  const todaySlots = scheduleSlots.filter((s) => s.dayOfWeek === activeDay);

  return (
    <LinearGradient colors={[C.background, "#050D1A", C.background]} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 60 : insets.top) + 16, paddingBottom: insets.bottom + 110 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Screen Time</Text>
          <Text style={styles.subtitle}>Set when apps are allowed</Text>
        </View>

        {/* Day strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {DAY_LABELS.map((d, i) => {
            const count = scheduleSlots.filter((s) => s.dayOfWeek === i).length;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayChip, activeDay === i && { backgroundColor: C.tint }]}
                onPress={() => { Haptics.selectionAsync(); setActiveDay(i); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayChipText, activeDay === i && { color: "#fff" }]}>{d}</Text>
                {count > 0 && (
                  <View style={[styles.dayDot, { backgroundColor: activeDay === i ? "#fff" : C.tint }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Info card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={16} color={C.info} />
          <Text style={styles.infoText}>
            Apps are blocked <Text style={{ color: C.amber, fontFamily: "Inter_600SemiBold" }}>outside</Text> their allowed window. The Productive accessibility service enforces this automatically.
          </Text>
        </View>

        {/* Slot list */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{DAY_LABELS[activeDay]} Rules</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { Haptics.selectionAsync(); setShowAdd(true); }} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Rule</Text>
          </TouchableOpacity>
        </View>

        {todaySlots.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clock-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No rules for {DAY_LABELS[activeDay]}</Text>
            <Text style={styles.emptyDesc}>Add a rule to restrict app usage</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {todaySlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onDelete={() => Alert.alert(
                  "Delete Rule",
                  `Remove schedule for ${slot.appName}?`,
                  [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => removeScheduleSlot(slot.id) }]
                )}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AddSlotModal visible={showAdd} onDismiss={() => setShowAdd(false)} onAdd={addScheduleSlot} />
    </LinearGradient>
  );
}

const sc = StyleSheet.create({
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.backgroundCard,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  slotDayBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 44, alignItems: "center" },
  slotDay: { fontSize: 12, fontFamily: "Inter_700Bold" },
  slotInfo: { flex: 1 },
  slotApp: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  slotTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  delBtn: { padding: 6 },
});

const ts = StyleSheet.create({
  stepBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  val: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, minWidth: 36, textAlign: "center" },
  colon: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.tint, marginBottom: 4 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: C.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 34 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: -8 },
  appRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10 },
  appIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundElevated, alignItems: "center", justifyContent: "center" },
  appName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  dayBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.backgroundElevated },
  dayBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: C.backgroundElevated, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  addBtn: { flex: 1, backgroundColor: C.tint, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  addText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 4 },
  dayStrip: { marginBottom: 16 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.backgroundCard, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  dayChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  dayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  infoCard: { flexDirection: "row", gap: 10, backgroundColor: C.info + "11", borderWidth: 1, borderColor: C.info + "33", borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 },
  listTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.tint, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  empty: { alignItems: "center", padding: 40, gap: 8 },
  emptyText: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  list: { paddingHorizontal: 16, gap: 10 },
});
