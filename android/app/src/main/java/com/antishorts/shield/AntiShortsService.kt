package com.antishorts.shield

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.util.Calendar
import java.util.Locale

class AntiShortsService : AccessibilityService() {

    companion object {
        private const val TAG = "FreshMindService"
        const val PREFS_NAME = "antishorts_prefs"

        const val PREF_YT_ENABLED       = "yt_enabled"
        const val PREF_YT_SHORTS        = "yt_remove_shorts"
        const val PREF_YT_AUTO_BACK     = "yt_auto_back"
        const val PREF_FB_ENABLED       = "fb_enabled"
        const val PREF_FB_REELS         = "fb_remove_reels"
        const val PREF_FB_AUTO_BACK     = "fb_auto_back"
        const val PREF_IG_ENABLED       = "ig_enabled"
        const val PREF_TT_ENABLED       = "tt_enabled"
        const val PREF_SKIP_ADS         = "skip_ads"
        const val PREF_SYSTEM_ENABLED   = "system_enabled"
        const val PREF_SCAN_INTERVAL    = "scan_interval_ms"
        const val PREF_FEED_MODE        = "feed_mode"
        const val PREF_YT_SUBS_ONLY     = "yt_subs_only"
        const val PREF_DETOX_END_TIME   = "detox_end_time"
        const val PREF_BLOCK_ACTIVE     = "block_active"
        const val PREF_BLOCKED_APPS     = "blocked_apps"
        const val PREF_BEDTIME_ENABLED  = "bedtime_enabled"
        const val PREF_BEDTIME_START_H  = "bedtime_start_hour"
        const val PREF_BEDTIME_START_M  = "bedtime_start_min"
        const val PREF_BEDTIME_END_H    = "bedtime_end_hour"
        const val PREF_BEDTIME_END_M    = "bedtime_end_min"
        const val PREF_SUDDEN_BLOCK     = "sudden_block_end_time"

        const val PKG_YOUTUBE          = "com.google.android.youtube"
        const val PKG_FACEBOOK         = "com.facebook.katana"
        const val PKG_INSTAGRAM        = "com.instagram.android"
        const val PKG_TIKTOK           = "com.zhiliaoapp.musically"

        val BROWSER_PACKAGES = setOf(
            "com.android.chrome", "com.brave.browser", "org.mozilla.firefox",
            "com.opera.browser", "com.microsoft.emmx", "com.sec.android.app.sbrowser",
            "com.kiwibrowser.browser", "com.duckduckgo.mobile.android"
        )

        const val DEFAULT_SCAN_INTERVAL = 150L
        const val MENU_READ_DELAY_MS    = 300L
        const val RETRY_DELAY_MS        = 80L

        val YT_SHORTS_PLAYER_IDS = listOf(
            "com.google.android.youtube:id/reel_player_view_container",
            "com.google.android.youtube:id/shorts_container",
            "com.google.android.youtube:id/reel_watch_player",
            "com.google.android.youtube:id/shorts_player_container",
            "com.google.android.youtube:id/shorts_slide_layout",
            "com.google.android.youtube:id/reels_player_overlay",
            "com.google.android.youtube:id/shorts_video_cell"
        )

        val YT_SHORTS_SHELF_TEXT = listOf("Shorts", "YouTube Shorts", "Short videos")
        val YT_SHORTS_SHELF_IDS = listOf(
            "com.google.android.youtube:id/shorts_shelf_container",
            "com.google.android.youtube:id/reel_shelf_container"
        )

        val YT_FEWER_SHORTS_TEXT = listOf(
            "Fewer Shorts",
            "Show fewer Shorts",
            "Hide Shorts Shelf",
            "Stop recommending Shorts"
        )

        val FB_REELS_TEXT = listOf("Reel by", "Reels", "Reel •", "Watch Reel", "Reel ·", "Suggested Reels", "Featured Reels")
        val IG_REELS_TEXT = listOf("Reels", "Reel")
        val FB_FEWER_REELS_TEXT = listOf(
            "Hide Reel", "Hide Reels", "Show less",
            "Show fewer Reels", "See fewer Reels", "Don't show Reels", "Snooze"
        )

        val YT_SKIP_AD_IDS = listOf(
            "com.google.android.youtube:id/skip_ad_button",
            "com.google.android.youtube:id/skip_button",
            "com.google.android.youtube:id/skip_ad_button_text"
        )
        val YT_SKIP_AD_TEXTS = listOf("Skip ad", "Skip ads", "Skip Ad", "Skip Ads", "Skip", "SKIP AD", "SKIP ADS")

        val AD_CENTER_TEXTS = listOf("Ad ·", "Ad •", "Sponsored", "About this ad", "Ad Center")
        val AD_DISMISS_TEXTS = listOf("Dismiss", "Hide ad", "Stop seeing this ad", "Report ad", "Close")

        val STICKY_AD_IDS = listOf(
            "com.google.android.youtube:id/close_button", "com.google.android.youtube:id/dismiss_button",
            "com.google.android.youtube:id/skip_ad_button_compact", "com.google.android.youtube:id/ad_close_button",
            "com.google.android.youtube:id/ad_presenter_overlay", "com.google.android.youtube:id/companion_ad_container",
            "com.google.android.youtube:id/masthead_ad_container", "com.google.android.youtube:id/player_overlay_ads_ui_container_view"
        )

        val MENU_BUTTON_KEYWORDS = setOf("more", "option", "menu", "overflow")
        const val SHORT_MENU_MAX_ITEMS  = 3
    }

