package com.antishorts.shield

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.util.Calendar

/**
 * ProductiveService (formerly AntiShortsService)
 *
 * Architecture:
 * - Monitors YouTube and Facebook for Shorts/Reels (configurable)
 * - Differentiates Shorts from general videos by menu item count
 *   (Shorts three-dot menu has exactly 1 item; general videos have 3+)
 * - Reads SharedPreferences fresh on every event — settings always current
 * - Blocks configured apps during active schedule sessions or bedtime
 * - Smart throttling: only wakes on relevant window events
 */
class AntiShortsService : AccessibilityService() {

    companion object {
        private const val TAG = "ProductiveService"
        const val PREFS_NAME = "antishorts_prefs"

        // Core feature toggles
        const val PREF_YT_ENABLED       = "yt_enabled"
        const val PREF_YT_SHORTS        = "yt_remove_shorts"
        const val PREF_YT_AUTO_BACK     = "yt_auto_back"
        const val PREF_FB_ENABLED       = "fb_enabled"
        const val PREF_FB_REELS         = "fb_remove_reels"
        const val PREF_FB_AUTO_BACK     = "fb_auto_back"
        const val PREF_SCAN_INTERVAL    = "scan_interval_ms"

        // Block / strict mode
        const val PREF_BLOCK_ACTIVE     = "block_active"
        const val PREF_BLOCKED_APPS     = "blocked_apps"  // comma-separated pkg names

        // Bedtime
        const val PREF_BEDTIME_ENABLED  = "bedtime_enabled"
        const val PREF_BEDTIME_START_H  = "bedtime_start_hour"
        const val PREF_BEDTIME_START_M  = "bedtime_start_min"
        const val PREF_BEDTIME_END_H    = "bedtime_end_hour"
        const val PREF_BEDTIME_END_M    = "bedtime_end_min"

        // Target packages
        const val PKG_YOUTUBE          = "com.google.android.youtube"
        const val PKG_FACEBOOK         = "com.facebook.katana"

        // Default scan interval (balanced mode)
        const val DEFAULT_SCAN_INTERVAL = 150L

        // Delay after opening 3-dot menu before reading items
        const val MENU_READ_DELAY_MS    = 280L
        const val RETRY_DELAY_MS        = 60L

        // YouTube Shorts player container view IDs
        val YT_SHORTS_PLAYER_IDS = listOf(
            "com.google.android.youtube:id/reel_player_view_container",
            "com.google.android.youtube:id/shorts_container",
            "com.google.android.youtube:id/reel_watch_player",
            "com.google.android.youtube:id/shorts_player_container",
            "com.google.android.youtube:id/shorts_slide_layout"
        )

        // YouTube Shorts shelf header text
        val YT_SHORTS_SHELF_TEXT = listOf("Shorts", "YouTube Shorts")

        // Text that appears ONLY in the Shorts shelf three-dot menu (single item)
        val YT_FEWER_SHORTS_TEXT = listOf(
            "Don't recommend Shorts from this channel",
            "Fewer Shorts",
            "Show fewer Shorts",
            "Not interested"
        )

        // Facebook Reels identifiers
        val FB_REELS_TEXT = listOf("Reel by", "Reels", "Reel •", "Watch Reel", "Reel ·")

        // Facebook Fewer Reels menu options (Reels three-dot has 1 main relevant option)
        val FB_FEWER_REELS_TEXT = listOf(
            "See fewer Reels",
            "Hide Reels",
            "Don't show Reels",
            "Not interested in Reels"
        )

        // Three-dot button descriptions
        val MENU_BUTTON_DESCS = listOf(
            "More options", "More", "Menu", "Options", "Overflow", "more_vert"
        )

        // Menu item threshold: Shorts/Reels menus have ≤ this many items
        // General video menus have MORE than this
        const val SHORT_MENU_MAX_ITEMS = 2
    }

