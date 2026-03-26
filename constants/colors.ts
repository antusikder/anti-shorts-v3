// Productive — design token palette
// Cozy deep-space + warm amber + soft indigo

const primary    = "#7C6FFF"; // Soft indigo
const primaryDark= "#5A4ECC";
const amber      = "#FFB347"; // Warm amber accent
const green      = "#3DDC84"; // Success green
const red        = "#FF5C5C"; // Danger
const blue       = "#4A9EFF"; // Info blue

export default {
  dark: {
    // Backgrounds
    background:          "#0D0B1E",  // Deep space navy
    backgroundSecondary: "#141228",
    backgroundCard:      "#1C1A32",
    backgroundElevated:  "#242140",
    backgroundGlass:     "rgba(28,26,50,0.85)",

    // Borders
    border:              "#2E2A50",
    borderLight:         "#3A356A",

    // Text
    text:                "#F0EEFF",
    textSecondary:       "#9B98D0",
    textMuted:           "#5C5888",

    // Accents
    tint:                primary,
    tintDark:            primaryDark,
    amber:               amber,
    amberSoft:           amber + "33",
    green:               green,
    success:             green,
    danger:              red,
    warning:             amber,
    info:                blue,

    // Platform
    youtube:             "#FF3B30",
    facebook:            "#4A9EFF",

    // UI
    tabIconDefault:      "#5C5888",
    tabIconSelected:     primary,
    switchTrack:         "#2E2A50",
    switchThumb:         "#F0EEFF",

    // Gradient stops (for LinearGradient)
    gradStart:           "#0D0B1E",
    gradMid:             "#141228",
    gradEnd:             "#0D0B1E",

    // Planner
    plannerAccent:       "#A78BFA",  // Soft violet
    breakColor:          "#34D399",  // Mint
    strictColor:         "#F87171",  // Warm red
  },
};
