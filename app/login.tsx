import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  
  // Animation values
  const logoScale = React.useRef(new Animated.Value(0.8)).current;
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const formOpacity = React.useRef(new Animated.Value(0)).current;
  const formTranslateY = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    checkLoginState();
    startIntroAnimation();
  }, []);

  const startIntroAnimation = () => {
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const checkLoginState = async () => {
    try {
      const token = await AsyncStorage.getItem("@productive:user_token");
      if (token) {
        // Automatically redirect to main tabs
        router.replace("/(tabs)");
      } else {
        setChecking(false);
      }
    } catch {
      setChecking(false);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    // Simulate network delay for Google OAuth handshake
    setTimeout(async () => {
      try {
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Save dummy token
        await AsyncStorage.setItem("@productive:user_token", "google-oauth-mock-token-v1");
        await AsyncStorage.setItem("@productive:user_name", "Elite Member");
        await AsyncStorage.setItem("@productive:user_email", "member@google.com");
        
        router.replace("/(tabs)");
      } catch (e) {
        setLoading(false);
        Alert.alert("Authentication Failed", "Could not connect to Google servers right now.");
      }
    }, 2000);
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB000" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#0D0B1E", "#05050A"]} style={styles.container}>
      <View style={styles.content}>
        
        {/* Animated Header */}
        <Animated.View style={[styles.headerContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="shield-crown" size={80} color={Colors.dark.amber} />
            <View style={styles.glow} />
          </View>
          <Text style={styles.title}>Fresh Mind</Text>
          <View style={styles.badgeContainer}>
             <Text style={styles.badgeText}>ELITE EDITION v4.1</Text>
          </View>
          <Text style={styles.subtitle}>Unlock peak cognitive performance and absolute digital sovereignty.</Text>
        </Animated.View>

        {/* Animated Form */}
        <Animated.View style={[styles.formContainer, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>
          
          <TouchableOpacity 
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
            onPress={handleGoogleLogin} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={24} color="#000" />
                <Text style={styles.loginBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>SECURE LOGIN</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.dark.amber} />
              <Text style={styles.featureText}>Neural Shorts & Reels Scanner</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.dark.amber} />
              <Text style={styles.featureText}>Hyper-Focus Discipline Flow</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.dark.amber} />
              <Text style={styles.featureText}>Premium Athletic Engineering</Text>
            </View>
          </View>
          
        </Animated.View>
        
        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: formOpacity }]}>
           <Text style={styles.footerText}>By continuing, you agree to our Elite Terms of Service and Neural Privacy Policy.</Text>
        </Animated.View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: "#0D0B1E", justifyContent: "center", alignItems: "center" },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: "space-between", paddingTop: 80, paddingBottom: 40 },
  headerContainer: { alignItems: "center", marginTop: 40 },
  iconContainer: { 
    width: 140, height: 140, borderRadius: 36, 
    backgroundColor: "rgba(255,176,0,0.05)", 
    justifyContent: "center", alignItems: "center", 
    borderWidth: 1, borderColor: "rgba(255,176,0,0.2)",
    marginBottom: 40
  },
  glow: {
    position: 'absolute', width: 200, height: 200, 
    backgroundColor: "rgba(255,176,0,0.1)", borderRadius: 100, zIndex: -1,
  },
  title: { fontSize: 42, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -1, marginBottom: 8 },
  badgeContainer: { backgroundColor: "rgba(255,176,0,0.15)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,176,0,0.3)" },
  badgeText: { color: "#FFB000", fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 2 },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", color: "#A0A0B0", textAlign: "center", lineHeight: 24, paddingHorizontal: 20 },
  formContainer: { marginTop: 40 },
  loginBtn: {
    backgroundColor: "#FFB000",
    height: 60, borderRadius: 30,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    shadowColor: "#FFB000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: "#000000", fontSize: 18, fontFamily: "Inter_700Bold" },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 35 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText: { color: "#606070", paddingHorizontal: 15, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  featuresList: { gap: 12, alignItems: "center" },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { color: "#A0A0B0", fontSize: 14, fontFamily: "Inter_500Medium" },
  footer: { alignItems: "center", paddingBottom: 10 },
  footerText: { color: "#606070", fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
});
