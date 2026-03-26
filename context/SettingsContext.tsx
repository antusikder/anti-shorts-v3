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

export interface BedtimeSettings {
  enabled: boolean;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

export interface Settings {
  isServiceEnabled: boolean;
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
  scanSpeed: ScanSpeed;
  bedtime: BedtimeSettings;
  blockList: string[]; // package names to block
  blockActive: boolean; // strict/schedule session active
  stats: {
    shortsShieldedToday: number;
    reelsRejectedToday: number;
    totalShortsShielded: number;
    totalReelsRejected: number;
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
  scanSpeed: "balanced",
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
    "com.facebook.orca",       // Messenger
    "com.whatsapp",
    "com.android.chrome",
  ],
  blockActive: false,
  stats: {
    shortsShieldedToday: 0,
    reelsRejectedToday: 0,
    totalShortsShielded: 0,
    totalReelsRejected: 0,
    lastResetDate: new Date().toDateString(),
  },
};

const STORAGE_KEY = "@productive:settings_v2";

interface SettingsContextType {
  settings: Settings;
  updateYoutube: (key: keyof Settings["youtube"], value: boolean) => void;
  updateFacebook: (key: keyof Settings["facebook"], value: boolean) => void;
  updateScanSpeed: (speed: ScanSpeed) => void;
  updateBedtime: (bedtime: BedtimeSettings) => void;
  updateBlockList: (list: string[]) => void;
  setBlockActive: (active: boolean) => void;
  setServiceEnabled: (enabled: boolean) => void;
  incrementStat: (stat: "shorts" | "reels") => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Sync to native whenever settings change
  useEffect(() => {
    if (!isLoaded) return;
    syncToNative(settings);
  }, [settings, isLoaded]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Settings;
        // Daily stats reset
        const today = new Date().toDateString();
        if (parsed.stats.lastResetDate !== today) {
          parsed.stats.shortsShieldedToday = 0;
          parsed.stats.reelsRejectedToday = 0;
          parsed.stats.lastResetDate = today;
        }
        // Merge defaults for new keys
        parsed.youtube = { ...defaultSettings.youtube, ...parsed.youtube };
        parsed.facebook = { ...defaultSettings.facebook, ...parsed.facebook };
        parsed.bedtime = { ...defaultSettings.bedtime, ...parsed.bedtime };
        if (!parsed.blockList) parsed.blockList = defaultSettings.blockList;
        if (parsed.blockActive === undefined) parsed.blockActive = false;
        setSettings(parsed);
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
      scanIntervalMs: SCAN_SPEED_MAP[s.scanSpeed],
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

  const updateScanSpeed = useCallback(
    (speed: ScanSpeed) => update((p) => ({ ...p, scanSpeed: speed })),
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

  const incrementStat = useCallback(
    (stat: "shorts" | "reels") =>
      update((p) => {
        const s = { ...p.stats };
        if (stat === "shorts") {
          s.shortsShieldedToday += 1;
          s.totalShortsShielded += 1;
        } else {
          s.reelsRejectedToday += 1;
          s.totalReelsRejected += 1;
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
        updateScanSpeed,
        updateBedtime,
        updateBlockList,
        setBlockActive,
        setServiceEnabled,
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