    private val handler = Handler(Looper.getMainLooper())
    private var lastCheckTime = 0L
    private var currentPkg = ""
    private lateinit var prefs: SharedPreferences

    // Track menu-open attempts to avoid infinite retries
    private var menuOpenAttemptPkg = ""
    private var menuOpenAttemptTime = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        Log.d(TAG, "ProductiveService connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        val pkg = event.packageName?.toString() ?: return

        // Throttle — read prefs fresh for interval
        val now = System.currentTimeMillis()
        val interval = prefs.getLong(PREF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)
        if (now - lastCheckTime < interval) return
        lastCheckTime = now

        // Only care about window state / content changes
        val eventType = event.eventType
        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) return

        currentPkg = pkg

        // ── Block mode ──────────────────────────────────────────────────────
        val blockActive = prefs.getBoolean(PREF_BLOCK_ACTIVE, false)
        if (blockActive) {
            val blockedApps = prefs.getString(PREF_BLOCKED_APPS, "") ?: ""
            val blockedList = blockedApps.split(",").map { it.trim() }.filter { it.isNotEmpty() }
            if (blockedList.contains(pkg)) {
                Log.d(TAG, "Block mode: closing $pkg")
                performGlobalAction(GLOBAL_ACTION_HOME)
                return
            }
        }

        // ── Bedtime mode ────────────────────────────────────────────────────
        val bedtimeEnabled = prefs.getBoolean(PREF_BEDTIME_ENABLED, false)
        if (bedtimeEnabled && isInBedtimeWindow()) {
            val blockedApps = prefs.getString(PREF_BLOCKED_APPS, "") ?: ""
            val blockedList = blockedApps.split(",").map { it.trim() }.filter { it.isNotEmpty() }
            if (blockedList.contains(pkg)) {
                Log.d(TAG, "Bedtime mode: closing $pkg")
                performGlobalAction(GLOBAL_ACTION_HOME)
                return
            }
        }

        // Only process YT and FB for shorts/reels removal
        if (pkg != PKG_YOUTUBE && pkg != PKG_FACEBOOK) return

