# Anti Shorts — Build & Deployment Guide

## Overview

Anti Shorts is an Expo React Native app with a custom Android Accessibility Service.
The UI is built in React Native (TypeScript), and the core filtering logic is native Kotlin.

## Architecture

```
artifacts/anti-shorts/
├── app/                          # Expo Router screens
│   ├── (tabs)/index.tsx          # Main shield/settings screen
│   └── (tabs)/setup.tsx          # Setup guide screen
├── components/                   # Reusable UI components
├── context/SettingsContext.tsx    # Persistent settings via AsyncStorage
├── modules/AccessibilityModule.ts # JS bridge to native Android module
└── android/app/src/main/kotlin/  # Native Android code
    ├── AntiShortsService.kt       # *** THE CORE: Accessibility Service ***
    ├── AntiShortsModule.kt        # React Native Native Module bridge
    └── AntiShortsPackage.kt       # Package registration
```

## How the Native Service Works

The `AntiShortsService.kt` is a standard Android AccessibilityService that:

1. **Only activates** for `com.google.android.youtube` and `com.facebook.katana`
2. **Throttles scans** to 100–400ms (user-configurable) to save battery
3. **Targets nodes** by view ID, text, or contentDescription — never reads pixels
4. **Auto-backs** from YouTube Shorts player instantly via `GLOBAL_ACTION_BACK`
5. **Purges Shorts/Reels** from feed by finding 3-dot menus and clicking dismiss options
6. **Handles slow internet** with 50ms retry mechanism
7. **Handles Facebook back-button** entry scenario (auto-back if Reels opens first)

## Building the APK

### Prerequisites
- Node.js 18+
- Java 17
- Android SDK
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

### Steps

1. **Log into Expo:**
   ```bash
   eas login
   ```

2. **Configure EAS build (first time only):**
   ```bash
   cd artifacts/anti-shorts
   eas build:configure
   ```

3. **Build APK for preview:**
   ```bash
   eas build --platform android --profile preview
   ```
   This builds in the cloud. You'll get a download link when done (~10–15 minutes).

4. **Install on your Pixel 6:**
   - Download the .apk from the EAS link
   - Enable "Install from unknown sources" in Android settings
   - Install the APK
   - Open Anti Shorts
   - Tap "Open Accessibility Settings"
   - Find "Anti Shorts" and enable it
   - Grant the permissions prompt

### EAS Build Profile (eas.json)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

## Registering the Native Module

When the Expo prebuild generates the Android project, you need to add the package
to `MainApplication.kt`:

```kotlin
import com.antishorts.shield.AntiShortsPackage

override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(AntiShortsPackage())
    }
```

And ensure `AntiShortsService` is declared in `AndroidManifest.xml` (see the manifest file).

## Play Store Submission

- Use `eas build --platform android --profile production` for an AAB (App Bundle)
- The Accessibility Service declaration in the manifest requires a privacy policy
- Google requires a detailed description of what the accessibility service does
- Use the description from `strings.xml` as a starting point for your policy

## Privacy Statement

Anti Shorts:
- ONLY monitors `com.google.android.youtube` and `com.facebook.katana`
- NEVER reads keystrokes, clipboard content, or personal messages
- NEVER sends any data to external servers
- NEVER records screen content
- Only interacts with specific UI labels: "Shorts", "Reels", "Sponsored", etc.
