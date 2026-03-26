/**
 * AccessibilityModule — JS bridge to the native AntiShortsModule (Kotlin)
 */

import { Linking, NativeModules, Platform } from "react-native";

export interface InstalledApp {
  name: string;
  pkg: string;
}

interface AntiShortsNativeModule {
  isServiceEnabled: () => Promise<boolean>;
  openAccessibilitySettings: () => void;
  updateSettings: (settings: Record<string, unknown>) => void;
  getInstalledApps: () => Promise<InstalledApp[]>;
}

class AccessibilityModuleImpl {
  private native: AntiShortsNativeModule | null = null;

  constructor() {
    if (Platform.OS === "android") {
      this.native =
        (NativeModules.AntiShortsModule as AntiShortsNativeModule) || null;
    }
  }

  async isServiceEnabled(): Promise<boolean> {
    if (!this.native) return false;
    try {
      return await this.native.isServiceEnabled();
    } catch {
      return false;
    }
  }

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

  updateSettings(settings: Record<string, unknown>): void {
    if (!this.native) return;
    try {
      this.native.updateSettings(settings);
    } catch {}
  }

  async getInstalledApps(): Promise<InstalledApp[]> {
    if (!this.native) return [];
    try {
      return await this.native.getInstalledApps();
    } catch {
      return [];
    }
  }
}

export const AccessibilityModule = new AccessibilityModuleImpl();
