/**
 * AccessibilityModule
 *
 * This module provides a JavaScript interface for interacting with the
 * native Android AccessibilityService (AntiShortsService).
 *
 * On Android, this bridges to the NativeModule via NativeModules.
 * On web/iOS, it provides a safe no-op fallback.
 *
 * The actual accessibility service logic runs natively in Kotlin.
 * This module lets the React Native UI:
 *   1. Check if the service is currently enabled in Android Settings
 *   2. Open Android Accessibility Settings
 *   3. Sync settings (scan speed, feature toggles) to the native service
 */

import { Linking, NativeModules, Platform } from "react-native";

interface AntiShortsNativeModule {
  isServiceEnabled: () => Promise<boolean>;
  openAccessibilitySettings: () => void;
  updateSettings: (settings: NativeSettings) => void;
  getScanIntervalMs: (speed: string) => number;
}

interface NativeSettings {
  youtubeRemoveShorts: boolean;
  youtubeAutoBack: boolean;
  youtubeRemoveAds: boolean;
  facebookRemoveReels: boolean;
  facebookRemoveAds: boolean;
  scanIntervalMs: number;
}

const SCAN_SPEED_MAP: Record<string, number> = {
  battery: 400,
  balanced: 200,
  aggressive: 100,
};

class AccessibilityModuleImpl {
  private native: AntiShortsNativeModule | null = null;

  constructor() {
    if (Platform.OS === "android") {
      this.native =
        (NativeModules.AntiShortsModule as AntiShortsNativeModule) || null;
    }
  }

  /**
   * Checks if the AntiShortsService is currently enabled in Android Settings.
   * Returns false on non-Android platforms.
   */
  async isServiceEnabled(): Promise<boolean> {
    if (!this.native) return false;
    try {
      return await this.native.isServiceEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Opens Android Accessibility Settings so the user can enable the service.
   */
  openAccessibilitySettings(): void {
    if (Platform.OS === "android") {
      try {
        if (this.native) {
          this.native.openAccessibilitySettings();
        } else {
          Linking.openSettings();
        }
      } catch {
        Linking.openSettings();
      }
    }
  }

  /**
   * Converts speed preset to milliseconds interval.
   */
  getScanIntervalMs(speed: string): number {
    return SCAN_SPEED_MAP[speed] ?? 200;
  }

  /**
   * Sends updated settings to the native service.
   * The native service stores them and uses them during scanning.
   */
  updateSettings(settings: {
    youtubeRemoveShorts: boolean;
    youtubeAutoBack: boolean;
    youtubeRemoveAds: boolean;
    facebookRemoveReels: boolean;
    facebookRemoveAds: boolean;
    scanSpeed: string;
  }): void {
    if (!this.native) return;
    try {
      this.native.updateSettings({
        ...settings,
        scanIntervalMs: this.getScanIntervalMs(settings.scanSpeed),
      });
    } catch {}
  }
}

export const AccessibilityModule = new AccessibilityModuleImpl();
