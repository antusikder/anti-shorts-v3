import React, { memo } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { C, R } from "@/constants/colors";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const { width } = Dimensions.get("window");

export const CustomAlert = memo(({ 
  visible, title, message, icon = "information-outline",
  confirmLabel = "Confirm", cancelLabel, onConfirm, onCancel 
}: CustomAlertProps) => {

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={ca.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={ca.card}>
          <View style={ca.iconWrap}>
            <MaterialCommunityIcons name={icon as any} size={32} color={C.amber} />
          </View>
          <Text style={ca.title}>{title}</Text>
          <Text style={ca.message}>{message}</Text>
          
          <View style={ca.actions}>
            {onCancel && (
              <TouchableOpacity style={ca.btnCancel} activeOpacity={0.8} onPress={() => { Haptics.selectionAsync(); onCancel(); }}>
                <Text style={ca.btnCancelText}>{cancelLabel || "Cancel"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={ca.btnConfirm} activeOpacity={0.8} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onConfirm(); }}>
              <Text style={ca.btnConfirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const ca = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  card: { width: Math.min(width - 48, 340), backgroundColor: C.bgCard, borderRadius: 28, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.border },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.amberBg, justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: C.amberBorder },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, textAlign: "center", marginBottom: 8 },
  message: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSub, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  actions: { flexDirection: "row", gap: 12, width: "100%" },
  btnCancel: { flex: 1, paddingVertical: 14, borderRadius: 100, backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  btnCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text },
  btnConfirm: { flex: 1, paddingVertical: 14, borderRadius: 100, backgroundColor: C.amber, alignItems: "center", justifyContent: "center" },
  btnConfirmText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#000" },
});
