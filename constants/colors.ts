// Mind — design token palette
// Cozy light chocolate brownish + warm caramel + soft mocha

const primary    = "#A67B5B"; // Soft Milk Chocolate
const primaryDark= "#8B5A2B";
const amber      = "#DEB887"; // Burlywood / Warm Caramel
const green      = "#8FBC8F"; // Dark Sea Green (cozy sage)
const red        = "#CD5C5C"; // Indian Red (muted rose)
const blue       = "#8BA4B5"; // Slate Blue (cozy denim)

export default {
  dark: {
    // Backgrounds
    background:          "#FDFBF7",  // Warm Cream
    backgroundSecondary: "#F5F0EA",  // Soft Latte
    backgroundCard:      "#FFFFFF",  // Clean White for cards
    backgroundElevated:  "#EBE3D5",  // Light Mocha
    backgroundGlass:     "rgba(255, 255, 255, 0.85)",

    // Borders
    border:              "#E6DCCC",
    borderLight:         "#F0EAE1",

    // Text
    text:                "#4A3B32",  // Deep Espresso
    textSecondary:       "#7C6A5D",  // Warm Taupe
    textMuted:           "#A4988E",  // Soft Ash Brown

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
    youtube:             "#CD5C5C",
    facebook:            "#8BA4B5",

    // UI
    tabIconDefault:      "#A4988E",
    tabIconSelected:     primary,
    switchTrack:         "#EBE3D5",
    switchThumb:         "#FFFFFF",

    // Gradient stops (for LinearGradient)
    gradStart:           "#FDFBF7",
    gradMid:             "#F5F0EA",
    gradEnd:             "#FDFBF7",

    // Planner
    plannerAccent:       "#C19A6B",  // Camel
    breakColor:          "#8FBC8F",  // Sage
    strictColor:         "#CD5C5C",  // Rose
  },
};
