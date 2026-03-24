import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

interface Props {
  onStatusChange?: (enabled: boolean) => void;
}

export function ServiceStatusCard({ onStatusChange }: Props) {
  const C = Colors.dark;
  const [isEnabled, setIsEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isEnabled, pulseAnim, glowAnim]);

  const checkStatus = async () => {
    const enabled = await AccessibilityModule.isServiceEnabled();
    setIsEnabled(enabled);
    setIsChecking(false);
    onStatusChange?.(enabled);
  };

  const handleActivate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "android") {
      AccessibilityModule.openAccessibilitySettings();
    } else {
      router.push("/setup");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.backgroundCard }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="shield-check" size={22} color={C.tint} />
          <Text style={[styles.title, { color: C.text }]}>Service Status</Text>
        </View>
        {isChecking ? (
          <ActivityIndicator size="small" color={C.tint} />
        ) : (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isEnabled
                  ? "rgba(46, 213, 115, 0.15)"
                  : "rgba(255, 71, 87, 0.15)",
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: isEnabled ? C.success : C.danger },
              ]}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isEnabled ? C.success : C.danger },
              ]}
            >
              {isEnabled ? "ACTIVE" : "INACTIVE"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowAnim,
              borderColor: isEnabled ? C.success : C.tint,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.shieldContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View
            style={[
              styles.shieldBg,
              {
                backgroundColor: isEnabled
                  ? "rgba(46, 213, 115, 0.15)"
                  : "rgba(108, 99, 255, 0.15)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isEnabled ? "shield-check" : "shield-off"}
              size={52}
              color={isEnabled ? C.success : C.tint}
            />
          </View>
        </Animated.View>
      </View>

      {isEnabled ? (
        <View style={styles.activeInfo}>
          <Text style={[styles.activeText, { color: C.success }]}>
            Anti Shorts is protecting you
          </Text>
          <Text style={[styles.subText, { color: C.textMuted }]}>
            Shorts and Reels are being filtered
          </Text>
        </View>
      ) : (
        <View style={styles.inactiveInfo}>
          <Text style={[styles.inactiveText, { color: C.text }]}>
            Accessibility Service Required
          </Text>
          <Text style={[styles.subText, { color: C.textMuted }]}>
            Enable the service to start filtering content
          </Text>

          <Pressable
            onPress={handleActivate}
            style={({ pressed }) => [
              styles.activateBtn,
              {
                backgroundColor: C.tint,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Feather name="settings" size={16} color="#fff" />
            <Text style={styles.activateBtnText}>Open Accessibility Settings</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    height: 120,
  },
  glowRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
  },
  shieldContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  shieldBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  activeInfo: {
    alignItems: "center",
    gap: 6,
  },
  activeText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  inactiveInfo: {
    alignItems: "center",
    gap: 8,
  },
  inactiveText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  subText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  activateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  activateBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
