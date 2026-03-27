// Fresh Mind — design token palette
// Cozy light chocolate (Latte / Day) + Dark Chocolate (Mocha / Night)

const primary    = "#8B5A2B"; // Milk Chocolate
const primaryDark= "#A67B5B";
const amber      = "#DEB887"; // Burlywood / Warm Caramel
const green      = "#558B2F"; // Natural Leaf Green
const red        = "#CD5C5C"; // Muted Rose
const blue       = "#8BA4B5"; // Slate Blue

export default {
  light: {
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
    youtube:             "#D9534F",
    facebook:            "#5BC0DE",
    instagram:           "#E1306C",
    tiktok:              "#000000",

    accentGreen:         green,
    accentYellow:        amber,

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
  dark: {
    // Backgrounds
    background:          "#1A1412",  // Deep Espresso Space
    backgroundSecondary: "#241D1A",  // Dark Roast
    backgroundCard:      "#2D2521",  // Dark Mocha
    backgroundElevated:  "#3A312B",  // Hot Cocoa
    backgroundGlass:     "rgba(45, 37, 33, 0.85)",

    // Borders
    border:              "#3A312B",
    borderLight:         "#4A413C",

    // Text
    text:                "#F0EBE6",  // Rich Cream
    textSecondary:       "#C1B6AD",  // Warm Ash
    textMuted:           "#8C7F75",  // Muted Taupe

    // Accents
    tint:                "#D4A373",  // Caramel Tint for dark mode
    tintDark:            "#BC8A5F",
    amber:               amber,
    amberSoft:           amber + "33",
    green:               "#8FBC8F",  // Lighter Sage
    success:             "#8FBC8F",
    danger:              "#E56B6F",
    warning:             amber,
    info:                blue,

    // Platform
    youtube:             "#E56B6F",
    facebook:            "#8BA4B5",
    instagram:           "#E27396",
    tiktok:              "#E0E0E0",

    accentGreen:         green,
    accentYellow:        amber,

    // UI
    tabIconDefault:      "#8C7F75",
    tabIconSelected:     "#D4A373",
    switchTrack:         "#3A312B",
    switchThumb:         "#F0EBE6",

    // Gradient stops (for LinearGradient)
    gradStart:           "#1A1412",
    gradMid:             "#241D1A",
    gradEnd:             "#1A1412",

    // Planner
    plannerAccent:       "#DEB887",
    breakColor:          "#8FBC8F",
    strictColor:         "#E56B6F",
  },
};