    private val handler = Handler(Looper.getMainLooper())
    private var lastCheckTime = 0L
    private lateinit var prefs: SharedPreferences
    private var lastBackPressTime = 0L
    private var lastScanTime = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        Log.d(TAG, "FreshMind Elite Service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        try {
            event ?: return
            val pkg = event.packageName?.toString() ?: return
            val now = System.currentTimeMillis()
            val interval = prefs.getLong(PREF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)
            if (now - lastCheckTime < interval) return
            lastCheckTime = now

            if (isDetoxActive() || isSuddenBlockActive()) {
                if (getBlockList().contains(pkg)) {
                    performGlobalAction(GLOBAL_ACTION_HOME)
                    return
                }
            }

            val eventType = event.eventType
            if (eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) {
                if (now - lastScanTime < 250L) return
                lastScanTime = now
            }

            if (pkg != PKG_YOUTUBE && eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) return
            if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) return

            if (!prefs.getBoolean(PREF_SYSTEM_ENABLED, true)) return
            if (prefs.getBoolean(PREF_BLOCK_ACTIVE, false) && getBlockedList().contains(pkg)) {
                performGlobalAction(GLOBAL_ACTION_HOME)
                return
            }
            if (prefs.getBoolean(PREF_BEDTIME_ENABLED, false) && isInBedtimeWindow() && getBlockedList().contains(pkg)) {
                performGlobalAction(GLOBAL_ACTION_HOME)
                return
            }

            if (BROWSER_PACKAGES.contains(pkg)) {
                val root = rootInActiveWindow ?: return
                try { handleBrowser(root) } finally { safeRecycle(root) }
                return
            }

            val supported = listOf(PKG_YOUTUBE, PKG_FACEBOOK, PKG_INSTAGRAM, PKG_TIKTOK)
            if (!supported.contains(pkg)) return

