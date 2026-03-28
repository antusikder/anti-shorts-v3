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

/**
 * AntiShortsService — Fresh Mind v3.0
 *
 * Core Architecture:
 * - Runs as an Android AccessibilityService
 * - Reads SharedPreferences fresh on every event (zero-latency config sync)
 * - Smart throttling: skips cycles faster than configured scan interval
 * - Only processes specific app packages (YouTube, Facebook, Instagram, TikTok, Browsers)
 * - Menu-item discriminator: opens 3-dot menu; if ≤3 items = Shorts/Reels → dismiss
 *   if >3 items = general video → close menu untouched (CRITICAL safeguard)
 * - Ad skipping: tries view-ID click first (instant), then text-based fallback
 * - 0.4s debounce on BACK presses to prevent double-fires that confuse user experience
 * - Battery-safe: TYPE_WINDOW_CONTENT_CHANGED only for YouTube; STATE_CHANGED for others
 */
class AntiShortsService : AccessibilityService() {

    companion object {
        private const val TAG = "FreshMindService"
        const val PREFS_NAME = "antishorts_prefs"

        // Core feature toggles
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
        const val PREF_FEED_MODE        = "feed_mode"   // "off"|"knowledge"|"study"|"productive"
        const val PREF_YT_SUBS_ONLY     = "yt_subs_only"

        // Block / strict mode
        const val PREF_BLOCK_ACTIVE     = "block_active"
        const val PREF_BLOCKED_APPS     = "blocked_apps"

        // Bedtime
        const val PREF_BEDTIME_ENABLED  = "bedtime_enabled"
        const val PREF_BEDTIME_START_H  = "bedtime_start_hour"
        const val PREF_BEDTIME_START_M  = "bedtime_start_min"
        const val PREF_BEDTIME_END_H    = "bedtime_end_hour"
        const val PREF_BEDTIME_END_M    = "bedtime_end_min"

        const val PKG_YOUTUBE          = "com.google.android.youtube"
        const val PKG_FACEBOOK         = "com.facebook.katana"
        const val PKG_INSTAGRAM        = "com.instagram.android"
        const val PKG_TIKTOK           = "com.zhiliaoapp.musically"

        val BROWSER_PACKAGES = setOf(
            "com.android.chrome",
            "com.brave.browser",
            "org.mozilla.firefox",
            "com.opera.browser",
            "com.microsoft.emmx",
            "com.sec.android.app.sbrowser",
            "com.kiwibrowser.browser",
            "com.duckduckgo.mobile.android"
        )

        const val DEFAULT_SCAN_INTERVAL = 150L

        // After opening a 3-dot menu, wait this long before reading its items
        const val MENU_READ_DELAY_MS    = 300L
        const val RETRY_DELAY_MS        = 80L

        // YouTube Shorts player container view IDs (covers multiple YT versions)
        val YT_SHORTS_PLAYER_IDS = listOf(
            "com.google.android.youtube:id/reel_player_view_container",
            "com.google.android.youtube:id/shorts_container",
            "com.google.android.youtube:id/reel_watch_player",
            "com.google.android.youtube:id/shorts_player_container",
            "com.google.android.youtube:id/shorts_slide_layout",
            "com.google.android.youtube:id/reels_player_overlay",
            "com.google.android.youtube:id/shorts_video_cell"
        )

        // YouTube Shorts shelf header text variants (works globally)
        val YT_SHORTS_SHELF_TEXT = listOf(
            "Shorts",
            "YouTube Shorts",
            "Short videos"
        )

        // View IDs for Shorts shelf and items (consistent across versions)
        val YT_SHORTS_SHELF_IDS = listOf(
            "com.google.android.youtube:id/shorts_shelf_container",
            "com.google.android.youtube:id/reel_shelf_container",
            "com.google.android.youtube:id/items_container"
        )

        // Text shown ONLY in Shorts shelf 3-dot menu (1-2 items). NOT in general video menus.
        val YT_FEWER_SHORTS_TEXT = listOf(
            "Don't recommend Shorts",
            "Fewer Shorts",
            "Show fewer Shorts",
            "Hide Shorts Shelf",
            "Not interested in Shorts",
            "Stop recommending Shorts",
            "Not interested"
        )

        val FB_REELS_TEXT = listOf(
            "Reel by", "Reels", "Reel •", "Watch Reel", "Reel ·",
            "Suggested Reels", "Featured Reels"
        )

        val IG_REELS_TEXT = listOf("Reels", "Reel")

        val FB_FEWER_REELS_TEXT = listOf(
            "Hide Reel", "Hide Reels", "Show less",
            "Not interested", "Show fewer Reels",
            "See fewer Reels", "Don't show Reels",
            "Not interested in Reels", "Snooze"
        )

        // YouTube ad skip: try view ID first, then these text fallbacks
        val YT_SKIP_AD_IDS = listOf(
            "com.google.android.youtube:id/skip_ad_button",
            "com.google.android.youtube:id/skip_button",
            "com.google.android.youtube:id/skip_ad_button_text"
        )
        val YT_SKIP_AD_TEXTS = listOf(
            "Skip ad", "Skip ads", "Skip Ad", "Skip Ads",
            "Skip", "SKIP AD", "SKIP ADS"
        )

        // Post-ad floating overlay dismiss
        val AD_CENTER_TEXTS = listOf("Ad ·", "Ad •", "Sponsored", "About this ad", "Ad Center")
        val AD_DISMISS_TEXTS = listOf(
            "Dismiss", "Hide ad", "Stop seeing this ad",
            "Not interested", "Report ad", "Close"
        )

        val STICKY_AD_IDS = listOf(
            "com.google.android.youtube:id/close_button",
            "com.google.android.youtube:id/dismiss_button",
            "com.google.android.youtube:id/skip_ad_button_compact",
            "com.google.android.youtube:id/ad_close_button"
        )

        val MENU_BUTTON_KEYWORDS = setOf("more", "option", "menu", "overflow")

        // KEY discriminator: Shorts/Reels menus have ≤ this many clickable items
        // General video menus have 5-8 options (Download, Save, Share, Report…)
        const val SHORT_MENU_MAX_ITEMS  = 3

        // Feed mode: minimum gap between feed-nudge actions (30 seconds)
        const val FEED_NUDGE_MIN_GAP_MS = 30_000L
    }

