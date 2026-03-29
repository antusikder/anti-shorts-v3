import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeBlock {
  id: string;
  label: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  type: "work" | "break" | "sleep" | "exercise" | "meal" | "study" | "free";
}

export interface DayRoutine {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  blocks: TimeBlock[];
  goal: string;
}

export interface PlannerTask {
  id: string;
  label: string;
  category: "morning" | "afternoon" | "evening" | "anytime";
  done: boolean;
  priority: "low" | "medium" | "high";
}

export interface ScreenTimeConfig {
  enabled: boolean;
  dailyLimitMin: number;
  cooldownMin: number; // After limit: lock screen for this long
  warningAtPercent: number; // Warn at 80% by default
}

export interface FocusSession {
  workMin: number;
  breakMin: number;
  longBreakMin: number;
  sessionsBeforeLongBreak: number;
}

export interface BedtimeConfig {
  enabled: boolean;
  bedHour: number;
  bedMin: number;
  wakeHour: number;
  wakeMin: number;
  reminderMinsBefore: number;
}

export interface MindsetState {
  bedtime: BedtimeConfig;
  screenTime: ScreenTimeConfig;
  focusSession: FocusSession;
  weeklyRoutine: DayRoutine[];
  todayTasks: PlannerTask[];
  streakDays: number;
  lastTaskDate: string;
  totalFocusSessionsCompleted: number;
  pin: string | null;
}

interface MindsetContextType {
  mindset: MindsetState;
  updateBedtime: (cfg: BedtimeConfig) => void;
  updateScreenTime: (cfg: ScreenTimeConfig) => void;
  updateFocusSession: (cfg: FocusSession) => void;
  updateWeeklyRoutine: (routine: DayRoutine[]) => void;
  setTodayTasks: (tasks: PlannerTask[]) => void;
  toggleTask: (id: string) => void;
  completeFocusSession: () => void;
  setPin: (pin: string | null) => void;
  isLoaded: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_DAYS: DayRoutine["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const defaultState: MindsetState = {
  bedtime: {
    enabled: false,
    bedHour: 22,
    bedMin: 0,
    wakeHour: 6,
    wakeMin: 30,
    reminderMinsBefore: 30,
  },
  screenTime: {
    enabled: false,
    dailyLimitMin: 120,
    cooldownMin: 15,
    warningAtPercent: 80,
  },
  focusSession: {
    workMin: 25,
    breakMin: 5,
    longBreakMin: 15,
    sessionsBeforeLongBreak: 4,
  },
  weeklyRoutine: DEFAULT_DAYS.map((day) => ({ day, blocks: [], goal: "" })),
  todayTasks: [],
  streakDays: 0,
  lastTaskDate: "",
  totalFocusSessionsCompleted: 0,
  pin: null,
};

const STORAGE_KEY = "@freshmind:mindset_v1";

// ─── Context ──────────────────────────────────────────────────────────────────

const MindsetContext = createContext<MindsetContextType | null>(null);

export function MindsetProvider({ children }: { children: React.ReactNode }) {
  const [mindset, setMindset] = useState<MindsetState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as MindsetState;
          // Reset today tasks if date has changed
          const today = new Date().toDateString();
          const tasks =
            parsed.lastTaskDate === today ? parsed.todayTasks ?? [] : [];
          setMindset({
            ...defaultState,
            ...parsed,
            bedtime: { ...defaultState.bedtime, ...parsed.bedtime },
            screenTime: { ...defaultState.screenTime, ...parsed.screenTime },
            focusSession: { ...defaultState.focusSession, ...parsed.focusSession },
            todayTasks: tasks,
            lastTaskDate: today,
          });
        }
      } catch {
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const save = useCallback(async (state: MindsetState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, []);

  const update = useCallback(
    (updater: (prev: MindsetState) => MindsetState) => {
      setMindset((prev) => {
        const next = updater(prev);
        save(next);
        return next;
      });
    },
    [save]
  );

  const updateBedtime = useCallback(
    (cfg: BedtimeConfig) => update((p) => ({ ...p, bedtime: cfg })),
    [update]
  );

  const updateScreenTime = useCallback(
    (cfg: ScreenTimeConfig) => update((p) => ({ ...p, screenTime: cfg })),
    [update]
  );

  const updateFocusSession = useCallback(
    (cfg: FocusSession) => update((p) => ({ ...p, focusSession: cfg })),
    [update]
  );

  const updateWeeklyRoutine = useCallback(
    (routine: DayRoutine[]) => update((p) => ({ ...p, weeklyRoutine: routine })),
    [update]
  );

  const setTodayTasks = useCallback(
    (tasks: PlannerTask[]) =>
      update((p) => ({
        ...p,
        todayTasks: tasks,
        lastTaskDate: new Date().toDateString(),
      })),
    [update]
  );

  const toggleTask = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        todayTasks: p.todayTasks.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t
        ),
      })),
    [update]
  );

  const completeFocusSession = useCallback(
    () =>
      update((p) => ({
        ...p,
        totalFocusSessionsCompleted: p.totalFocusSessionsCompleted + 1,
      })),
    [update]
  );

  const setPin = useCallback(
    (pin: string | null) => update((p) => ({ ...p, pin })),
    [update]
  );

  return (
    <MindsetContext.Provider
      value={{
        mindset,
        updateBedtime,
        updateScreenTime,
        updateFocusSession,
        updateWeeklyRoutine,
        setTodayTasks,
        toggleTask,
        completeFocusSession,
        setPin,
        isLoaded,
      }}
    >
      {children}
    </MindsetContext.Provider>
  );
}

export function useMindset() {
  const ctx = useContext(MindsetContext);
  if (!ctx) throw new Error("useMindset must be inside MindsetProvider");
  return ctx;
}