            val root = rootInActiveWindow ?: return
            try {
                when (pkg) {
                    PKG_YOUTUBE   -> handleYoutube(root)
                    PKG_FACEBOOK  -> handleFacebook(root)
                    PKG_INSTAGRAM -> handleInstagram(root)
                    PKG_TIKTOK    -> handleTiktok(root)
                }
            } finally { safeRecycle(root) }
        } catch (e: Exception) { Log.e(TAG, "Event crash: ${e.message}") }
    }

    private fun handleYoutube(root: AccessibilityNodeInfo) {
        if (!prefs.getBoolean(PREF_YT_ENABLED, true)) return
        if (prefs.getBoolean(PREF_SKIP_ADS, true)) {
            val allAdIds = YT_SKIP_AD_IDS + STICKY_AD_IDS
            for (id in allAdIds) {
                val nodes = root.findAccessibilityNodeInfosByViewId(id)
                if (nodes.isNotEmpty()) {
                    val target = nodes.firstOrNull { it.isVisibleToUser && it.isEnabled }
                    if (target != null) {
                        val clickable = if (target.isClickable) target else findClickableParent(target)
                        if (clickable != null) {
                            clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                            nodes.forEach { safeRecycle(it) }
                            return
                        }
                    }
                    nodes.forEach { safeRecycle(it) }
                }
            }
            if (skipAdByText(root)) return
        }
        if (prefs.getBoolean(PREF_YT_AUTO_BACK, true) && isShortsPlayerVisible(root)) {
            val now = System.currentTimeMillis()
            if (now - lastBackPressTime > 400L) {
                lastBackPressTime = now
                performGlobalAction(GLOBAL_ACTION_BACK)
            }
            return
        }
        if (prefs.getBoolean(PREF_YT_SHORTS, true)) { handleYtShortsInFeed(root) }
    }

    private fun skipAdByText(root: AccessibilityNodeInfo): Boolean {
        for (text in YT_SKIP_AD_TEXTS) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes.isNotEmpty()) {
                val target = nodes.firstOrNull { it.isVisibleToUser }
                if (target != null) {
                    val clickable = if (target.isClickable) target else findClickableParent(target)
                    if (clickable != null) {
                        clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        nodes.forEach { safeRecycle(it) }
                        return true
                    }
                }
                nodes.forEach { safeRecycle(it) }
            }
        }
        return false
    }

    private fun handleYtShortsInFeed(root: AccessibilityNodeInfo) {
        for (id in YT_SHORTS_SHELF_IDS) {
            val shelves = root.findAccessibilityNodeInfosByViewId(id)
            if (shelves.isNotEmpty()) {
                for (shelf in shelves) {
                    if (shelf.isVisibleToUser) {
                        // REFINEMENT: Ensure the shelf actually says "Shorts" or similar
                        val hasShortsText = shelf.findAccessibilityNodeInfosByText("Shorts").isNotEmpty() 
                            || shelf.findAccessibilityNodeInfosByText("Short videos").isNotEmpty()
                        
                        if (hasShortsText) {
                            val menuBtn = findMenuButtonInside(shelf)
                            if (menuBtn != null) {
                                openMenuAndDismissIfShort(menuBtn, YT_FEWER_SHORTS_TEXT, "YT Shorts Shelf")
                                shelves.forEach { safeRecycle(it) }
                                return
                            }
                        }
                    }
                    safeRecycle(shelf)
                }
            }
        }
    }

    private fun openMenuAndDismissIfShort(menuNode: AccessibilityNodeInfo, dismissTexts: List<String>, logLabel: String) {
        menuNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        safeRecycle(menuNode)
        handler.postDelayed({
            val r = rootInActiveWindow ?: return@postDelayed
            val count = countMenuItems(r)
            if (count > 0 && count <= SHORT_MENU_MAX_ITEMS) {
                for (text in dismissTexts) {
                    val nodes = r.findAccessibilityNodeInfosByText(text)
                    if (nodes.isNotEmpty()) {
                        val target = nodes.first { it.isVisibleToUser }
                        val clk = if (target.isClickable) target else findClickableParent(target)
                        clk?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        nodes.forEach { safeRecycle(it) }
                        break
                    }
                }
            } else if (count > SHORT_MENU_MAX_ITEMS) {
                performGlobalAction(GLOBAL_ACTION_BACK)
            }
            safeRecycle(r)
        }, MENU_READ_DELAY_MS)
    }

    private fun countMenuItems(root: AccessibilityNodeInfo): Int {
        var count = 0
        val stack = mutableListOf(root)
        while (stack.isNotEmpty()) {
            val node = stack.removeAt(0)
            val className = node.className?.toString() ?: ""
            if (node.isClickable && node.isVisibleToUser && !className.contains("Layout") && !className.contains("RecyclerView") && !node.text.isNullOrEmpty()) {
                count++
            }
            for (i in 0 until node.childCount) {
                val child = node.getChild(i) ?: continue
                stack.add(child)
            }
        }
        return count
    }

    private fun isShortsPlayerVisible(root: AccessibilityNodeInfo): Boolean {
        val r = Rect(); root.getBoundsInScreen(r)
        val h = r.height()
        for (id in YT_SHORTS_PLAYER_IDS) {
            val nodes = root.findAccessibilityNodeInfosByViewId(id)
            if (nodes.isNotEmpty()) {
                val full = nodes.any { Rect().apply { it.getBoundsInScreen(this) }.height() > (h * 0.65) }
                nodes.forEach { safeRecycle(it) }
                if (full) return true
            }
        }
        return false
    }

    private fun findMenuButtonInside(container: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val stack = mutableListOf(container)
        while (stack.isNotEmpty()) {
            val node = stack.removeAt(0)
            val desc = node.contentDescription?.toString()?.lowercase() ?: ""
            if (node.isClickable && node.isVisibleToUser && (MENU_BUTTON_KEYWORDS.any { desc.contains(it) } || node.viewIdResourceName?.contains("menu") == true)) return node
            for (i in 0 until node.childCount) stack.add(node.getChild(i) ?: continue)
        }
        return null
    }

    private fun findClickableParent(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        var n = node
        while (n != null) { if (n.isClickable) return n; n = n.parent }
        return null
    }

    private fun safeRecycle(node: AccessibilityNodeInfo?) { try { node?.recycle() } catch (e: Exception) {} }

    private fun handleFacebook(root: AccessibilityNodeInfo) { /* Logic similar to YT */ }
    private fun handleInstagram(root: AccessibilityNodeInfo) { /* Logic similar to YT */ }
    private fun handleTiktok(root: AccessibilityNodeInfo) { performGlobalAction(GLOBAL_ACTION_HOME) }
    private fun handleBrowser(root: AccessibilityNodeInfo) { /* Logic for blocking URLs */ }

    private fun isDetoxActive(): Boolean = prefs.getLong(PREF_DETOX_END_TIME, 0L) > System.currentTimeMillis()
    private fun isSuddenBlockActive(): Boolean = prefs.getLong(PREF_SUDDEN_BLOCK, 0L) > System.currentTimeMillis()
    private fun getBlockList() = prefs.getString(PREF_BLOCKED_APPS, "")?.split(",") ?: emptyList()
    private fun getBlockedList() = getBlockList()
    private fun isInBedtimeWindow(): Boolean {
        val cal = Calendar.getInstance()
        val h = cal.get(Calendar.HOUR_OF_DAY)
        val m = cal.get(Calendar.MINUTE)
        val startH = prefs.getInt(PREF_BEDTIME_START_H, 22)
        val startM = prefs.getInt(PREF_BEDTIME_START_M, 0)
        val endH = prefs.getInt(PREF_BEDTIME_END_H, 7)
        val endM = prefs.getInt(PREF_BEDTIME_END_M, 0)
        val nowM = h * 60 + m
        val startMin = startH * 60 + startM
        val endMin = endH * 60 + endM
        return if (startMin < endMin) (nowM in startMin..endMin) else (nowM >= startMin || nowM <= endMin)
    }
}
