import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const btnSize = (width - 60) / 4;

export default function CalculatorDecoy({ onUnlock, correctPin, C }: { 
  onUnlock: () => void; 
  correctPin: string | null;
  C: any;
}) {
  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState("");
  const [lastOp, setLastOp] = useState<string | null>(null);
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const styles = getStyles(C);

  const handleDigit = (digit: string) => {
    Haptics.selectionAsync();
    if (waitingForOperand || display === "0") {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisplay("0");
    setHistory("");
    setPrevVal(null);
    setLastOp(null);
  };

  const handleOp = (op: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const val = parseFloat(display);
    
    if (prevVal === null) {
      setPrevVal(val);
    } else if (lastOp) {
      const result = performCalc(prevVal, val, lastOp);
      setPrevVal(result);
      setDisplay(String(result));
    }
    
    setLastOp(op);
    setHistory(`${display} ${op}`);
    setWaitingForOperand(true);
  };

  const performCalc = (a: number, b: number, op: string) => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEqual = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // SECRET UNLOCK CHECK
    if (display === correctPin && correctPin !== null) {
      onUnlock();
      return;
    }

    const val = parseFloat(display);
    if (prevVal !== null && lastOp) {
      const result = performCalc(prevVal, val, lastOp);
      setHistory("");
      setDisplay(String(result));
      setPrevVal(null);
      setLastOp(null);
      setWaitingForOperand(true);
    }
  };

  const CalcButton = ({ label, type = "digit", onPress }: { 
    label: string | React.ReactNode; 
    type?: "op" | "digit" | "clear" | "equal"; 
    onPress: () => void 
  }) => {
    let bg = C.backgroundElevated;
    let textC = C.text;
    if (type === "op") { bg = C.tint + "22"; textC = C.tint; }
    if (type === "equal") { bg = C.tint; textC = "#fff"; }
    if (type === "clear") { bg = C.danger + "22"; textC = C.danger; }

    return (
      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: bg }]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {typeof label === "string" ? (
          <Text style={[styles.btnText, { color: textC }]}>{label}</Text>
        ) : label}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.displayArea}>
        <Text style={styles.historyText}>{history}</Text>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          <CalcButton label="AC" type="clear" onPress={handleClear} />
          <CalcButton label="±" type="op" onPress={() => setDisplay(String(-parseFloat(display)))} />
          <CalcButton label="%" type="op" onPress={() => setDisplay(String(parseFloat(display) / 100))} />
          <CalcButton label="÷" type="op" onPress={() => handleOp("÷")} />
        </View>
        <View style={styles.row}>
          <CalcButton label="7" onPress={() => handleDigit("7")} />
          <CalcButton label="8" onPress={() => handleDigit("8")} />
          <CalcButton label="9" onPress={() => handleDigit("9")} />
          <CalcButton label="×" type="op" onPress={() => handleOp("×")} />
        </View>
        <View style={styles.row}>
          <CalcButton label="4" onPress={() => handleDigit("4")} />
          <CalcButton label="5" onPress={() => handleDigit("5")} />
          <CalcButton label="6" onPress={() => handleDigit("6")} />
          <CalcButton label="-" type="op" onPress={() => handleOp("-")} />
        </View>
        <View style={styles.row}>
          <CalcButton label="1" onPress={() => handleDigit("1")} />
          <CalcButton label="2" onPress={() => handleDigit("2")} />
          <CalcButton label="3" onPress={() => handleDigit("3")} />
          <CalcButton label="+" type="op" onPress={() => handleOp("+")} />
        </View>
        <View style={styles.row}>
          <CalcButton label="0" onPress={() => handleDigit("0")} />
          <CalcButton label="." onPress={() => handleDigit(".")} />
          <CalcButton label={correctPin ? "=" : "="} type="equal" onPress={handleEqual} />
        </View>
      </View>
    </View>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    justifyContent: "flex-end",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  displayArea: {
    paddingHorizontal: 30,
    alignItems: "flex-end",
    marginBottom: 30,
  },
  historyText: {
    fontSize: 20,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
  },
  displayText: {
    fontSize: 70,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  grid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  btn: {
    width: btnSize,
    height: btnSize,
    borderRadius: btnSize / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 26,
    fontFamily: "Inter_600SemiBold",
  },
});
