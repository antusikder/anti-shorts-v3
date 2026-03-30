package com.antishorts.shield

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*

class AntiShortsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences by lazy {
        reactContext.getSharedPreferences(AntiShortsService.PREFS, Context.MODE_PRIVATE)
    }

    override fun getName() = "AntiShortsModule"

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        try {
            val mgr = reactApplicationContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as android.view.accessibility.AccessibilityManager
            val enabledServices = android.provider.Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            val pkg = reactApplicationContext.packageName
            promise.resolve(enabledServices.contains(pkg))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        try {
            val intent = android.content.Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            try {
                val fallback = android.content.Intent(android.provider.Settings.ACTION_SETTINGS)
                fallback.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
                reactApplicationContext.startActivity(fallback)
            } catch (_: Exception) {}
        }
    }

    @ReactMethod
    fun updateSettings(settings: ReadableMap) {
        val editor = prefs.edit()
        settings.toHashMap().forEach { (key, value) ->
            when (value) {
                is Boolean -> editor.putBoolean(key, value)
                is Double  -> editor.putLong(key, value.toLong())
                is String  -> editor.putString(key, value)
                else       -> {}
            }
        }
        editor.apply()
    }

    @ReactMethod
    fun getStats(promise: Promise) {
        val map = Arguments.createMap()
        map.putInt("shortsBlocked", prefs.getInt("shortsBlocked", 0))
        map.putInt("reelsBlocked",  prefs.getInt("reelsBlocked", 0))
        map.putInt("adsSkipped",    prefs.getInt("adsSkipped", 0))
        promise.resolve(map)
    }

    @ReactMethod
    fun getRewardTrigger(promise: Promise) {
        promise.resolve(prefs.getLong("rewardTriggerTime", 0L).toDouble())
    }

    @ReactMethod
    fun clearRewardTrigger() {
        prefs.edit().remove("rewardTriggerTime").apply()
    }
}
