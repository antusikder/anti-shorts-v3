// Fresh Mind Elite v4.2 — Premium Monochrome Dark Design System
// Single amber accent. No rainbow. No colorful boxes. Clean and premium.

export const C = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg:          "#080810",   // Deep midnight
  bgCard:      "#0E0D1A",   // Slightly lighter for cards
  bgElevated:  "#141326",   // Elevated surfaces
  bgOverlay:   "rgba(8,8,16,0.97)", // Near-opaque overlay

  // ── Borders ───────────────────────────────────────────────────────────────
  border:      "rgba(255,255,255,0.07)",
  borderMid:   "rgba(255,255,255,0.12)",
  borderStrong:"rgba(255,255,255,0.18)",
  borderAmber: "rgba(245,166,35,0.28)",

  // ── Text ──────────────────────────────────────────────────────────────────
  text:        "#EEEEF5",   // Near-white body text
  textSub:     "#9898B0",   // Subdued text
  textMuted:   "#555568",   // Very muted
  textAmber:   "#F5A623",   // Amber text

  // ── Accent — ONE COLOR ────────────────────────────────────────────────────
  amber:       "#F5A623",
  amberDim:    "#C4841C",
  amberBg:     "rgba(245,166,35,0.10)",
  amberBorder: "rgba(245,166,35,0.25)",
  amberStrong: "rgba(245,166,35,0.40)",

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:     "#3DD68C",
  successBg:   "rgba(61,214,140,0.10)",
  danger:      "#FF5C5C",
  dangerBg:    "rgba(255,92,92,0.10)",
  dangerBorder:"rgba(255,92,92,0.25)",
  info:        "#60A5FA",
  infoBg:      "rgba(96,165,250,0.10)",

  // ── Gradients ─────────────────────────────────────────────────────────────
  gradBg:    ["#080810", "#0C0B1C"] as [string, string],
  gradAmber: ["#F5A623", "#C9820F"] as [string, string],
  gradCard:  ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.01)"] as [string, string],

  // ── Tab ───────────────────────────────────────────────────────────────────
  tabDefault:  "#40405A",
  tabSelected: "#F5A623",
};

// Radius tokens
export const R = {
  card: 18,
  button: 12,
  chip: 8,
  circle: 999,
};

// backward compat colour export
const palette = {
  light: {
    background: "#FDFBF7", backgroundSecondary: "#F5F0EA",
    backgroundCard: "#FFFFFF", backgroundElevated: "#EBE3D5",
    backgroundGlass: "rgba(255,255,255,0.85)",
    border: "#E6DCCC", borderLight: "#F0EAE1",
    text: "#4A3B32", textSecondary: "#7C6A5D", textMuted: "#A4988E",
    tint: "#8B5A2B", tintDark: "#A67B5B",
    amber: "#DEB887", amberSoft: "#DEB88733",
    green: "#558B2F", success: "#558B2F",
    danger: "#CD5C5C", warning: "#DEB887", info: "#8BA4B5",
    youtube: "#D9534F", facebook: "#5BC0DE",
    instagram: "#E1306C", tiktok: "#000000", reddit: "#FF4500",
    accentGreen: "#558B2F", accentYellow: "#DEB887",
    tabIconDefault: "#A4988E", tabIconSelected: "#8B5A2B",
    switchTrack: "#EBE3D5", switchThumb: "#FFFFFF",
    gradStart: "#FDFBF7", gradMid: "#F5F0EA", gradEnd: "#FDFBF7",
    plannerAccent: "#C19A6B", breakColor: "#8FBC8F", strictColor: "#CD5C5C",
  },
  dark: {
    background: C.bg, backgroundSecondary: "#0C0B1C",
    backgroundCard: C.bgCard, backgroundElevated: C.bgElevated,
    backgroundGlass: C.bgOverlay,
    border: C.border, borderLight: C.borderMid,
    text: C.text, textSecondary: C.textSub, textMuted: C.textMuted,
    tint: C.amber, tintDark: C.amberDim,
    amber: C.amber, amberSoft: C.amberBg,
    green: C.success, success: C.success,
    danger: C.danger, warning: C.amber, info: C.info,
    youtube: "#888", facebook: "#888", instagram: "#888",
    tiktok: "#888", reddit: "#888",
    accentGreen: C.success, accentYellow: C.amber,
    tabIconDefault: C.tabDefault, tabIconSelected: C.tabSelected,
    switchTrack: "rgba(255,255,255,0.08)", switchThumb: C.text,
    gradStart: C.bg, gradMid: "#0C0B1C", gradEnd: C.bg,
    plannerAccent: C.amber, breakColor: C.success, strictColor: C.danger,
  },
};

export default palette;
