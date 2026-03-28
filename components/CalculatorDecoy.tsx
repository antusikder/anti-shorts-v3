import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
} from "react-native";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");
const COLS = 4;
const BTN_SIZE = Math.floor((width - 48) / COLS);

// iOS Calculator exact palette (dark mode)
const IOS = {
  bg: "#000000",
  display: "#000000",
  numBg: "#333333",
  opBg: "#FF9F0A",   // iOS orange
  funcBg: "#A5A5A5", // AC / ± / %
  text: "#FFFFFF",
  opText: "#FFFFFF",
  funcText: "#000000",
  historyText: "#8E8E93",
};

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

  const handleDigit = (digit: string) => {
    Haptics.selectionAsync();
    if (waitingForOperand || display === "0") {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else if (display.length < 12) {
      setDisplay(display + digit);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisplay("0");
    setHistory("");
    setPrevVal(null);
    setLastOp(null);
    setWaitingForOperand(false);
  };

  const handleNegate = () => {
    Haptics.selectionAsync();
    const v = parseFloat(display);
    setDisplay(String(-v));
  };

  const handlePercent = () => {
    Haptics.selectionAsync();
    const v = parseFloat(display);
    setDisplay(String(v / 100));
  };

  const handleOp = (op: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const val = parseFloat(display);
    if (prevVal === null) {
      setPrevVal(val);
    } else if (lastOp) {
      const result = performCalc(prevVal, val, lastOp);
      setPrevVal(result);
      setDisplay(formatNum(result));
    }
    setLastOp(op);
    setHistory(`${display.slice(0, 10)} ${op}`);
    setWaitingForOperand(true);
  };

  const formatNum = (num: number): string => {
    const s = String(num);
    if (s.length > 12) return parseFloat(num.toPrecision(9)).toString();
    return s;
  };

  const performCalc = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEqual = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // SECRET: if display equals the PIN, unlock the app
    if (correctPin && display === correctPin) {
      onUnlock();
      return;
    }

    const val = parseFloat(display);
    if (prevVal !== null && lastOp) {
      const result = performCalc(prevVal, val, lastOp);
      setHistory("");
      setDisplay(formatNum(result));
      setPrevVal(null);
      setLastOp(null);
      setWaitingForOperand(true);
    }
  };

  const handleDot = () => {
    Haptics.selectionAsync();
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  type BtnType = "digit" | "op" | "func" | "equal";

  const CalcBtn = ({
    label, type = "digit", onPress, wide
  }: {
    label: string | React.ReactNode; type?: BtnType; onPress: () => void; wide?: boolean;
  }) => {
    let bg = IOS.numBg;
    let textC = IOS.text;
    if (type === "op" || type === "equal") { bg = IOS.opBg; textC = IOS.opText; }
    if (type === "func") { bg = IOS.funcBg; textC = IOS.funcText; }

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          styles.btn,
          { backgroundColor: bg, width: wide ? BTN_SIZE * 2 + 12 : BTN_SIZE },
        ]}
      >
        {typeof label === "string"
          ? <Text style={[styles.btnText, { color: textC }]}>{label}</Text>
          : label
        }
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Display */}
      <View style={styles.displayArea}>
        <Text style={styles.historyText}>{history}</Text>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <CalcBtn label="AC" type="func" onPress={handleClear} />
          <CalcBtn label="±" type="func" onPress={handleNegate} />
          <CalcBtn label="%" type="func" onPress={handlePercent} />
          <CalcBtn label="÷" type="op" onPress={() => handleOp("÷")} />
        </View>
        <View style={styles.row}>
          <CalcBtn label="7" onPress={() => handleDigit("7")} />
          <CalcBtn label="8" onPress={() => handleDigit("8")} />
          <CalcBtn label="9" onPress={() => handleDigit("9")} />
          <CalcBtn label="×" type="op" onPress={() => handleOp("×")} />
        </View>
        <View style={styles.row}>
          <CalcBtn label="4" onPress={() => handleDigit("4")} />
          <CalcBtn label="5" onPress={() => handleDigit("5")} />
          <CalcBtn label="6" onPress={() => handleDigit("6")} />
          <CalcBtn label="−" type="op" onPress={() => handleOp("−")} />
        </View>
        <View style={styles.row}>
          <CalcBtn label="1" onPress={() => handleDigit("1")} />
          <CalcBtn label="2" onPress={() => handleDigit("2")} />
          <CalcBtn label="3" onPress={() => handleDigit("3")} />
          <CalcBtn label="+" type="op" onPress={() => handleOp("+")} />
        </View>
        <View style={styles.row}>
          <CalcBtn label="0" onPress={() => handleDigit("0")} wide />
          <CalcBtn label="." onPress={handleDot} />
          <CalcBtn label="=" type="equal" onPress={handleEqual} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS.bg,
    justifyContent: "flex-end",
    paddingBottom: 34,
  },
  displayArea: {
    paddingHorizontal: 24,
    alignItems: "flex-end",
    marginBottom: 20,
    paddingTop: 60,
  },
  historyText: {
    fontSize: 22,
    color: IOS.historyText,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  displayText: {
    fontSize: 80,
    color: IOS.text,
    fontFamily: "Inter_400Regular",
    letterSpacing: -2,
  },
  grid: {
    paddingHorizontal: 12,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  btn: {
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 30,
    fontFamily: "Inter_400Regular",
  },
});
