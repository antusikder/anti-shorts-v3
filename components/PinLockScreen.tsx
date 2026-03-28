import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface PinLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
  C: any;
}

export default function PinLockScreen({ correctPin, onUnlock, C }: PinLockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handlePress = (val: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(false);
    
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUnlock();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError(true);
          setTimeout(() => setPin(""), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin(pin.slice(0, -1));
  };

  return (
    <LinearGradient colors={["#0D0B1E", "#05050A"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="shield-lock" size={48} color={C.amber} />
        </View>
        <Text style={styles.title}>Fresh Mind Elite</Text>
        <Text style={styles.subtitle}>Secure Access Required</Text>
      </View>

      <View style={styles.pinDisplay}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: pin.length >= i ? C.amber : "rgba(255,255,255,0.1)" },
              error && { backgroundColor: C.danger }
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.key}
                onPress={() => handlePress(val)}
              >
                <Text style={styles.keyText}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <View style={[styles.key, { opacity: 0 }]} />
          <TouchableOpacity style={styles.key} onPress={() => handlePress("0")}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <MaterialCommunityIcons name="backspace-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>Discipline is Freedom</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#A0A0B0", marginTop: 4 },
  pinDisplay: { flexDirection: "row", gap: 20, marginBottom: 60 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  keypad: { width: width * 0.8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontSize: 28, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  footer: { position: "absolute", bottom: 40, fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase" },
});
