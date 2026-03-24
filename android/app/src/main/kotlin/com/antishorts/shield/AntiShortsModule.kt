package com.antishorts.shield

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Settings
import android.text.TextUtils
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

/**
 * AntiShortsModule
 * ================
 * React Native Native Module that bridges the JS UI to the Android system.
 *
 * Exposed to JavaScript as NativeModules.AntiShortsModule
 *
 * Methods:
 * - isServiceEnabled(): Check if AntiShortsService is active in Accessibility Settings
 * - openAccessibilitySettings(): Open Android's Accessibility Settings screen
 * - updateSettings(map): Push UI toggle settings to the service via SharedPreferences
 */
class AntiShortsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences = reactContext.getSharedPreferences(
        AntiShortsService.PREFS_NAME,
        Context.MODE_PRIVATE
    )

    override fun getName(): String = "AntiShortsModule"

    /**
     * Checks if AntiShortsService is currently enabled in Accessibility Settings.
     * Uses Android's AccessibilityManager to query enabled services.
     */
    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        try {
            val am = reactApplicationContext
                .getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager

            val enabledServices = am.getEnabledAccessibilityServiceList(
                AccessibilityServiceInfo.FEEDBACK_ALL_MASK
            )

            val serviceName = "${reactApplicationContext.packageName}/${AntiShortsService::class.java.name}"

            // Also check via Settings string for extra reliability
            val settingValue = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""

            val isEnabled = enabledServices.any { info ->
                info.resolveInfo.serviceInfo.let { si ->
                    "${si.packageName}/${si.name}" == serviceName ||
                    si.packageName == reactApplicationContext.packageName
                }
            } || settingValue.contains(reactApplicationContext.packageName)

            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    /**
     * Opens Android's Accessibility Settings screen.
     * The user must manually enable the service there.
     */
    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactApplicationContext.startActivity(intent)
    }

    /**
     * Updates service settings from the React Native UI.
     * Writes to SharedPreferences — the service reads these on each scan cycle.
     *
     * @param settingsMap Map with keys:
     *   - youtubeRemoveShorts (boolean)
     *   - youtubeAutoBack (boolean)
     *   - youtubeRemoveAds (boolean)
     *   - facebookRemoveReels (boolean)
     *   - facebookRemoveAds (boolean)
     *   - scanIntervalMs (int)
     */
    @ReactMethod
    fun updateSettings(settingsMap: ReadableMap) {
        prefs.edit().apply {
            if (settingsMap.hasKey("youtubeRemoveShorts")) {
                putBoolean(AntiShortsService.PREF_YT_SHORTS, settingsMap.getBoolean("youtubeRemoveShorts"))
            }
            if (settingsMap.hasKey("youtubeAutoBack")) {
                putBoolean(AntiShortsService.PREF_YT_AUTO_BACK, settingsMap.getBoolean("youtubeAutoBack"))
            }
            if (settingsMap.hasKey("youtubeRemoveAds")) {
                putBoolean(AntiShortsService.PREF_YT_ADS, settingsMap.getBoolean("youtubeRemoveAds"))
            }
            if (settingsMap.hasKey("facebookRemoveReels")) {
                putBoolean(AntiShortsService.PREF_FB_REELS, settingsMap.getBoolean("facebookRemoveReels"))
            }
            if (settingsMap.hasKey("facebookRemoveAds")) {
                putBoolean(AntiShortsService.PREF_FB_ADS, settingsMap.getBoolean("facebookRemoveAds"))
            }
            if (settingsMap.hasKey("scanIntervalMs")) {
                putLong(AntiShortsService.PREF_SCAN_INTERVAL, settingsMap.getInt("scanIntervalMs").toLong())
            }
        }.apply()
    }
}
