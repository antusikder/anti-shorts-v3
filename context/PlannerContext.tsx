import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface PlannerTask {
  id: string;
  title: string;
  durationMin: number;
  breakMin: number;
  completed: boolean;
  icon?: string;
}

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  appPkg: string;
  appName: string;
  allowedStartHour: number;
  allowedStartMin: number;
  allowedEndHour: number;
  allowedEndMin: number;
}

export type ActiveSessionState =
  | { phase: "idle" }
  | { phase: "task"; taskId: string; endsAt: number }
  | { phase: "break"; taskId: string; endsAt: number };

interface PlannerData {
  tasks: PlannerTask[];
  strictMode: boolean;
  date: string; // today's date string
  scheduleSlots: ScheduleSlot[];
  activeSession: ActiveSessionState;
}

interface PlannerContextType {
  tasks: PlannerTask[];
  strictMode: boolean;
  scheduleSlots: ScheduleSlot[];
  activeSession: ActiveSessionState;
  addTask: (task: Omit<PlannerTask, "id" | "completed">) => void;
  updateTask: (id: string, patch: Partial<PlannerTask>) => void;
  removeTask: (id: string) => void;
  moveTask: (id: string, direction: "up" | "down") => void;
  toggleCompleted: (id: string) => void;
  setStrictMode: (v: boolean) => void;
  startSession: (taskId: string) => void;
  endSession: () => void;
  addScheduleSlot: (slot: Omit<ScheduleSlot, "id">) => void;
  removeScheduleSlot: (id: string) => void;
  isLoaded: boolean;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

const STORAGE_KEY = "@productive:planner_v1";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_DATA: PlannerData = {
  tasks: [],
  strictMode: false,
  date: new Date().toDateString(),
  scheduleSlots: [],
  activeSession: { phase: "idle" },
};

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PlannerData>(DEFAULT_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PlannerData = JSON.parse(raw);
        // Reset tasks completion each day
        if (parsed.date !== new Date().toDateString()) {
          parsed.tasks = parsed.tasks.map((t) => ({ ...t, completed: false }));
          parsed.date = new Date().toDateString();
          parsed.activeSession = { phase: "idle" };
        }
        setData({ ...DEFAULT_DATA, ...parsed });
      }
    } catch {
    } finally {
      setIsLoaded(true);
    }
  };

  const save = useCallback(async (d: PlannerData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch {}
  }, []);

  const patch = useCallback(
    (updater: (prev: PlannerData) => PlannerData) => {
      setData((prev) => {
        const next = updater(prev);
        save(next);
        return next;
      });
    },
    [save]
  );

  const addTask = useCallback(
    (task: Omit<PlannerTask, "id" | "completed">) =>
      patch((p) => ({
        ...p,
        tasks: [...p.tasks, { ...task, id: makeId(), completed: false }],
      })),
    [patch]
  );

  const updateTask = useCallback(
    (id: string, patchTask: Partial<PlannerTask>) =>
      patch((p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...patchTask } : t)),
      })),
    [patch]
  );

  const removeTask = useCallback(
    (id: string) =>
      patch((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) })),
    [patch]
  );

  const moveTask = useCallback(
    (id: string, direction: "up" | "down") =>
      patch((p) => {
        const idx = p.tasks.findIndex((t) => t.id === id);
        if (idx < 0) return p;
        const arr = [...p.tasks];
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= arr.length) return p;
        [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
        return { ...p, tasks: arr };
      }),
    [patch]
  );

  const toggleCompleted = useCallback(
    (id: string) =>
      patch((p) => ({
        ...p,
        tasks: p.tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        ),
      })),
    [patch]
  );

  const setStrictMode = useCallback(
    (v: boolean) => patch((p) => ({ ...p, strictMode: v })),
    [patch]
  );

  const startSession = useCallback(
    (taskId: string) =>
      patch((p) => {
        const task = p.tasks.find((t) => t.id === taskId);
        if (!task) return p;
        const endsAt = Date.now() + task.durationMin * 60 * 1000;
        return { ...p, activeSession: { phase: "task", taskId, endsAt } };
      }),
    [patch]
  );

  const endSession = useCallback(
    () => patch((p) => ({ ...p, activeSession: { phase: "idle" } })),
    [patch]
  );

  const addScheduleSlot = useCallback(
    (slot: Omit<ScheduleSlot, "id">) =>
      patch((p) => ({
        ...p,
        scheduleSlots: [...p.scheduleSlots, { ...slot, id: makeId() }],
      })),
    [patch]
  );

  const removeScheduleSlot = useCallback(
    (id: string) =>
      patch((p) => ({
        ...p,
        scheduleSlots: p.scheduleSlots.filter((s) => s.id !== id),
      })),
    [patch]
  );

  return (
    <PlannerContext.Provider
      value={{
        tasks: data.tasks,
        strictMode: data.strictMode,
        scheduleSlots: data.scheduleSlots,
        activeSession: data.activeSession,
        addTask,
        updateTask,
        removeTask,
        moveTask,
        toggleCompleted,
        setStrictMode,
        startSession,
        endSession,
        addScheduleSlot,
        removeScheduleSlot,
        isLoaded,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be inside PlannerProvider");
  return ctx;
}
