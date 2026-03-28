import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AccessibilityModule } from "@/modules/AccessibilityModule";

export type ScanSpeed = "battery" | "balanced" | "aggressive";
export type FeedMode = "off" | "knowledge" | "study" | "productive";

export interface BedtimeSettings {
  enabled: boolean;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

export interface Settings {
  isServiceEnabled: boolean;
  systemEnabled: boolean;
  skipAds: boolean;
  youtube: {
    enabled: boolean;
    removeShorts: boolean;
    autoBack: boolean;
  };
  facebook: {
    enabled: boolean;
    removeReels: boolean;
    autoBack: boolean;
  };
  instagram: {
    enabled: boolean;
  };
  tiktok: {
    enabled: boolean;
  };
  scanSpeed: ScanSpeed;
  feedMode: FeedMode;
  bedtime: BedtimeSettings;
  blockList: string[];
  blockActive: boolean;
  privacy: {
    pin: string | null;
    isDisguised: boolean;
    recoveryEmail: string;
  };
  stats: {
    shortsShieldedToday: number;
    reelsRejectedToday: number;
    adsRemovedToday: number;
    totalShortsShielded: number;
    totalReelsRejected: number;
    totalAdsRemoved: number;
    lastResetDate: string;
  };
}

const SCAN_SPEED_MAP: Record<ScanSpeed, number> = {
  battery: 300,
  balanced: 150,
  aggressive: 80,
};

const defaultSettings: Settings = {
  isServiceEnabled: false,
  systemEnabled: true,
  skipAds: true,
  youtube: {
    enabled: true,
    removeShorts: true,
    autoBack: true,
  },
  facebook: {
    enabled: true,
    removeReels: true,
    autoBack: false,
  },
  instagram: { enabled: true },
  tiktok: { enabled: true },
  scanSpeed: "balanced",
  feedMode: "off",
  bedtime: {
    enabled: false,
    startHour: 22,
    startMin: 0,
    endHour: 7,
    endMin: 0,
  },
  blockList: [
    "com.google.android.youtube",
    "com.facebook.katana",
    "com.facebook.orca",
    "com.whatsapp",
    "com.android.chrome",
  ],
  blockActive: false,
  privacy: {
    pin: null,
    isDisguised: false,
    recoveryEmail: "",
  },
  stats: {
    shortsShieldedToday: 0,
    reelsRejectedToday: 0,
    adsRemovedToday: 0,
    totalShortsShielded: 0,
    totalReelsRejected: 0,
    totalAdsRemoved: 0,
    lastResetDate: new Date().toDateString(),
  },
};

const STORAGE_KEY = "@productive:settings_v3";

interface SettingsContextType {
  settings: Settings;
  updateYoutube: (key: keyof Settings["youtube"], value: boolean) => void;
  updateFacebook: (key: keyof Settings["facebook"], value: boolean) => void;
  updateInstagram: (value: boolean) => void;
  updateTiktok: (value: boolean) => void;
  updateSkipAds: (value: boolean) => void;
  updateSystemEnabled: (value: boolean) => void;
  updateScanSpeed: (speed: ScanSpeed) => void;
  updateFeedMode: (mode: FeedMode) => void;
  updateBedtime: (bedtime: BedtimeSettings) => void;
  updateBlockList: (list: string[]) => void;
  setBlockActive: (active: boolean) => void;
  setServiceEnabled: (enabled: boolean) => void;
  updatePrivacy: (key: keyof Settings["privacy"], value: any) => void;
  incrementStat: (stat: "shorts" | "reels" | "ads") => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    syncToNative(settings);
  }, [settings, isLoaded]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Settings;
        const today = new Date().toDateString();
        if (parsed.stats?.lastResetDate !== today) {
          if (parsed.stats) {
            parsed.stats.shortsShieldedToday = 0;
            parsed.stats.reelsRejectedToday = 0;
            parsed.stats.adsRemovedToday = 0;
            parsed.stats.lastResetDate = today;
          }
        }
        // Deep merge with defaults for any new keys
        const merged: Settings = {
          ...defaultSettings,
          ...parsed,
          youtube: { ...defaultSettings.youtube, ...parsed.youtube },
          facebook: { ...defaultSettings.facebook, ...parsed.facebook },
          instagram: { ...defaultSettings.instagram, ...parsed.instagram },
          tiktok: { ...defaultSettings.tiktok, ...parsed.tiktok },
          bedtime: { ...defaultSettings.bedtime, ...parsed.bedtime },
          privacy: { ...defaultSettings.privacy, ...parsed.privacy },
          stats: { ...defaultSettings.stats, ...parsed.stats },
          feedMode: parsed.feedMode ?? "off",
        };
        setSettings(merged);
      }
    } catch {
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSettings = useCallback(async (s: Settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, []);

  const syncToNative = (s: Settings) => {
    AccessibilityModule.updateSettings({
      ytEnabled: s.youtube.enabled,
      youtubeRemoveShorts: s.youtube.removeShorts,
      youtubeAutoBack: s.youtube.autoBack,
      fbEnabled: s.facebook.enabled,
      facebookRemoveReels: s.facebook.removeReels,
      facebookAutoBack: s.facebook.autoBack,
      igEnabled: s.instagram.enabled,
      ttEnabled: s.tiktok.enabled,
      skipAds: s.skipAds,
      systemEnabled: s.systemEnabled,
      scanIntervalMs: SCAN_SPEED_MAP[s.scanSpeed],
      feedMode: s.feedMode,
      blockActive: s.blockActive,
      blockedApps: s.blockList.join(","),
      bedtimeEnabled: s.bedtime.enabled,
      bedtimeStartHour: s.bedtime.startHour,
      bedtimeStartMin: s.bedtime.startMin,
      bedtimeEndHour: s.bedtime.endHour,
      bedtimeEndMin: s.bedtime.endMin,
    });
  };

  const update = useCallback(
    (updater: (prev: Settings) => Settings) => {
      setSettings((prev) => {
        const updated = updater(prev);
        saveSettings(updated);
        return updated;
      });
    },
    [saveSettings]
  );

  const updateYoutube = useCallback(
    (key: keyof Settings["youtube"], value: boolean) =>
      update((p) => ({ ...p, youtube: { ...p.youtube, [key]: value } })),
    [update]
  );

  const updateFacebook = useCallback(
    (key: keyof Settings["facebook"], value: boolean) =>
      update((p) => ({ ...p, facebook: { ...p.facebook, [key]: value } })),
    [update]
  );

  const updateInstagram = useCallback(
    (value: boolean) => update((p) => ({ ...p, instagram: { enabled: value } })),
    [update]
  );

  const updateTiktok = useCallback(
    (value: boolean) => update((p) => ({ ...p, tiktok: { enabled: value } })),
    [update]
  );

  const updateSkipAds = useCallback(
    (value: boolean) => update((p) => ({ ...p, skipAds: value })),
    [update]
  );

  const updateSystemEnabled = useCallback(
    (value: boolean) => update((p) => ({ ...p, systemEnabled: value })),
    [update]
  );

  const updateScanSpeed = useCallback(
    (speed: ScanSpeed) => update((p) => ({ ...p, scanSpeed: speed })),
    [update]
  );

  const updateFeedMode = useCallback(
    (mode: FeedMode) => update((p) => ({ ...p, feedMode: mode })),
    [update]
  );

  const updateBedtime = useCallback(
    (bedtime: BedtimeSettings) => update((p) => ({ ...p, bedtime })),
    [update]
  );

  const updateBlockList = useCallback(
    (list: string[]) => update((p) => ({ ...p, blockList: list })),
    [update]
  );

  const setBlockActive = useCallback(
    (active: boolean) => update((p) => ({ ...p, blockActive: active })),
    [update]
  );

  const setServiceEnabled = useCallback(
    (enabled: boolean) => update((p) => ({ ...p, isServiceEnabled: enabled })),
    [update]
  );

  const updatePrivacy = useCallback(
    (key: keyof Settings["privacy"], value: any) =>
      update((p) => ({ ...p, privacy: { ...p.privacy, [key]: value } })),
    [update]
  );

  const incrementStat = useCallback(
    (stat: "shorts" | "reels" | "ads") =>
      update((p) => {
        const s = { ...p.stats };
        if (stat === "shorts") {
          s.shortsShieldedToday += 1;
          s.totalShortsShielded += 1;
        } else if (stat === "reels") {
          s.reelsRejectedToday += 1;
          s.totalReelsRejected += 1;
        } else {
          s.adsRemovedToday = (s.adsRemovedToday || 0) + 1;
          s.totalAdsRemoved = (s.totalAdsRemoved || 0) + 1;
        }
        return { ...p, stats: s };
      }),
    [update]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateYoutube,
        updateFacebook,
        updateInstagram,
        updateTiktok,
        updateSkipAds,
        updateSystemEnabled,
        updateScanSpeed,
        updateFeedMode,
        updateBedtime,
        updateBlockList,
        setBlockActive,
        setServiceEnabled,
        updatePrivacy,
        incrementStat,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
