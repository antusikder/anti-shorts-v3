package com.antishorts.shield

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray

class AntiShortsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val prefs: SharedPreferences = reactContext.getSharedPreferences("AntiShortsPrefs", Context.MODE_PRIVATE)
    
    override fun getName(): String = "AntiShortsModule"

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        val am = reactApplicationContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabled = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        promise.resolve(enabled.any { it.resolveInfo.serviceInfo.packageName == reactApplicationContext.packageName })
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_HISTORY or Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            try {
                // Intense Fallback for deeply locked OEM ROMs (Samsung, UI, Xiaomi)
                val fallback = Intent(Settings.ACTION_SETTINGS)
                fallback.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                reactApplicationContext.startActivity(fallback)
            } catch (ignored: Exception) {}
        }
    }

    @ReactMethod
    fun updateSettings(m: ReadableMap) {
        prefs.edit().apply {
            if (m.hasKey("ytEnabled")) putBoolean("ytEnabled", m.getBoolean("ytEnabled"))
            if (m.hasKey("youtubeRemoveShorts")) putBoolean("youtubeRemoveShorts", m.getBoolean("youtubeRemoveShorts"))
            if (m.hasKey("youtubeAutoBack")) putBoolean("youtubeAutoBack", m.getBoolean("youtubeAutoBack"))
            if (m.hasKey("systemEnabled")) putBoolean("systemEnabled", m.getBoolean("systemEnabled"))
            if (m.hasKey("skipAds")) putBoolean("skipAds", m.getBoolean("skipAds"))
            if (m.hasKey("scanSpeedMs")) putLong("scanIntervalMs", m.getInt("scanSpeedMs").toLong())
            if (m.hasKey("blockActive")) putBoolean("blockActive", m.getBoolean("blockActive"))
            if (m.hasKey("blockedApps")) putString("blockedApps", m.getString("blockedApps"))
            if (m.hasKey("shaperCategories")) putString("shaperCategories", m.getString("shaperCategories"))
            if (m.hasKey("method1_sweeper")) putBoolean("method1_sweeper", m.getBoolean("method1_sweeper"))
            if (m.hasKey("method2_sniper")) putBoolean("method2_sniper", m.getBoolean("method2_sniper"))
            if (m.hasKey("method3_geometric")) putBoolean("method3_geometric", m.getBoolean("method3_geometric"))
            if (m.hasKey("method4_bouncer")) putBoolean("method4_bouncer", m.getBoolean("method4_bouncer"))
            if (m.hasKey("method5_neural")) putBoolean("method5_neural", m.getBoolean("method5_neural"))
            if (m.hasKey("browser_monitoring")) putBoolean("browser_monitoring", m.getBoolean("browser_monitoring"))
            if (m.hasKey("panic_mode")) putBoolean("panic_mode", m.getBoolean("panic_mode"))
        }.apply()
    }

    @ReactMethod
    fun triggerSuddenBlock(durationMin: Int) {
        prefs.edit().apply {
            putBoolean("panic_mode", true)
            putLong("panic_end_time", System.currentTimeMillis() + (durationMin * 60 * 1000L))
        }.apply()
    }

    @ReactMethod
    fun getRewardTrigger(promise: Promise) {
        promise.resolve(prefs.getLong("latestRewardTriggerAt", 0L).toDouble())
    }

    @ReactMethod
    fun clearRewardTrigger() {
        prefs.edit().putLong("latestRewardTriggerAt", 0L).apply()
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
