/**
 * Fresh Mind Elite — Cozy Minimalist Design System
 * Warm, soft, premium — like a high-end wellness journal app.
 * Font: Nunito (rounded, cozy) — loaded in _layout.tsx
 */

export const C = {
  // ── Backgrounds ─────────────────────────────────────────────────────────────
  bg:           "#12100E",   // Deep warm charcoal
  bgCard:       "#1C1916",   // Slightly warmer card
  bgElevated:   "#252118",   // Elevated surface
  bgOverlay:    "rgba(18,16,14,0.97)",

  // ── Borders ──────────────────────────────────────────────────────────────────
  border:       "rgba(255,245,235,0.07)",
  borderMid:    "rgba(255,245,235,0.12)",
  borderStrong: "rgba(255,245,235,0.20)",

  // ── Text ──────────────────────────────────────────────────────────────────────
  text:         "#F5F0EB",   // Warm off-white
  textSub:      "#A09080",   // Warm subdued
  textMuted:    "#5A5048",   // Very muted warm

  // ── Primary Accent — Walnut Brown ────────────────────────────────────────────
  accent:       "#C8956C",   // Warm terracotta/walnut
  accentDim:    "#9E7350",
  accentBg:     "rgba(200,149,108,0.10)",
  accentBorder: "rgba(200,149,108,0.28)",
  accentStrong: "rgba(200,149,108,0.45)",

  // ── Semantic ──────────────────────────────────────────────────────────────────
  success:      "#5BAD85",
  successBg:    "rgba(91,173,133,0.10)",
  danger:       "#D4665A",
  dangerBg:     "rgba(212,102,90,0.10)",
  dangerBorder: "rgba(212,102,90,0.28)",
  info:         "#6B9FD4",
  infoBg:       "rgba(107,159,212,0.10)",
  warn:         "#C8956C",
  warnBg:       "rgba(200,149,108,0.10)",

  // ── Gradients ─────────────────────────────────────────────────────────────────
  gradBg:    ["#12100E", "#1A1714"] as [string, string],
  gradAccent: ["#C8956C", "#9E7350"] as [string, string],

  // ── Tab ───────────────────────────────────────────────────────────────────────
  tabDefault:   "#5A5048",
  tabSelected:  "#C8956C",
};

// Radius tokens — rounded, cozy
export const R = {
  card:   20,
  button: 14,
  chip:   10,
  circle: 999,
  input:  12,
};

// Spacing tokens
export const S = {
  pagePad: 20,
  sectionGap: 24,
  cardGap: 12,
};

// For backwards-compat (access.tsx uses Colors.dark)
const palette = {
  dark: {
    background: C.bg,
    backgroundSecondary: "#1A1714",
    backgroundCard: C.bgCard,
    backgroundElevated: C.bgElevated,
    backgroundGlass: C.bgOverlay,
    border: C.border,
    borderLight: C.borderMid,
    text: C.text,
    textSecondary: C.textSub,
    textMuted: C.textMuted,
    tint: C.accent,
    tintDark: C.accentDim,
    amber: C.accent,
    amberSoft: C.accentBg,
    green: C.success,
    success: C.success,
    danger: C.danger,
    warning: C.warn,
    info: C.info,
    tabIconDefault: C.tabDefault,
    tabIconSelected: C.tabSelected,
  },
};

export default palette;
