import React, { memo, useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useSettings } from "@/context/SettingsContext";
import { useWorkout } from "@/context/WorkoutContext";
import { C, R } from "@/constants/colors";

const BKASH_NUMBER = "+8801581872622";
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(BKASH_NUMBER)}&bgcolor=080810&color=F5A623`;

// ════════════════════════════════════════════════════════════════════════════
// PIN MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

const PinSection = memo(() => {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  // Check if PIN exists
  React.useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync("app_pin");
        setHasPin(!!stored);
      } catch {
        setHasPin(false);
      }
    })();
  }, []);

  const savePin = async () => {
    if (newPin.length !== 4) {
      Alert.alert("Error", "PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert("Error", "PINs don't match. Try again.");
      return;
    }
    if (hasPin) {
      // Verify current PIN
      const stored = await SecureStore.getItemAsync("app_pin");
      if (currentPin !== stored) {
        Alert.alert("Error", "Current PIN is incorrect.");
        return;
      }
    }
    try {
      await SecureStore.setItemAsync("app_pin", newPin);
      setHasPin(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "PIN has been saved. It will be required on next app launch.");
    } catch {
      Alert.alert("Error", "Failed to save PIN.");
    }
  };

  const removePin = async () => {
    const stored = await SecureStore.getItemAsync("app_pin");
    if (currentPin !== stored) {
      Alert.alert("Error", "Current PIN is incorrect.");
      return;
    }
    try {
      await SecureStore.deleteItemAsync("app_pin");
      setHasPin(false);
      setCurrentPin("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Removed", "App lock PIN has been removed.");
    } catch {
      Alert.alert("Error", "Failed to remove PIN.");
    }
  };

  return (
    <View style={sec.card}>
      <View style={sec.header}>
        <MaterialCommunityIcons name="lock" size={20} color={C.amber} />
        <Text style={sec.title}>App Lock PIN</Text>
        <View style={[sec.badge, { backgroundColor: hasPin ? C.successBg : C.dangerBg }]}>
          <Text style={[sec.badgeText, { color: hasPin ? C.success : C.danger }]}>
            {hasPin ? "Active" : "Not Set"}
          </Text>
        </View>
      </View>

      {hasPin && (
        <View style={sec.inputRow}>
          <Text style={sec.inputLabel}>Current PIN</Text>
          <TextInput
            style={sec.pinInput}
            value={currentPin}
            onChangeText={setCurrentPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="····"
            placeholderTextColor={C.textMuted}
          />
        </View>
      )}

      <View style={sec.inputRow}>
        <Text style={sec.inputLabel}>{hasPin ? "New PIN" : "Set PIN"}</Text>
        <TextInput
          style={sec.pinInput}
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          placeholder="····"
          placeholderTextColor={C.textMuted}
        />
      </View>

      <View style={sec.inputRow}>
        <Text style={sec.inputLabel}>Confirm PIN</Text>
        <TextInput
          style={sec.pinInput}
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          placeholder="····"
          placeholderTextColor={C.textMuted}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity style={sec.saveBtn} onPress={savePin} activeOpacity={0.85}>
          <Text style={sec.saveBtnText}>{hasPin ? "Update PIN" : "Set PIN"}</Text>
        </TouchableOpacity>
        {hasPin && (
          <TouchableOpacity style={sec.deleteBtn} onPress={removePin} activeOpacity={0.85}>
            <Text style={sec.deleteBtnText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// FITNESS PROFILE
// ════════════════════════════════════════════════════════════════════════════

const FitnessProfile = memo(() => {
  const { workout, updateSettings } = useWorkout();
  const s = workout.settings;

  const [weight, setWeight] = useState(s.weight.toString());
  const [height, setHeight] = useState(s.height.toString());
  const [age, setAge] = useState(s.age.toString());

  const save = () => {
    updateSettings({
      weight: parseFloat(weight) || 70,
      height: parseFloat(height) || 170,
      age: parseInt(age) || 25,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Fitness profile updated.");
  };

  return (
    <View style={sec.card}>
      <View style={sec.header}>
        <MaterialCommunityIcons name="human" size={20} color={C.amber} />
        <Text style={sec.title}>Fitness Profile</Text>
      </View>

      <View style={sec.inputRow}>
        <Text style={sec.inputLabel}>Weight (kg)</Text>
        <TextInput style={sec.numInput} value={weight} onChangeText={setWeight} keyboardType="numeric" selectTextOnFocus />
      </View>
      <View style={sec.inputRow}>
        <Text style={sec.inputLabel}>Height (cm)</Text>
        <TextInput style={sec.numInput} value={height} onChangeText={setHeight} keyboardType="numeric" selectTextOnFocus />
      </View>
      <View style={sec.inputRow}>
        <Text style={sec.inputLabel}>Age</Text>
        <TextInput style={sec.numInput} value={age} onChangeText={setAge} keyboardType="numeric" selectTextOnFocus />
      </View>

      <TouchableOpacity style={sec.saveBtn} onPress={save} activeOpacity={0.85}>
        <Text style={sec.saveBtnText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// SUPPORT / TIP JAR
// ════════════════════════════════════════════════════════════════════════════

const SupportSection = memo(() => {
  const openBkash = () => {
    Linking.openURL(`tel:${BKASH_NUMBER}`).catch(() => {
      Alert.alert("bKash / Nagad", `Send to: ${BKASH_NUMBER}`);
    });
  };

  return (
    <View style={sec.card}>
      <View style={sec.header}>
        <MaterialCommunityIcons name="heart" size={20} color={C.amber} />
        <Text style={sec.title}>Support Development</Text>
      </View>

      <Text style={sec.desc}>
        If Fresh Mind Elite is helping you stay focused, consider supporting the developer via bKash or Nagad.
      </Text>

      <TouchableOpacity onPress={openBkash} style={sec.qrWrap} activeOpacity={0.85}>
        <Image
          source={{ uri: QR_URL }}
          style={sec.qrImage}
          resizeMode="contain"
        />
        <Text style={sec.qrNum}>{BKASH_NUMBER}</Text>
        <Text style={sec.qrHint}>Tap to call · bKash / Nagad</Text>
      </TouchableOpacity>
    </View>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS TEST
// ════════════════════════════════════════════════════════════════════════════

const NotificationTest = memo(() => {
  const testNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Fresh Mind Elite System",
          body: "Push notifications are successfully configured and active.",
        },
        trigger: null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to send test notification. Check your notification permissions.");
    }
  };

  return (
    <View style={sec.card}>
      <View style={sec.header}>
        <MaterialCommunityIcons name="bell-ring" size={20} color={C.amber} />
        <Text style={sec.title}>Notifications</Text>
      </View>
      <TouchableOpacity style={sec.saveBtn} onPress={testNotification} activeOpacity={0.85}>
        <Text style={sec.saveBtnText}>Send Test Notification</Text>
      </TouchableOpacity>
    </View>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// DATA MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

const DataSection = memo(() => {
  const { resetStats } = useSettings();

  const handleReset = () => {
    Alert.alert(
      "Reset Stats",
      "This will reset all shield stats to zero. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetStats();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  return (
    <View style={sec.card}>
      <View style={sec.header}>
        <MaterialCommunityIcons name="database" size={20} color={C.amber} />
        <Text style={sec.title}>Data</Text>
      </View>
      <TouchableOpacity style={sec.deleteBtn} onPress={handleReset} activeOpacity={0.85}>
        <Text style={sec.deleteBtnText}>Reset Shield Stats</Text>
      </TouchableOpacity>
    </View>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default memo(function SettingsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={C.text} />
            </TouchableOpacity>
            <View>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, letterSpacing: -0.5 }}>
                Settings
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                Security, profiles, and support.
              </Text>
            </View>
          </View>

          <PinSection />
          <FitnessProfile />
          <NotificationTest />
          <SupportSection />
          <DataSection />

          {/* About */}
          <View style={[sec.card, { alignItems: "center" }]}>
            <MaterialCommunityIcons name="shield-crown" size={32} color={C.amber} style={{ marginBottom: 8 }} />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: C.text, marginBottom: 4 }}>
              Fresh Mind Elite Engine
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, marginTop: 2 }}>
              v5.0 · Built with Precision
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
});

const sec = StyleSheet.create({
  card: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.card, padding: 16, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text, flex: 1 },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: R.circle },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 16 },
  inputRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.textSub },
  pinInput: {
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    borderRadius: R.button, paddingVertical: 10, paddingHorizontal: 16,
    fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, textAlign: "center",
    minWidth: 100, letterSpacing: 8,
  },
  numInput: {
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border,
    borderRadius: R.button, paddingVertical: 8, paddingHorizontal: 14,
    fontFamily: "Inter_600SemiBold", fontSize: 18, color: C.text, textAlign: "center",
    minWidth: 80,
  },
  saveBtn: { flex: 1, backgroundColor: C.amber, borderRadius: R.button, paddingVertical: 12, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.bg },
  deleteBtn: { flex: 1, backgroundColor: C.dangerBg, borderWidth: 1, borderColor: C.dangerBorder, borderRadius: R.button, paddingVertical: 12, alignItems: "center" },
  deleteBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.danger },
  qrWrap: { alignItems: "center", padding: 20, backgroundColor: C.bgElevated, borderRadius: R.card, borderWidth: 1, borderColor: C.border },
  qrImage: { width: 180, height: 180, marginBottom: 12 },
  qrNum: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.amber, marginBottom: 4 },
  qrHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
});
