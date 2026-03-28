package com.antishorts.shield

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray

/**
 * AntiShortsModule — Native bridge to JavaScript (NativeModules.AntiShortsModule)
 *
 * All settings are written to SharedPreferences; the service reads them live per cycle.
 * Keys accepted by updateSettings:
 *   ytEnabled, youtubeRemoveShorts, youtubeAutoBack,
 *   fbEnabled, facebookRemoveReels, facebookAutoBack,
 *   igEnabled, ttEnabled, skipAds, systemEnabled, feedMode,
 *   scanIntervalMs, blockActive, blockedApps,
 *   bedtimeEnabled, bedtimeStartHour, bedtimeStartMin, bedtimeEndHour, bedtimeEndMin
 */
class AntiShortsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences = reactContext.getSharedPreferences(
        AntiShortsService.PREFS_NAME,
        Context.MODE_PRIVATE
    )

    override fun getName(): String = "AntiShortsModule"

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        try {
            val am = reactApplicationContext
                .getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
            val enabled = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
            val settingStr = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            val pkgName = reactApplicationContext.packageName
            val isEnabled = enabled.any { info ->
                val si = info.resolveInfo.serviceInfo
                si.packageName == pkgName
            } || settingStr.contains(pkgName)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun updateSettings(settingsMap: ReadableMap) {
        prefs.edit().apply {
            // YouTube
            if (settingsMap.hasKey("ytEnabled"))
                putBoolean(AntiShortsService.PREF_YT_ENABLED, settingsMap.getBoolean("ytEnabled"))
            if (settingsMap.hasKey("youtubeRemoveShorts"))
                putBoolean(AntiShortsService.PREF_YT_SHORTS, settingsMap.getBoolean("youtubeRemoveShorts"))
            if (settingsMap.hasKey("youtubeAutoBack"))
                putBoolean(AntiShortsService.PREF_YT_AUTO_BACK, settingsMap.getBoolean("youtubeAutoBack"))

            // Facebook
            if (settingsMap.hasKey("fbEnabled"))
                putBoolean(AntiShortsService.PREF_FB_ENABLED, settingsMap.getBoolean("fbEnabled"))
            if (settingsMap.hasKey("facebookRemoveReels"))
                putBoolean(AntiShortsService.PREF_FB_REELS, settingsMap.getBoolean("facebookRemoveReels"))
            if (settingsMap.hasKey("facebookAutoBack"))
                putBoolean(AntiShortsService.PREF_FB_AUTO_BACK, settingsMap.getBoolean("facebookAutoBack"))

            // Instagram & TikTok
            if (settingsMap.hasKey("igEnabled"))
                putBoolean(AntiShortsService.PREF_IG_ENABLED, settingsMap.getBoolean("igEnabled"))
            if (settingsMap.hasKey("ttEnabled"))
                putBoolean(AntiShortsService.PREF_TT_ENABLED, settingsMap.getBoolean("ttEnabled"))

            // Ads & System
            if (settingsMap.hasKey("skipAds"))
                putBoolean(AntiShortsService.PREF_SKIP_ADS, settingsMap.getBoolean("skipAds"))
            if (settingsMap.hasKey("systemEnabled"))
                putBoolean(AntiShortsService.PREF_SYSTEM_ENABLED, settingsMap.getBoolean("systemEnabled"))

            // Feed mode ("off" | "knowledge" | "study" | "productive")
            if (settingsMap.hasKey("feedMode"))
                putString(AntiShortsService.PREF_FEED_MODE, settingsMap.getString("feedMode"))

            // Scan speed
            if (settingsMap.hasKey("scanIntervalMs"))
                putLong(AntiShortsService.PREF_SCAN_INTERVAL, settingsMap.getInt("scanIntervalMs").toLong())

            // Block / strict mode
            if (settingsMap.hasKey("blockActive"))
                putBoolean(AntiShortsService.PREF_BLOCK_ACTIVE, settingsMap.getBoolean("blockActive"))
            if (settingsMap.hasKey("blockedApps"))
                putString(AntiShortsService.PREF_BLOCKED_APPS, settingsMap.getString("blockedApps"))

            // Bedtime
            if (settingsMap.hasKey("bedtimeEnabled"))
                putBoolean(AntiShortsService.PREF_BEDTIME_ENABLED, settingsMap.getBoolean("bedtimeEnabled"))
            if (settingsMap.hasKey("bedtimeStartHour"))
                putInt(AntiShortsService.PREF_BEDTIME_START_H, settingsMap.getInt("bedtimeStartHour"))
            if (settingsMap.hasKey("bedtimeStartMin"))
                putInt(AntiShortsService.PREF_BEDTIME_START_M, settingsMap.getInt("bedtimeStartMin"))
            if (settingsMap.hasKey("bedtimeEndHour"))
                putInt(AntiShortsService.PREF_BEDTIME_END_H, settingsMap.getInt("bedtimeEndHour"))
            if (settingsMap.hasKey("bedtimeEndMin"))
                putInt(AntiShortsService.PREF_BEDTIME_END_M, settingsMap.getInt("bedtimeEndMin"))
            if (settingsMap.hasKey("ytSubsOnly"))
                putBoolean(AntiShortsService.PREF_YT_SUBS_ONLY, settingsMap.getBoolean("ytSubsOnly"))
        }.apply()
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val intent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
            }
            val apps: WritableArray = Arguments.createArray()
            val ownPkg = reactApplicationContext.packageName
            val resolveInfos = pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
            for (ri in resolveInfos) {
                val pkg = ri.activityInfo.packageName
                if (pkg == ownPkg) continue
                val label = ri.loadLabel(pm).toString()
                val map = Arguments.createMap()
                map.putString("name", label)
                map.putString("pkg", pkg)
                apps.pushMap(map)
            }
            promise.resolve(apps)
        } catch (e: Exception) {
            promise.reject("ERR_GET_APPS", e.message)
        }
    }
}
