import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ScanSpeed = "battery" | "balanced" | "aggressive";

export interface Settings {
  isServiceEnabled: boolean;
  youtube: {
    removeShortsFromFeed: boolean;
    autoBackFromPlayer: boolean;
    removeAds: boolean;
  };
  facebook: {
    removeReelsFromFeed: boolean;
    removeAds: boolean;
  };
  scanSpeed: ScanSpeed;
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

const defaultSettings: Settings = {
  isServiceEnabled: false,
  youtube: {
    removeShortsFromFeed: true,
    autoBackFromPlayer: true,
    removeAds: true,
  },
  facebook: {
    removeReelsFromFeed: true,
    removeAds: true,
  },
  scanSpeed: "balanced",
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

const STORAGE_KEY = "@antishorts:settings";

interface SettingsContextType {
  settings: Settings;
  updateYoutube: (key: keyof Settings["youtube"], value: boolean) => void;
  updateFacebook: (key: keyof Settings["facebook"], value: boolean) => void;
  updateScanSpeed: (speed: ScanSpeed) => void;
  setServiceEnabled: (enabled: boolean) => void;
  incrementStat: (
    stat: "shorts" | "reels" | "ads",
    platform: "youtube" | "facebook"
  ) => void;
  resetTodayStats: () => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Settings;
        const today = new Date().toDateString();
        if (parsed.stats.lastResetDate !== today) {
          parsed.stats.shortsShieldedToday = 0;
          parsed.stats.reelsRejectedToday = 0;
          parsed.stats.adsRemovedToday = 0;
          parsed.stats.lastResetDate = today;
        }
        setSettings(parsed);
      }
    } catch {
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSettings = useCallback(async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {}
  }, []);

  const updateYoutube = useCallback(
    (key: keyof Settings["youtube"], value: boolean) => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          youtube: { ...prev.youtube, [key]: value },
        };
        saveSettings(updated);
        return updated;
      });
    },
    [saveSettings]
  );

  const updateFacebook = useCallback(
    (key: keyof Settings["facebook"], value: boolean) => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          facebook: { ...prev.facebook, [key]: value },
        };
        saveSettings(updated);
        return updated;
      });
    },
    [saveSettings]
  );

  const updateScanSpeed = useCallback(
    (speed: ScanSpeed) => {
      setSettings((prev) => {
        const updated = { ...prev, scanSpeed: speed };
        saveSettings(updated);
        return updated;
      });
    },
    [saveSettings]
  );

  const setServiceEnabled = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => {
        const updated = { ...prev, isServiceEnabled: enabled };
        saveSettings(updated);
        return updated;
      });
    },
    [saveSettings]
  );

  const incrementStat = useCallback(
    (stat: "shorts" | "reels" | "ads", _platform: "youtube" | "facebook") => {
      setSettings((prev) => {
        const updated = { ...prev };
        if (stat === "shorts") {
          updated.stats = {
            ...prev.stats,
            shortsShieldedToday: prev.stats.shortsShieldedToday + 1,
            totalShortsShielded: prev.stats.totalShortsShielded + 1,
          };
        } else if (stat === "reels") {
          updated.stats = {
            ...prev.stats,
            reelsRejectedToday: prev.stats.reelsRejectedToday + 1,
            totalReelsRejected: prev.stats.totalReelsRejected + 1,
          };
        } else {
          updated.stats = {
            ...prev.stats,
            adsRemovedToday: prev.stats.adsRemovedToday + 1,
            totalAdsRemoved: prev.stats.totalAdsRemoved + 1,
          };
        }
        saveSettings(updated);
        return updated;
      });
    },
    [saveSettings]
  );

  const resetTodayStats = useCallback(() => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        stats: {
          ...prev.stats,
          shortsShieldedToday: 0,
          reelsRejectedToday: 0,
          adsRemovedToday: 0,
          lastResetDate: new Date().toDateString(),
        },
      };
      saveSettings(updated);
      return updated;
    });
  }, [saveSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateYoutube,
        updateFacebook,
        updateScanSpeed,
        setServiceEnabled,
        incrementStat,
        resetTodayStats,
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
