import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Vibration, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { C, R } from "@/constants/colors";

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

interface Props {
  onUnlocked: () => void;
}

export default function PinLockScreen({ onUnlocked }: Props) {
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockout, setLockout] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(LOCKOUT_SECONDS);
  const [shakeAnim] = useState(new Animated.Value(0));

  const shake = useCallback(() => {
    Vibration.vibrate([0, 80, 40, 80]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Lockout countdown
  useEffect(() => {
    if (!lockout) return;
    setLockoutSecs(LOCKOUT_SECONDS);
    const interval = setInterval(() => {
      setLockoutSecs((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setLockout(false);
          setAttempts(0);
          setInput("");
          return LOCKOUT_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout]);

  // Auto-verify when 4 digits entered
  useEffect(() => {
    if (input.length === PIN_LENGTH) {
      verify(input);
    }
  }, [input]);

  const verify = async (entered: string) => {
    try {
      const stored = await SecureStore.getItemAsync("app_pin");
      if (entered === stored) {
        onUnlocked();
      } else {
        shake();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setTimeout(() => setInput(""), 600);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockout(true);
        }
      }
    } catch {
      onUnlocked(); // SecureStore failure — don't trap user
    }
  };

  const handleDigit = (d: string) => {
    if (lockout) return;
    if (input.length >= PIN_LENGTH) return;
    setInput((p) => p + d);
  };

  const handleDelete = () => {
    if (lockout) return;
    setInput((p) => p.slice(0, -1));
  };

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <View style={styles.container}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="shield-crown" size={36} color={C.amber} />
        </View>
        <Text style={styles.appName}>Fresh Mind Elite</Text>
        <Text style={styles.subtitle}>
          {lockout ? `Too many attempts. Try again in ${lockoutSecs}s` : "Enter your PIN to continue"}
        </Text>
      </View>

      {/* Dots */}
      <Animated.View
        style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
      >
        {Array(PIN_LENGTH).fill(0).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              input.length > i && styles.dotFilled,
              lockout && styles.dotLocked,
            ]}
          />
        ))}
      </Animated.View>

      {attempts > 0 && !lockout && (
        <Text style={styles.attemptsText}>
          {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} remaining
        </Text>
      )}

      {/* Numpad */}
      <View style={styles.keypad}>
        {keys.map((k, i) => {
          if (k === "") return <View key={i} style={styles.keyEmpty} />;
          if (k === "⌫") {
            return (
              <TouchableOpacity
                key={i}
                onPress={handleDelete}
                style={styles.key}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons
                  name="backspace-outline"
                  size={22}
                  color={C.textSub}
                />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleDigit(k)}
              style={[styles.key, lockout && styles.keyDisabled]}
              activeOpacity={0.6}
              disabled={lockout}
            >
              <Text style={styles.keyText}>{k}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoArea: { alignItems: "center", marginBottom: 48 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: C.amberBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSub,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: C.borderMid,
  },
  dotFilled: {
    backgroundColor: C.amber,
    borderColor: C.amber,
  },
  dotLocked: {
    backgroundColor: C.danger,
    borderColor: C.danger,
  },
  attemptsText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.danger,
    marginTop: 8,
    marginBottom: 0,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 264,
    gap: 12,
    marginTop: 40,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keyDisabled: { opacity: 0.3 },
  keyEmpty: { width: 80, height: 80 },
  keyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    color: C.text,
  },
});
