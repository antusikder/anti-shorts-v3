package com.antishorts.shield

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Rect
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class AntiShortsService : AccessibilityService() {

    private lateinit var prefs: SharedPreferences
    private var lastActionTime = 0L

    private var systemEnabled = false
    private var scanIntervalMs = 150L
    private var skipAds = true
    
    private var ytEnabled = true
    private var ytShorts = true
    private var ytAutoBack = true
    
    // Multi-Method Arsenals (V5.1 & V6)
    private var method1Sweeper = true
    private var method2Sniper = true
    private var method3Geometric = true
    private var method4Bouncer = true
    private var method5Neural = true
    
    private var browserMonitoring = true
    private var panicMode = false
    private var panicEndTime = 0L

    private var shaperCategories = listOf<String>()
    private var blockedApps = listOf<String>()

    override fun onServiceConnected() {
        Log.i(TAG, "AntiShortsService Connected")
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.registerOnSharedPreferenceChangeListener { _, _ -> loadSettings() }
        loadSettings()
    }

    private fun loadSettings() {
        systemEnabled = prefs.getBoolean(PREF_SYSTEM_ENABLED, true)
        scanIntervalMs = prefs.getLong(PREF_SCAN_INTERVAL, 150L)
        skipAds = prefs.getBoolean(PREF_SKIP_ADS, true)
        
        ytEnabled = prefs.getBoolean(PREF_YT_ENABLED, true)
        ytShorts = prefs.getBoolean(PREF_YT_SHORTS, true)
        ytAutoBack = prefs.getBoolean(PREF_YT_AUTO_BACK, true)
        
        method1Sweeper = prefs.getBoolean("method1_sweeper", true)
        method2Sniper = prefs.getBoolean("method2_sniper", true)
        method3Geometric = prefs.getBoolean("method3_geometric", true)
        method4Bouncer = prefs.getBoolean("method4_bouncer", true)
        method5Neural = prefs.getBoolean("method5_neural", true)
        browserMonitoring = prefs.getBoolean("browser_monitoring", true)
        
        panicMode = prefs.getBoolean("panic_mode", false)
        panicEndTime = prefs.getLong("panic_end_time", 0L)

        val shaperRaw = prefs.getString("shaperCategories", "") ?: ""
        shaperCategories = if (shaperRaw.isNotBlank()) shaperRaw.split(",") else emptyList()

        if (prefs.getBoolean(PREF_BLOCK_ACTIVE, false)) {
            val raw = prefs.getString(PREF_BLOCKED_APPS, "") ?: ""
            blockedApps = if (raw.isNotBlank()) raw.split(",") else emptyList()
        } else {
            blockedApps = emptyList()
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (!systemEnabled) return

        // Check Hardware Panic
        val now = System.currentTimeMillis()
        if (panicMode) {
            if (now < panicEndTime) {
                enforcePanicBlock()
                return // Absolute interception. Cannot bypass.
            } else {
                panicMode = false
                prefs.edit().putBoolean("panic_mode", false).apply()
            }
        }

        val rootNode = rootInActiveWindow ?: return
        
        if (now - lastActionTime < scanIntervalMs) {
            return rootNode.recycle()
        }

        val pkg = event.packageName?.toString() ?: ""

        if (blockedApps.contains(pkg)) {
            performSafeBack("Blocked App Hit")
            return rootNode.recycle()
        }

        when (pkg) {
            "com.google.android.youtube" -> handleYouTubeApp(rootNode)
            "com.facebook.katana", "com.facebook.lite" -> handleFacebookApp(rootNode)
            "com.instagram.android" -> handleInstagramApp(rootNode)
            "com.android.chrome", "org.mozilla.firefox", "com.sec.android.app.sbrowser" -> handleBrowserApp(rootNode)
            else -> {
                // Background Neural Analyzer for obscure apps/players
                if (method5Neural) {
                    if (performNeuralAnalysis(rootNode, 0)) {
                        performSafeBack("M5_Neural: Universal intercept")
                        incrementStat("reelsRejectedToday")
                    }
                }
            }
        }

        rootNode.recycle()
    }

    private fun enforcePanicBlock() {
        val now = System.currentTimeMillis()
        if (now - lastActionTime > ACTION_COOLDOWN_MS) {
            performGlobalAction(GLOBAL_ACTION_HOME)
            Log.w(TAG, "PANIC LOCKDOWN: Overriding all intents.")
            lastActionTime = now
        }
    }

    private fun handleYouTubeApp(rootNode: AccessibilityNodeInfo) {
        if (!ytEnabled) return

        if (method4Bouncer && ytAutoBack && nodeExistsByViewId(rootNode, "com.google.android.youtube:id/shorts_player_view")) {
            performSafeBack("M4_Bouncer: Direct Shorts Player Hook")
            incrementStat("shortsRejectedToday")
            return
        }

        if (skipAds) {
            // Safe array, excluding 'Close' to avoid hover player breaks
            val hasAdProgress = recursiveFindById(rootNode, listOf("com.google.android.youtube:id/ad_progress", "ad_countdown"))
            if(hasAdProgress || recursiveFindByTextExact(rootNode, listOf("Skip Ad", "Skip ads", "Skip navigation"))) {
               if(clickNodesByText(rootNode, listOf("Skip Ad", "Skip ads", "Skip navigation", "No thanks"))) {
                   incrementStat("adsRemovedToday")
               }
            }
        }

        if (ytShorts) {
            if (method1Sweeper) {
                method1ShelfSweeper(rootNode, listOf("Shorts"))
            }
            if (method2Sniper) {
                if (clickNodesByText(rootNode, listOf("Not interested", "Don't recommend channel"))) {
                    lastActionTime = System.currentTimeMillis()
                }
            }
            if (method3Geometric) {
                if(assessGeometricFrames(rootNode, 0)) {
                    performSafeBack("M3_Geometric: Height > Width Shorts ratio detected.")
                    incrementStat("shortsRejectedToday")
                    return
                }
            }
        }
    }

    private fun handleFacebookApp(rootNode: AccessibilityNodeInfo) {
        if (method1Sweeper) {
            method1ShelfSweeper(rootNode, listOf("Reels and short videos", "Reels"))
        }

        if (method4Bouncer) {
            if (nodeExistsByViewId(rootNode, "com.facebook.katana:id/reels_tab") ||
                nodeExistsByViewId(rootNode, "com.facebook.katana:id/viewer_container")) {
                performSafeBack("M4_Bouncer: Facebook Viewer Tab Hook")
                incrementStat("reelsRejectedToday")
                return
            }
        }

        if (method2Sniper) {
            clickNodesByText(rootNode, listOf("Show fewer", "Hide reel"))
        }

        if (method5Neural) {
            if (performNeuralAnalysis(rootNode, 0)) {
                performSafeBack("M5_Neural: Intercepted FB reel via depth-anchor heuristics")
                incrementStat("reelsRejectedToday")
                return
            }
        }
    }

    private fun handleInstagramApp(rootNode: AccessibilityNodeInfo) {
        if (method4Bouncer && nodeExistsByViewId(rootNode, "com.instagram.android:id/clips_video_container")) {
            performSafeBack("M4_Bouncer: Instagram Clips Hook")
            incrementStat("reelsRejectedToday")
            return
        }
        
        if (method3Geometric) {
            if(assessGeometricFrames(rootNode, 0)) {
                performSafeBack("M3_Geometric: Fullscreen IG Reel blocked")
                incrementStat("reelsRejectedToday")
                return
            }
        }
    }

    private fun handleBrowserApp(rootNode: AccessibilityNodeInfo) {
        if (!browserMonitoring) return

        val urlBox = rootNode.findAccessibilityNodeInfosByViewId("com.android.chrome:id/url_bar").firstOrNull()
            ?: rootNode.findAccessibilityNodeInfosByViewId("org.mozilla.firefox:id/mozac_browser_toolbar_url_view").firstOrNull()
            ?: rootNode.findAccessibilityNodeInfosByViewId("com.sec.android.app.sbrowser:id/location_bar_edit_text").firstOrNull()

        urlBox?.text?.toString()?.toLowerCase()?.let { url ->
            if (url.contains("youtube.com/shorts") || url.contains("facebook.com/reels") || url.contains("instagram.com/reels")) {
                performSafeBack("M4_Bouncer: URL Regex Trap Hook")
                incrementStat(if (url.contains("shorts")) "shortsRejectedToday" else "reelsRejectedToday")
            }
        }
        urlBox?.recycle()
    }

    /**
     * METHOD 5: Neural Anchor
     * Trains on 1k-heuristic depth intersections common in full-screen short media players
     * ignoring explicit IDs or specific texts entirely to defeat obfuscation.
     */
    private fun performNeuralAnalysis(node: AccessibilityNodeInfo, depth: Int): Boolean {
        if (depth > 20 || node.isDestroyed) return false
        
        // Depth-First Mathematical Screen Space Coverage.
        if (node.className == "android.widget.FrameLayout" || node.className == "androidx.viewpager2.widget.ViewPager2" || node.className == "android.widget.ScrollView") {
            if (node.childCount in 1..3 && depth in 2..8) {
               val b = Rect()
               node.getBoundsInScreen(b)
               val ratio = b.height().toFloat() / Math.max(1f, b.width().toFloat())
               if (ratio > 1.6f && b.height() > 1800) {
                    val descendants = countDeepChildren(node, 0)
                    // Full-screen video players typically have dense overlay UI layers
                    if (descendants in 15..80 && node.isScrollable) return true
               }
            }
        }
        
        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                if(performNeuralAnalysis(child, depth + 1)) {
                     child.recycle()
                     return true
                }
                child.recycle()
            }
        }
        return false
    }

    private fun countDeepChildren(node: AccessibilityNodeInfo, depth: Int): Int {
        if (depth > 6 || node.isDestroyed) return 0
        var total = node.childCount
        for (i in 0 until node.childCount) {
             val c = node.getChild(i)
             if (c != null) {
                 total += countDeepChildren(c, depth + 1)
                 c.recycle()
             }
        }
        return total
    }

    private fun method1ShelfSweeper(rootNode: AccessibilityNodeInfo, targetTexts: List<String>) {
        targetTexts.forEach { text ->
            rootNode.findAccessibilityNodeInfosByText(text).forEach { node ->
                if (node.className?.toString() == "android.widget.TextView") {
                    var parent = node.parent
                    var attempts = 0
                    while (parent != null && attempts < 4) {
                        if (parent.childCount > 0) {
                            if (findAndClickMenu(parent)) {
                                parent.recycle()
                                return
                            }
                        }
                        val nextParent = parent.parent
                        parent.recycle()
                        parent = nextParent
                        attempts++
                    }
                }
                node.recycle()
            }
        }
    }

    private fun findAndClickMenu(node: AccessibilityNodeInfo): Boolean {
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val desc = child.contentDescription?.toString()?.toLowerCase() ?: ""
            if (desc.contains("action menu") || desc.contains("more") || child.className == "android.widget.ImageView") {
                if (child.isClickable) {
                    child.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    lastActionTime = System.currentTimeMillis()
                    child.recycle()
                    return true
                }
            }
            if (findAndClickMenu(child)) {
                child.recycle()
                return true
            }
            child.recycle()
        }
        return false
    }

    private fun assessGeometricFrames(node: AccessibilityNodeInfo, depth: Int): Boolean {
        if (depth > 20 || node.isDestroyed) return false
        val bounds = Rect()
        node.getBoundsInScreen(bounds)
        val h = bounds.height()
        val w = Math.max(1, bounds.width())
        val ratio = h.toFloat() / w.toFloat()
        
        if (ratio > 1.7f && h > 1600 && (node.className?.toString()?.contains("Player") == true || node.className?.toString()?.contains("Video") == true)) {
            return true
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                if (assessGeometricFrames(child, depth + 1)) {
                    child.recycle()
                    return true
                }
                child.recycle()
            }
        }
        return false
    }

    private fun nodeExistsByViewId(node: AccessibilityNodeInfo, viewId: String): Boolean {
        val found = node.findAccessibilityNodeInfosByViewId(viewId)
        val exists = found.isNotEmpty()
        found.forEach { it.recycle() }
        return exists
    }

    private fun recursiveFindById(node: AccessibilityNodeInfo, partialIds: List<String>): Boolean {
        partialIds.forEach { pid ->
            if (nodeExistsByViewId(node, pid)) return true
        }
        return false
    }

    private fun recursiveFindByTextExact(node: AccessibilityNodeInfo, targets: List<String>): Boolean {
        targets.forEach { target ->
            val found = node.findAccessibilityNodeInfosByText(target)
            val matched = found.any { it.text?.toString()?.equals(target, ignoreCase = true) == true }
            found.forEach { it.recycle() }
            if (matched) return true
        }
        return false
    }

    private fun clickNodesByText(node: AccessibilityNodeInfo, texts: List<String>): Boolean {
        var clicked = false
        texts.forEach { text ->
            val found = node.findAccessibilityNodeInfosByText(text)
            for (n in found) {
                // Must be exact match roughly
                if (n.text?.toString()?.equals(text, ignoreCase = true) == true) {
                    var clickTarget = n
                    var pAttempts = 0
                    while (clickTarget != null && !clickTarget.isClickable && pAttempts < 4) {
                        val p = clickTarget.parent
                        if (clickTarget != n) clickTarget.recycle()
                        clickTarget = p
                        pAttempts++
                    }
                    if (clickTarget?.isClickable == true) {
                        clickTarget.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        clicked = true
                        lastActionTime = System.currentTimeMillis()
                    }
                    if (clickTarget != null && clickTarget != n) clickTarget.recycle()
                }
                n.recycle()
            }
        }
        return clicked
    }

    private fun incrementStat(key: String) {
        val today = prefs.getString("lastStatDate", "")
        val currentDate = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
        val edit = prefs.edit()
        
        if (today != currentDate) {
            edit.putString("lastStatDate", currentDate)
            edit.putInt(key, 1)
        } else {
            edit.putInt(key, prefs.getInt(key, 0) + 1)
        }
        
        // Push exact trigger to feed the Reward Engine
        edit.putLong("latestRewardTriggerAt", System.currentTimeMillis())
        
        edit.apply()
    }

    private fun performSafeBack(reason: String) {
        val now = System.currentTimeMillis()
        if (now - lastActionTime > ACTION_COOLDOWN_MS) {
            performGlobalAction(GLOBAL_ACTION_BACK)
            Log.d(TAG, "BACK_BOUNCER: $reason")
            lastActionTime = now
        }
    }

    override fun onInterrupt() {}

    companion object {
        const val TAG = "AntiShortsService"
        const val PREFS_NAME = "AntiShortsPrefs"
        const val ACTION_COOLDOWN_MS = 600L

        const val PREF_SYSTEM_ENABLED = "systemEnabled"
        const val PREF_SCAN_INTERVAL = "scanIntervalMs"
        const val PREF_SKIP_ADS = "skipAds"
        
        const val PREF_YT_ENABLED = "ytEnabled"
        const val PREF_YT_SHORTS = "youtubeRemoveShorts"
        const val PREF_YT_AUTO_BACK = "youtubeAutoBack"
        
        const val PREF_BLOCK_ACTIVE = "blockActive"
        const val PREF_BLOCKED_APPS = "blockedApps"
    }
}
