package com.antishorts.shield

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray

class AntiShortsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val prefs: SharedPreferences = reactContext.getSharedPreferences(AntiShortsService.PREFS_NAME, Context.MODE_PRIVATE)
    override fun getName(): String = "AntiShortsModule"

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        val am = reactApplicationContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabled = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        promise.resolve(enabled.any { it.resolveInfo.serviceInfo.packageName == reactApplicationContext.packageName })
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        reactApplicationContext.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK })
    }

    @ReactMethod
    fun updateSettings(m: ReadableMap) {
        prefs.edit().apply {
            if (m.hasKey("ytEnabled")) putBoolean(AntiShortsService.PREF_YT_ENABLED, m.getBoolean("ytEnabled"))
            if (m.hasKey("youtubeRemoveShorts")) putBoolean(AntiShortsService.PREF_YT_SHORTS, m.getBoolean("youtubeRemoveShorts"))
            if (m.hasKey("youtubeAutoBack")) putBoolean(AntiShortsService.PREF_YT_AUTO_BACK, m.getBoolean("youtubeAutoBack"))
            if (m.hasKey("systemEnabled")) putBoolean(AntiShortsService.PREF_SYSTEM_ENABLED, m.getBoolean("systemEnabled"))
            if (m.hasKey("skipAds")) putBoolean(AntiShortsService.PREF_SKIP_ADS, m.getBoolean("skipAds"))
            if (m.hasKey("scanIntervalMs")) putLong(AntiShortsService.PREF_SCAN_INTERVAL, m.getInt("scanIntervalMs").toLong())
            if (m.hasKey("blockActive")) putBoolean(AntiShortsService.PREF_BLOCK_ACTIVE, m.getBoolean("blockActive"))
            if (m.hasKey("blockedApps")) putString(AntiShortsService.PREF_BLOCKED_APPS, m.getString("blockedApps"))
        }.apply()
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        val pm = reactApplicationContext.packageManager
        val apps: WritableArray = Arguments.createArray()
        pm.queryIntentActivities(Intent(Intent.ACTION_MAIN).apply { addCategory(Intent.CATEGORY_LAUNCHER) }, 0).forEach {
            val pkg = it.activityInfo.packageName
            if (pkg != reactApplicationContext.packageName) {
                apps.pushMap(Arguments.createMap().apply { putString("name", it.loadLabel(pm).toString()); putString("pkg", pkg) })
            }
        }
        promise.resolve(apps)
    }
}