    private val handler = Handler(Looper.getMainLooper())
    private var lastCheckTime = 0L
    private var currentPkg = ""
    private lateinit var prefs: SharedPreferences

    // Debounce BACK presses (400ms as user requested)
    private var lastBackPressTime = 0L

    // Feed mode nudge throttle
    private var lastFeedNudgeTime = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        Log.d(TAG, "FreshMind v3.0 connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        try {
            event ?: return
            val pkg = event.packageName?.toString() ?: return

            val now = System.currentTimeMillis()
            val interval = prefs.getLong(PREF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)
            if (now - lastCheckTime < interval) return
            lastCheckTime = now

            val eventType = event.eventType

            // Battery optimization: for non-YouTube apps, only react to window state changes
            if (pkg != PKG_YOUTUBE && eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) return
            if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
                eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) return

            currentPkg = pkg

            // ── Master Switch ──────────────────────────────────────────────
            if (!prefs.getBoolean(PREF_SYSTEM_ENABLED, true)) return

            // ── Block mode (Strict/Session) ────────────────────────────────
            val blockActive = prefs.getBoolean(PREF_BLOCK_ACTIVE, false)
            if (blockActive) {
                val blockedList = getBlockedList()
                if (blockedList.contains(pkg)) {
                    Log.d(TAG, "Block mode: closing $pkg")
                    performGlobalAction(GLOBAL_ACTION_HOME)
                    return
                }
            }

            // ── Bedtime mode ───────────────────────────────────────────────
            if (prefs.getBoolean(PREF_BEDTIME_ENABLED, false) && isInBedtimeWindow()) {
                val blockedList = getBlockedList()
                if (blockedList.contains(pkg)) {
                    Log.d(TAG, "Bedtime: closing $pkg")
                    performGlobalAction(GLOBAL_ACTION_HOME)
                    return
                }
            }

            // ── Browser Protection ─────────────────────────────────────────
            if (BROWSER_PACKAGES.contains(pkg)) {
                val root = rootInActiveWindow ?: return
                try { handleBrowser(root) } catch (e: Exception) {
                    Log.e(TAG, "Browser error: ${e.message}")
                } finally { safeRecycle(root) }
                return
            }

