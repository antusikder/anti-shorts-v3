package com.antishorts.shield

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * FreshMindService — Safe, throttled accessibility scanner v5.0
 *
 * SAFETY RULES (enforced in code):
 * 1. Never call rootInActiveWindow in a loop
 * 2. Always null-check every AccessibilityNodeInfo
 * 3. Always recycle() every node after use
 * 4. Minimum 800ms between any action
 * 5. Hard package whitelist — ignore everything else
 * 6. No deep recursion — max 4 levels
 * 7. One action per event — never chain actions
 * 8. No isDestroyed — not in this API level
 */
class AntiShortsService : AccessibilityService() {

    private val TAG = "FreshMindService"

    private lateinit var prefs: SharedPreferences
    private lateinit var handler: Handler

    // Throttle state
    private var lastActionTime = 0L
    private val MIN_ACTION_INTERVAL_MS = 800L

    // Cached prefs (avoid disk reads on every event)
    private var systemEnabled = true
    private var ytEnabled = true
    private var ytRemoveShorts = true
    private var skipAds = true
    private var fbEnabled = true
    private var fbRemoveReels = true
    private var igEnabled = true
    private var suddenBlockEndTime = 0L

    // Package whitelist
    private val SUPPORTED_PACKAGES = setOf(
        "com.google.android.youtube",
        "com.facebook.katana",
        "com.facebook.lite",
        "com.instagram.android",
        "com.zhiliaoapp.musically",
        "com.ss.android.ugc.trill",
        "com.reddit.frontpage",
        "com.twitter.android",
        "com.snapchat.android"
    )