        val rootNode = rootInActiveWindow ?: return
        try {
            when (pkg) {
                PKG_YOUTUBE -> handleYoutube(rootNode)
                PKG_FACEBOOK -> handleFacebook(rootNode)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Event processing error: ${e.message}")
        } finally {
            try { rootNode.recycle() } catch (_: Exception) {}
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // BEDTIME HELPER
    // ════════════════════════════════════════════════════════════════════════

    private fun isInBedtimeWindow(): Boolean {
        val startH = prefs.getInt(PREF_BEDTIME_START_H, 22)
        val startM = prefs.getInt(PREF_BEDTIME_START_M, 0)
        val endH   = prefs.getInt(PREF_BEDTIME_END_H, 7)
        val endM   = prefs.getInt(PREF_BEDTIME_END_M, 0)

        val cal = Calendar.getInstance()
        val nowMins = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        val startMins = startH * 60 + startM
        val endMins   = endH * 60 + endM

        return if (startMins > endMins) {
            // Overnight window (e.g. 22:00 → 07:00)
            nowMins >= startMins || nowMins < endMins
        } else {
            nowMins in startMins until endMins
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // YOUTUBE
    // ════════════════════════════════════════════════════════════════════════

    private fun handleYoutube(root: AccessibilityNodeInfo) {
        if (!prefs.getBoolean(PREF_YT_ENABLED, true)) return

        // Priority 1: Auto-back from Shorts player
        if (prefs.getBoolean(PREF_YT_AUTO_BACK, true) && isShortsPlayerVisible(root)) {
            Log.d(TAG, "YT Shorts player — firing BACK")
            performGlobalAction(GLOBAL_ACTION_BACK)
            return
        }

        // Priority 2: Remove Shorts shelf from feed
        if (prefs.getBoolean(PREF_YT_SHORTS, true)) {
            handleYtShortsInFeed(root)
        }
    }

    private fun isShortsPlayerVisible(root: AccessibilityNodeInfo): Boolean {
        for (id in YT_SHORTS_PLAYER_IDS) {
            val nodes = root.findAccessibilityNodeInfosByViewId(id)
            if (nodes.isNotEmpty()) {
                val visible = nodes.any { it.isVisibleToUser }
                nodes.forEach { try { it.recycle() } catch (_: Exception) {} }
                if (visible) return true
            }
        }
        return false
    }

    private fun handleYtShortsInFeed(root: AccessibilityNodeInfo) {
        for (text in YT_SHORTS_SHELF_TEXT) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes.isNotEmpty()) {
                // Use the first valid node
                for (node in nodes) {
                    val menuBtn = findMenuButtonNear(root, node)
                    if (menuBtn != null) {
                        openMenuAndDismissIfShort(menuBtn, YT_FEWER_SHORTS_TEXT, "YT Shorts shelf")
                        nodes.forEach { try { it.recycle() } catch (_: Exception) {} }
                        return // Don't stack multiple menu opens
                    }
                    try { node.recycle() } catch (_: Exception) {}
                }
                break
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // FACEBOOK
    // ════════════════════════════════════════════════════════════════════════

    private fun handleFacebook(root: AccessibilityNodeInfo) {
        if (!prefs.getBoolean(PREF_FB_ENABLED, true)) return

        if (prefs.getBoolean(PREF_FB_REELS, true)) {
            handleFbReelsInFeed(root)
        }
    }

    private fun handleFbReelsInFeed(root: AccessibilityNodeInfo) {
        for (text in FB_REELS_TEXT) {
            val nodes = root.findAccessibilityNodeInfosByText(text)
            if (nodes.isNotEmpty()) {
                for (node in nodes) {
                    val menuBtn = findMenuButtonNear(root, node)
                    if (menuBtn != null) {
                        openMenuAndDismissIfShort(menuBtn, FB_FEWER_REELS_TEXT, "FB Reels shelf")
                        nodes.forEach { try { it.recycle() } catch (_: Exception) {} }
                        return
                    }
                    try { node.recycle() } catch (_: Exception) {}
                }
                break
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // CORE: Open menu → count items → dismiss only if Short/Reel
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Opens the three-dot menu, then after MENU_READ_DELAY_MS:
     *  • Counts visible menu items in the popup
     *  • If count ≤ SHORT_MENU_MAX_ITEMS → clicks the dismiss option (Shorts/Reels menu)
     *  • If count > SHORT_MENU_MAX_ITEMS → fires BACK to close the menu (general video, skip)
     *
     * This is the KEY discriminator: YouTube Shorts shelf three-dot has exactly 1 option.
     * General video cards have 4–8 options (Download, Save, Share, Report, …).
     */
    private fun openMenuAndDismissIfShort(
        menuNode: AccessibilityNodeInfo,
        dismissTexts: List<String>,
        logLabel: String
    ) {
        menuNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        try { menuNode.recycle() } catch (_: Exception) {}

        handler.postDelayed({
            try {
                val currentRoot = rootInActiveWindow ?: return@postDelayed

                // Count menu items visible in the bottom sheet / popup
                val menuItemCount = countMenuItems(currentRoot)
                Log.d(TAG, "$logLabel menu opened — item count: $menuItemCount")

                if (menuItemCount > SHORT_MENU_MAX_ITEMS) {
                    // This is a general video card menu — close it immediately
                    Log.d(TAG, "General video menu detected ($menuItemCount items) — pressing BACK")
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    try { currentRoot.recycle() } catch (_: Exception) {}
                    return@postDelayed
                }

                // This is a Short/Reel menu — find and click the dismiss option
                var clicked = false
                for (text in dismissTexts) {
                    val dismissNodes = currentRoot.findAccessibilityNodeInfosByText(text)
                    if (dismissNodes.isNotEmpty()) {
                        val target = dismissNodes.firstOrNull { it.isClickable }
                            ?: findClickableParent(dismissNodes.first())
                        if (target != null) {
                            target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                            clicked = true
                            Log.d(TAG, "$logLabel dismissed successfully")
                        }
                        dismissNodes.forEach { try { it.recycle() } catch (_: Exception) {} }
                        if (clicked) break
                    }
                }

                if (!clicked) {
                    // Can't find dismiss text — close menu gracefully
                    Log.d(TAG, "$logLabel dismiss text not found — closing menu")
                    performGlobalAction(GLOBAL_ACTION_BACK)
                }

                try { currentRoot.recycle() } catch (_: Exception) {}
            } catch (e: Exception) {
                Log.e(TAG, "Menu dismiss error: ${e.message}")
            }
        }, MENU_READ_DELAY_MS)
    }

    /**
     * Counts the number of clickable menu items currently visible in a popup/bottom-sheet.
     * Looks for list items, menu items, or clickable rows that are visible to the user.
     */
    private fun countMenuItems(root: AccessibilityNodeInfo): Int {
        var count = 0
        countMenuItemsRecursive(root, 0, { count++ })
        return count
    }

    private fun countMenuItemsRecursive(
        node: AccessibilityNodeInfo,
        depth: Int,
        onItem: () -> Unit
    ) {
        if (depth > 8) return
        val className = node.className?.toString() ?: ""
        // Count clickable leaf-ish nodes that look like menu items
        if (node.isClickable && node.isVisibleToUser &&
            !className.contains("Layout") &&
            !className.contains("RecyclerView") &&
            !className.contains("ScrollView") &&
            !className.contains("ListView")) {
            // Only count if it has text or description (real menu items do)
            val hasContent = !node.text.isNullOrEmpty() || !node.contentDescription.isNullOrEmpty()
            if (hasContent) onItem()
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            countMenuItemsRecursive(child, depth + 1, onItem)
            try { child.recycle() } catch (_: Exception) {}
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Finds the three-dot (overflow) menu button near a shorts/reels node.
     * Searches the whole tree by content description first, then walks parents.
     */
    private fun findMenuButtonNear(
        root: AccessibilityNodeInfo,
        nearNode: AccessibilityNodeInfo
    ): AccessibilityNodeInfo? {
        // Global search by content desc
        for (desc in MENU_BUTTON_DESCS) {
            val nodes = root.findAccessibilityNodeInfosByText(desc)
            if (nodes.isNotEmpty()) {
                val result = nodes.firstOrNull { it.isClickable && it.isVisibleToUser }
                nodes.forEach { if (it != result) try { it.recycle() } catch (_: Exception) {} }
                if (result != null) return result
            }
        }
        // Walk up the parent chain of nearNode looking for a sibling overflow button
        var parent: AccessibilityNodeInfo? = nearNode.parent
        var depth = 0
        while (parent != null && depth < 6) {
            val desc = parent.contentDescription?.toString()?.lowercase() ?: ""
            if (parent.isClickable && (desc.contains("more") || desc.contains("option") || desc.contains("menu"))) {
                return parent
            }
            val next = parent.parent
            try { parent.recycle() } catch (_: Exception) {}
            parent = next
            depth++
        }
        try { parent?.recycle() } catch (_: Exception) {}
        return null
    }

    private fun findClickableParent(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var current: AccessibilityNodeInfo? = node.parent
        var depth = 0
        while (current != null && depth < 5) {
            if (current.isClickable) return current
            val next = current.parent
            try { current.recycle() } catch (_: Exception) {}
            current = next
            depth++
        }
        try { current?.recycle() } catch (_: Exception) {}
        return null
    }

    override fun onInterrupt() {
        Log.d(TAG, "ProductiveService interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
        Log.d(TAG, "ProductiveService destroyed")
    }
}