            // ── Native app routing ─────────────────────────────────────────
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
            } catch (e: Exception) {
                Log.e(TAG, "Event processing error ($pkg): ${e.message}")
            } finally {
                safeRecycle(root)
            }
        } catch (e: Exception) {
            Log.e(TAG, "onAccessibilityEvent crash: ${e.message}")
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // YOUTUBE
    // ═══════════════════════════════════════════════════════════════════════

    private fun handleYoutube(root: AccessibilityNodeInfo) {
        if (!prefs.getBoolean(PREF_YT_ENABLED, true)) return

        // Priority 1: Skip active video ad (view-ID first, then text)
        if (prefs.getBoolean(PREF_SKIP_ADS, true)) {
            if (skipAdByViewId(root)) return
            if (skipAdByText(root)) return
        }

        // Priority 2: Exit Shorts player immediately (400ms debounce)
        if (prefs.getBoolean(PREF_YT_AUTO_BACK, true) && isShortsPlayerVisible(root)) {
            val now = System.currentTimeMillis()
            if (now - lastBackPressTime > 400L) {
                Log.d(TAG, "YT Shorts player detected — pressing BACK")
                lastBackPressTime = now
                performGlobalAction(GLOBAL_ACTION_BACK)
                // Safety retry after 500ms if still showing
                handler.postDelayed({
                    val retry = rootInActiveWindow
                    if (retry != null && isShortsPlayerVisible(retry)) {
                        Log.d(TAG, "YT Shorts still showing — retry BACK")
                        performGlobalAction(GLOBAL_ACTION_BACK)
                    }
                    safeRecycle(retry)
                }, 500L)
            }
            return // Don't process feed ops when in Shorts player
        }

        // Priority 3: Dismiss post-ad floating overlay link or sticky banner
        if (prefs.getBoolean(PREF_SKIP_ADS, true)) {
            dismissAdOverlay(root)
            dismissStickyAd(root)
        }

        // Priority 4: Remove Shorts shelf from feed
        if (prefs.getBoolean(PREF_YT_SHORTS, true)) {
            handleYtShortsInFeed(root)
        }

        // Priority 5: Subscribed Only Nudge
        if (prefs.getBoolean(PREF_YT_SUBS_ONLY, false)) {
            handleYtSubsOnly(root)
        }

        // Priority 6: Algorithmic Nudge (Like long-form content)
        val feedMode = prefs.getString(PREF_FEED_MODE, "off")
        if (feedMode != "off") {
            handleAlgorithmicNudge(root)
        }
    }

    /** Try clicking skip button by view resource ID (instant — no text search needed) */
    private fun skipAdByViewId(root: AccessibilityNodeInfo): Boolean {
        for (id in YT_SKIP_AD_IDS) {
            val nodes = root.findAccessibilityNodeInfosByViewId(id)
            if (nodes.isNotEmpty()) {
                val target = nodes.firstOrNull { it.isVisibleToUser && it.isEnabled }
                if (target != null) {
                    val clickable = if (target.isClickable) target else findClickableParent(target)
                    if (clickable != null) {
                        clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        Log.d(TAG, "Ad skipped via view ID: $id")
                        nodes.forEach { safeRecycle(it) }
                        return true
                    }
                }
                nodes.forEach { safeRecycle(it) }
            }
        }
        return false
    }

    /** Fallback: find skip button by text */
    private fun skipAdByText(root: AccessibilityNodeInfo): Boolean {
        for (text in YT_SKIP_AD_TEXTS) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes.isNotEmpty()) {
                val target = nodes.firstOrNull { it.isVisibleToUser }
                if (target != null) {
                    val clickable = if (target.isClickable) target else findClickableParent(target)
                    if (clickable != null) {
                        clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        Log.d(TAG, "Ad skipped via text: '$text'")
                        nodes.forEach { safeRecycle(it) }
                        return true
                    }
                }
                nodes.forEach { safeRecycle(it) }
            }
        }
        return false
    }

    /** After ad plays, a floating info link may appear — dismiss it */
    private fun dismissAdOverlay(root: AccessibilityNodeInfo) {
        for (text in AD_CENTER_TEXTS) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes.isNotEmpty()) {
                for (node in nodes) {
                    if (node.isVisibleToUser) {
                        val menuBtn = findMenuButtonNear(node)
                        if (menuBtn != null) {
                            openMenuAndDismissIfShort(menuBtn, AD_DISMISS_TEXTS, "Ad overlay")
                            nodes.forEach { safeRecycle(it) }
                            return
                        }
                    }
                    safeRecycle(node)
                }
            }
        }
    }

    /** Dismiss "sticky" ad banners that remain after skip */
    private fun dismissStickyAd(root: AccessibilityNodeInfo) {
        for (id in STICKY_AD_IDS) {
            val nodes = root.findAccessibilityNodeInfosByViewId(id)
            if (nodes.isNotEmpty()) {
                val target = nodes.firstOrNull { it.isVisibleToUser && it.isEnabled }
                if (target != null) {
                    val clickable = if (target.isClickable) target else findClickableParent(target)
                    if (clickable != null) {
                        clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                        Log.d(TAG, "Sticky ad dismissed via view ID: $id")
                        nodes.forEach { safeRecycle(it) }
                        return
                    }
                }
                nodes.forEach { safeRecycle(it) }
            }
        }
    }

    private fun isShortsPlayerVisible(root: AccessibilityNodeInfo): Boolean {
        val screenRect = Rect()
        root.getBoundsInScreen(screenRect)
        val screenHeight = screenRect.height()
        if (screenHeight <= 0) return false

        for (id in YT_SHORTS_PLAYER_IDS) {
            val nodes = root.findAccessibilityNodeInfosByViewId(id)
            if (nodes.isNotEmpty()) {
                val isFull = nodes.any {
                    val r = Rect(); it.getBoundsInScreen(r)
                    it.isVisibleToUser && r.height() > (screenHeight * 0.65)
                }
                nodes.forEach { safeRecycle(it) }
                if (isFull) return true
            }
        }
        return false
    }

    private fun handleYtShortsInFeed(root: AccessibilityNodeInfo) {
        // Try by View IDs first (more accurate)
        for (id in YT_SHORTS_SHELF_IDS) {
            val shelves = root.findAccessibilityNodeInfosByViewId(id)
            if (shelves.isNotEmpty()) {
                for (shelf in shelves) {
                    if (shelf.isVisibleToUser) {
                        // Find child menu button within the shelf
                        val menuBtn = findMenuButtonInside(shelf)
                        if (menuBtn != null) {
                            openMenuAndDismissIfShort(menuBtn, YT_FEWER_SHORTS_TEXT, "YT Shorts Shelf (ID)")
                            shelves.forEach { safeRecycle(it) }
                            return
                        }
                    }
                    safeRecycle(shelf)
                }
            }
        }

        // Fallback to text search
        for (text in YT_SHORTS_SHELF_TEXT) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes.isNotEmpty()) {
                for (node in nodes) {
                    if (node.isVisibleToUser) {
                        val menuBtn = findMenuButtonNear(node)
                        if (menuBtn != null) {
                            openMenuAndDismissIfShort(menuBtn, YT_FEWER_SHORTS_TEXT, "YT Shorts Shelf (Text)")
                            nodes.forEach { safeRecycle(it) }
                            return
                        }
                    }
                    safeRecycle(node)
                }
            }
        }
    }

    private fun handleYtSubsOnly(root: AccessibilityNodeInfo) {
        // Look for the Home tab indicator. If we are on Home, nudge to Subscriptions.
        // YouTube Tab IDs: com.google.android.youtube:id/tab_home, com.google.android.youtube:id/tab_subscriptions
        val homeTab = root.findAccessibilityNodeInfosByViewId("com.google.android.youtube:id/tab_home").firstOrNull()
        if (homeTab != null && homeTab.isSelected) {
            val subsTab = root.findAccessibilityNodeInfosByViewId("com.google.android.youtube:id/tab_subscriptions").firstOrNull()
            if (subsTab != null && subsTab.isVisibleToUser) {
                Log.d(TAG, "Subs Only mode: Nudging to Subscriptions tab")
                subsTab.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            safeRecycle(subsTab)
        }
        safeRecycle(homeTab)
    }

    private fun handleAlgorithmicNudge(root: AccessibilityNodeInfo) {
        val now = System.currentTimeMillis()
        if (now - lastFeedNudgeTime < FEED_NUDGE_MIN_GAP_MS) return

        // 1. Differentiate: if we are in a video player (not shorts)
        // Video player often has "com.google.android.youtube:id/player_view"
        val player = root.findAccessibilityNodeInfosByViewId("com.google.android.youtube:id/player_view").firstOrNull()
        if (player != null && player.isVisibleToUser) {
            // Check if it's NOT a short (we already back-out from shorts player)
            // Look for "Like" button in the player controls
            val likeBtn = root.findAccessibilityNodeInfosByViewId("com.google.android.youtube:id/like_button").firstOrNull()
            if (likeBtn != null && likeBtn.isVisibleToUser && !likeBtn.isSelected) {
                Log.d(TAG, "Algorithm Nudge: Liking long-form content")
                likeBtn.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                lastFeedNudgeTime = now
            }
            safeRecycle(likeBtn)
        }
        safeRecycle(player)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FACEBOOK
    // ═══════════════════════════════════════════════════════════════════════

    private fun handleFacebook(root: AccessibilityNodeInfo) {
        if (!prefs.getBoolean(PREF_FB_ENABLED, true)) return

        // Auto-back from Reels player
        if (prefs.getBoolean(PREF_FB_AUTO_BACK, false)) {
            val now = System.currentTimeMillis()
            if (now - lastBackPressTime > 400L) {
                for (text in FB_REELS_TEXT) {
                    val nodes = root.findAccessibilityNodeInfosByText(text)
                    if (nodes.isNotEmpty()) {
                        val visible = nodes.any { it.isVisibleToUser }
                        nodes.forEach { safeRecycle(it) }
                        if (visible) {
                            Log.d(TAG, "FB Reel auto-back triggered")
                            lastBackPressTime = now
                            performGlobalAction(GLOBAL_ACTION_BACK)
                            return
                        }
                    }
                }
            }
        }

        // Remove Reels shelf from feed
        if (prefs.getBoolean(PREF_FB_REELS, true)) {
            handleFbReelsInFeed(root)
        }
    }

    private fun handleFbReelsInFeed(root: AccessibilityNodeInfo) {
        for (text in FB_REELS_TEXT) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes.isNotEmpty()) {
                for (node in nodes) {
                    val menuBtn = findMenuButtonNear(node)
                    if (menuBtn != null) {
                        openMenuAndDismissIfShort(menuBtn, FB_FEWER_REELS_TEXT, "FB Reels shelf")
                        nodes.forEach { safeRecycle(it) }
                        return
                    }
                    safeRecycle(node)
                }
                break
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INSTAGRAM & TIKTOK
    // ═══════════════════════════════════════════════════════════════════════

    private fun handleInstagram(root: AccessibilityNodeInfo) {
        if (!prefs.getBoolean(PREF_IG_ENABLED, true)) return
        val now = System.currentTimeMillis()
        if (now - lastBackPressTime < 400L) return

        for (text in IG_REELS_TEXT) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes.isNotEmpty()) {
                val visible = nodes.any { it.isVisibleToUser }
                nodes.forEach { safeRecycle(it) }
                if (visible) {
                    Log.d(TAG, "IG Reels detected — BACK")
                    lastBackPressTime = now
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    return
                }
            }
        }
    }

    private fun handleTiktok(root: AccessibilityNodeInfo) {
        if (!prefs.getBoolean(PREF_TT_ENABLED, true)) return
        val now = System.currentTimeMillis()
        if (now - lastBackPressTime > 400L) {
            Log.d(TAG, "TikTok — sending HOME")
            lastBackPressTime = now
            performGlobalAction(GLOBAL_ACTION_HOME)
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CORE: 3-dot menu open → count items → dismiss only if Shorts/Reels
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Opens the 3-dot menu near a Shorts/Reels label, waits for it to animate in,
     * counts visible menu items, and:
     *   ≤ SHORT_MENU_MAX_ITEMS (3) → clicks the dismiss option  (it's a Short/Reel menu)
     *   > SHORT_MENU_MAX_ITEMS    → fires BACK without clicking  (it's a general video menu)
     *
     * This is the CRITICAL safeguard that prevents touching general video cards.
     */
    private fun openMenuAndDismissIfShort(
        menuNode: AccessibilityNodeInfo,
        dismissTexts: List<String>,
        logLabel: String
    ) {
        menuNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        safeRecycle(menuNode)
        attemptMenuDismiss(dismissTexts, logLabel, 0)
    }

    private fun attemptMenuDismiss(dismissTexts: List<String>, logLabel: String, attempt: Int) {
        handler.postDelayed({
            try {
                val root = rootInActiveWindow ?: return@postDelayed

                val menuItemCount = countMenuItems(root)

                if (menuItemCount == 0 && attempt < 3) {
                    safeRecycle(root)
                    attemptMenuDismiss(dismissTexts, logLabel, attempt + 1)
                    return@postDelayed
                }

                Log.d(TAG, "$logLabel menu items: $menuItemCount (attempt $attempt)")

                if (menuItemCount > SHORT_MENU_MAX_ITEMS) {
                    // General video menu — close it immediately without clicking anything
                    Log.d(TAG, "$logLabel is general video ($menuItemCount items) — BACK")
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    safeRecycle(root)
                    return@postDelayed
                }

                if (menuItemCount == 0) {
                    safeRecycle(root)
                    return@postDelayed
                }

                // Short/Reel menu → find dismiss option
                var clicked = false
                for (text in dismissTexts) {
                    val nodes = root.findAccessibilityNodeInfosByText(text)
                    if (nodes.isNotEmpty()) {
                        val target = nodes.firstOrNull {
                            val t = it.text?.toString()?.lowercase(Locale.ROOT) ?: ""
                            val d = it.contentDescription?.toString()?.lowercase(Locale.ROOT) ?: ""
                            t.contains(text.lowercase(Locale.ROOT)) || d.contains(text.lowercase(Locale.ROOT))
                        } ?: nodes.first()

                        val clickable = if (target.isClickable) target else findClickableParent(target)
                        if (clickable != null) {
                            clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                            clicked = true
                            Log.d(TAG, "$logLabel dismissed via: '$text'")
                        }
                        nodes.forEach { safeRecycle(it) }
                        if (clicked) break
                    }
                }

                if (!clicked) {
                    Log.d(TAG, "$logLabel dismiss text not found — BACK to close menu")
                    performGlobalAction(GLOBAL_ACTION_BACK)
                }

                safeRecycle(root)
            } catch (e: Exception) {
                Log.e(TAG, "Menu dismiss error: ${e.message}")
            }
        }, if (attempt == 0) MENU_READ_DELAY_MS else RETRY_DELAY_MS)
    }

    private fun countMenuItems(root: AccessibilityNodeInfo): Int {
        var count = 0
        countMenuItemsRecursive(root, 0) { count++ }
        return count
    }

    private fun countMenuItemsRecursive(node: AccessibilityNodeInfo, depth: Int, onItem: () -> Unit) {
        if (depth > 12) return
        val className = node.className?.toString() ?: ""
        if (node.isClickable && node.isVisibleToUser &&
            !className.contains("Layout") &&
            !className.contains("RecyclerView") &&
            !className.contains("ScrollView") &&
            !className.contains("ListView")
        ) {
            val hasContent = !node.text.isNullOrEmpty() || !node.contentDescription.isNullOrEmpty()
            if (hasContent) {
                onItem()
            }
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            countMenuItemsRecursive(child, depth + 1, onItem)
            safeRecycle(child)
        }
    }

    private fun findMenuButtonInside(container: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val stack = mutableListOf(container)
        while (stack.isNotEmpty()) {
            val node = stack.removeAt(stack.size - 1)
            val desc = node.contentDescription?.toString()?.lowercase() ?: ""
            if (node.isClickable && node.isVisibleToUser &&
                (MENU_BUTTON_KEYWORDS.any { desc.contains(it) } || node.viewIdResourceName?.contains("menu") == true)) {
                return node
            }
            for (i in 0 until node.childCount) {
                val child = node.getChild(i) ?: continue
                stack.add(child)
            }
        }
        return null
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BROWSER PROTECTION
    // ═══════════════════════════════════════════════════════════════════════

    private fun handleBrowser(root: AccessibilityNodeInfo) {
        val ytEnabled = prefs.getBoolean(PREF_YT_ENABLED, true)
        val fbEnabled = prefs.getBoolean(PREF_FB_ENABLED, true)
        val igEnabled = prefs.getBoolean(PREF_IG_ENABLED, true)
        val ttEnabled = prefs.getBoolean(PREF_TT_ENABLED, true)

        if (!ytEnabled && !fbEnabled && !igEnabled && !ttEnabled) return

        val now = System.currentTimeMillis()
        if (now - lastBackPressTime < 1000L) return

        // 1. Check for specific text keywords in the page content (fallback)
        val targets = buildList {
            if (ytEnabled) { add("youtube.com/shorts"); add("youtu.be/shorts") }
            if (fbEnabled) { add("facebook.com/reel"); add("fb.watch") }
            if (igEnabled) { add("instagram.com/reel"); add("instagram.com/reels") }
            if (ttEnabled) { add("tiktok.com") }
        }

        for (target in targets) {
            val nodes = root.findAccessibilityNodeInfosByText(target)
            if (nodes.isNotEmpty()) {
                val visible = nodes.any { it.isVisibleToUser }
                nodes.forEach { safeRecycle(it) }
                if (visible) {
                    Log.d(TAG, "Browser content block: $target")
                    lastBackPressTime = now
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    return
                }
            }
        }

        // 2. Check the URL bar specifically (much more reliable)
        // Chrome URL bar ID is often "com.android.chrome:id/url_bar"
        val urlNodes = root.findAccessibilityNodeInfosByViewId("${currentPkg}:id/url_bar")
            .ifEmpty { root.findAccessibilityNodeInfosByViewId("${currentPkg}:id/url_edit_text") }
            .ifEmpty { root.findAccessibilityNodeInfosByViewId("${currentPkg}:id/location_bar") }

        if (urlNodes.isNotEmpty()) {
            for (node in urlNodes) {
                val urlTxt = node.text?.toString()?.lowercase() ?: ""
                if (targets.any { urlTxt.contains(it) }) {
                    Log.d(TAG, "Browser URL block: $urlTxt")
                    lastBackPressTime = now
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    urlNodes.forEach { safeRecycle(it) }
                    return
                }
                safeRecycle(node)
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    private fun findMenuButtonNear(nearNode: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var parent: AccessibilityNodeInfo? = nearNode.parent
        var depth = 0
        while (parent != null && depth < 6) {
            val parentDesc = parent.contentDescription?.toString()?.lowercase() ?: ""
            if (parent.isClickable && parent.isVisibleToUser &&
                MENU_BUTTON_KEYWORDS.any { parentDesc.contains(it) }) {
                return parent
            }

            for (i in 0 until parent.childCount) {
                val child = parent.getChild(i) ?: continue
                val childDesc = child.contentDescription?.toString()?.lowercase() ?: ""
                if (child.isClickable && child.isVisibleToUser &&
                    MENU_BUTTON_KEYWORDS.any { childDesc.contains(it) }) {
                    return child
                }
                safeRecycle(child)
            }

            val className = parent.className?.toString() ?: ""
            if (className.contains("RecyclerView") || className.contains("ListView")) break

            val next = parent.parent
            safeRecycle(parent)
            parent = next
            depth++
        }
        safeRecycle(parent)
        return null
    }

    private fun findClickableParent(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var current: AccessibilityNodeInfo? = node.parent
        var depth = 0
        while (current != null && depth < 5) {
            if (current.isClickable) return current
            val next = current.parent
            safeRecycle(current)
            current = next
            depth++
        }
        safeRecycle(current)
        return null
    }

    private fun isInBedtimeWindow(): Boolean {
        val startH = prefs.getInt(PREF_BEDTIME_START_H, 22)
        val startM = prefs.getInt(PREF_BEDTIME_START_M, 0)
        val endH   = prefs.getInt(PREF_BEDTIME_END_H, 7)
        val endM   = prefs.getInt(PREF_BEDTIME_END_M, 0)
        val cal = Calendar.getInstance()
        val nowMins   = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        val startMins = startH * 60 + startM
        val endMins   = endH * 60 + endM
        return if (startMins > endMins) nowMins >= startMins || nowMins < endMins
               else nowMins in startMins until endMins
    }

    private fun getBlockedList(): Set<String> {
        val raw = prefs.getString(PREF_BLOCKED_APPS, "") ?: ""
        return raw.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()
    }

    private fun safeRecycle(node: AccessibilityNodeInfo?) {
        try { node?.recycle() } catch (_: Exception) {}
    }

    override fun onInterrupt() {
        Log.d(TAG, "FreshMind service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
        Log.d(TAG, "FreshMind service destroyed")
    }
}