    // Prefs reload interval (ms) — don't read disk every event
    private var lastPrefsLoad = 0L
    private val PREFS_CACHE_MS = 2000L

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "FreshMind Service Connected v5.0")
        prefs = applicationContext.getSharedPreferences(
            AntiShortsService.PREFS_NAME, Context.MODE_PRIVATE
        )
        handler = Handler(Looper.getMainLooper())
        loadPrefs()

        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or
                         AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            packageNames = SUPPORTED_PACKAGES.toTypedArray()
            notificationTimeout = 200
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        }
        this.serviceInfo = info
    }

    private fun loadPrefs() {
        val now = System.currentTimeMillis()
        if (now - lastPrefsLoad < PREFS_CACHE_MS) return
        lastPrefsLoad = now
        systemEnabled = prefs.getBoolean(PREF_SYSTEM_ENABLED, true)
        ytEnabled = prefs.getBoolean(PREF_YT_ENABLED, true)
        ytRemoveShorts = prefs.getBoolean(PREF_YT_SHORTS, true)
        skipAds = prefs.getBoolean(PREF_SKIP_ADS, true)
        fbEnabled = prefs.getBoolean(PREF_FB_ENABLED, true)
        fbRemoveReels = prefs.getBoolean(PREF_FB_REELS, true)
        igEnabled = prefs.getBoolean(PREF_IG_ENABLED, true)
        suddenBlockEndTime = prefs.getLong(PREF_SUDDEN_BLOCK, 0L)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val now = System.currentTimeMillis()

        // Throttle events
        if (now - lastActionTime < MIN_ACTION_INTERVAL_MS) return

        // Load cached prefs
        loadPrefs()

        // Panic mode — boot to home
        if (suddenBlockEndTime > now) {
            performGlobalAction(GLOBAL_ACTION_HOME)
            lastActionTime = now
            Log.d(TAG, "Panic mode active — sent to home")
            return
        }

        if (!systemEnabled) return

        val pkg = event.packageName?.toString() ?: return
        if (!SUPPORTED_PACKAGES.contains(pkg)) return

        // Get root safely — ONE call per event
        val root = rootInActiveWindow ?: return

        try {
            when (pkg) {
                "com.google.android.youtube" -> handleYouTube(root, now)
                "com.facebook.katana", "com.facebook.lite" -> handleFacebook(root, now)
                "com.instagram.android" -> handleInstagram(root, now)
                "com.zhiliaoapp.musically", "com.ss.android.ugc.trill" -> handleTikTok(root, now)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Handler exception: ${e.message}")
        } finally {
            safeRecycle(root)
        }
    }

    // ─── YouTube ────────────────────────────────────────────────────────────────

    private fun handleYouTube(root: AccessibilityNodeInfo, now: Long) {
        // 1. Check if viewing Shorts player
        if (ytRemoveShorts && isViewingYouTubeShort(root)) {
            Log.d(TAG, "YouTube Shorts detected — going back")
            performGlobalAction(GLOBAL_ACTION_BACK)
            lastActionTime = now
            recordStat("shortsShieldedToday")
            return
        }

        // 2. Skip ads
        if (skipAds) {
            val skipped = trySkipAd(root)
            if (skipped) {
                lastActionTime = now
                recordStat("adsRemovedToday")
                return
            }
        }
    }

    private fun isViewingYouTubeShort(root: AccessibilityNodeInfo): Boolean {
        // Method 1: Check by viewId (most reliable)
        val shortsIds = listOf("shorts_player", "reel_recycler", "shorts_shelf")
        for (id in shortsIds) {
            val nodes = root.findAccessibilityNodeInfosByViewId("com.google.android.youtube:id/$id")
            if (nodes != null && nodes.isNotEmpty()) {
                nodes.forEach { safeRecycle(it) }
                return true
            }
        }

        // Method 2: Check content description "Shorts" on a current tab/button
        val shortsTabs = root.findAccessibilityNodeInfosByText("Shorts")
        if (shortsTabs != null) {
            for (node in shortsTabs) {
                val isSelected = node.isSelected
                val viewId = node.viewIdResourceName ?: ""
                safeRecycle(node)
                if (isSelected && viewId.contains("tab")) return true
            }
        }

        return false
    }

    private fun trySkipAd(root: AccessibilityNodeInfo): Boolean {
        val skipTexts = listOf("Skip Ad", "Skip ads", "Skip")
        for (text in skipTexts) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes != null) {
                for (node in nodes) {
                    val clickable = findClickableParent(node, 3)
                    if (clickable != null) {
                        clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        safeRecycle(clickable)
                        nodes.forEach { safeRecycle(it) }
                        return true
                    }
                    safeRecycle(node)
                }
            }
        }
        return false
    }

    // ─── Facebook ───────────────────────────────────────────────────────────────

    private fun handleFacebook(root: AccessibilityNodeInfo, now: Long) {
        if (!fbEnabled || !fbRemoveReels) return

        if (isViewingFacebookReel(root)) {
            Log.d(TAG, "Facebook Reel detected — going back")
            performGlobalAction(GLOBAL_ACTION_BACK)
            lastActionTime = now
            recordStat("reelsRejectedToday")
        }
    }

    private fun isViewingFacebookReel(root: AccessibilityNodeInfo): Boolean {
        val reelIds = listOf("reels_video_player", "reels_viewer_video", "reel_container")
        for (id in reelIds) {
            val nodes = root.findAccessibilityNodeInfosByViewId("com.facebook.katana:id/$id")
                ?: root.findAccessibilityNodeInfosByViewId("com.facebook.lite:id/$id")
            if (nodes != null && nodes.isNotEmpty()) {
                nodes.forEach { safeRecycle(it) }
                return true
            }
        }
        return false
    }

    // ─── Instagram ──────────────────────────────────────────────────────────────

    private fun handleInstagram(root: AccessibilityNodeInfo, now: Long) {
        if (!igEnabled) return

        if (isViewingInstagramReel(root)) {
            Log.d(TAG, "Instagram Reel detected — going back")
            performGlobalAction(GLOBAL_ACTION_BACK)
            lastActionTime = now
            recordStat("reelsRejectedToday")
        }
    }

    private fun isViewingInstagramReel(root: AccessibilityNodeInfo): Boolean {
        val reelIds = listOf("reel_viewer_container", "clips_viewer_item_view")
        for (id in reelIds) {
            val nodes = root.findAccessibilityNodeInfosByViewId("com.instagram.android:id/$id")
            if (nodes != null && nodes.isNotEmpty()) {
                nodes.forEach { safeRecycle(it) }
                return true
            }
        }
        return false
    }

    // ─── TikTok ─────────────────────────────────────────────────────────────────

    private fun handleTikTok(root: AccessibilityNodeInfo, now: Long) {
        // TikTok IS a short-form video app — if enabled, go back on any video view
        Log.d(TAG, "TikTok open — going back")
        performGlobalAction(GLOBAL_ACTION_BACK)
        lastActionTime = now
        recordStat("shortsShieldedToday")
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Walk up the tree to find a clickable parent, max [maxDepth] levels.
     * Returns null if not found. Caller must recycle the returned node.
     */
    private fun findClickableParent(node: AccessibilityNodeInfo?, maxDepth: Int): AccessibilityNodeInfo? {
        var current = node
        var depth = 0
        while (current != null && depth < maxDepth) {
            if (current.isClickable) return current
            val parent = current.parent
            if (depth > 0) safeRecycle(current) // don't recycle the original
            current = parent
            depth++
        }
        return null
    }

    private fun safeRecycle(node: AccessibilityNodeInfo?) {
        try { node?.recycle() } catch (_: Exception) {}
    }

    private fun recordStat(key: String) {
        try {
            val current = prefs.getInt(key, 0)
            prefs.edit().putInt(key, current + 1).apply()
        } catch (_: Exception) {}
    }

    override fun onInterrupt() {
        Log.d(TAG, "FreshMind Service Interrupted")
    }

    companion object {
        const val PREFS_NAME = "com.antishorts.shield.PREFERENCE_FILE_KEY"
        const val PREF_YT_ENABLED = "youtube_enabled"
        const val PREF_YT_SHORTS = "youtube_removeShorts"
        const val PREF_YT_AUTO_BACK = "youtubeAutoBack"
        const val PREF_SYSTEM_ENABLED = "systemEnabled"
        const val PREF_SKIP_ADS = "skipAds"
        const val PREF_SCAN_INTERVAL = "scanIntervalMs"
        const val PREF_BLOCK_ACTIVE = "blockActive"
        const val PREF_BLOCKED_APPS = "blockedApps"
        const val PREF_FB_ENABLED = "facebook_enabled"
        const val PREF_FB_REELS = "facebook_removeReels"
        const val PREF_IG_ENABLED = "instagram_enabled"
        const val PREF_TT_ENABLED = "tiktok_enabled"
        const val PREF_SUDDEN_BLOCK = "suddenBlockEndTime"
        const val PREF_FEED_MODE = "feedMode"
    }
}
