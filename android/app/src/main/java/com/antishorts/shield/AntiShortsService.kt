package com.antishorts.shield

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * FreshMindService — Clean, targeted short-form content blocker.
 *
 * Detection Strategy:
 * 1. Back-Bounce: Direct player view ID detection → navigate back immediately
 * 2. Menu Heuristic: Count items in a popup menu. 1-2 items = Short/Reel → click "Not interested".
 *    3+ items = regular content → close menu and do nothing.
 * 3. Ad Skipper: Detect "Skip Ad" button text → click it.
 * 4. Strict Block: If target app is open and strict mode is on → go home.
 *
 * Throttle: 100ms for scroll-triggered events. Separate 800ms cooldown for back actions.
 */
class AntiShortsService : AccessibilityService() {

    private lateinit var prefs: SharedPreferences

    // Settings
    private var enabled = true
    private var removeShorts = true      // YT menu heuristic
    private var backBounce = true        // Direct player back-bounce
    private var removeReels = true       // FB + IG
    private var skipAds = true
    private var strictMode = false
    private var strictEndTime = 0L

    // Timing
    private var lastScrollActionTime = 0L
    private var lastBackTime = 0L
    private val SCROLL_THROTTLE_MS = 100L
    private val BACK_COOLDOWN_MS = 800L
    private val ACTION_COOLDOWN_MS = 300L
    private var lastMenuActionTime = 0L

    // Reward / Stats
    private var rewardTriggerTime = 0L

    companion object {
        const val TAG = "FreshMind"
        const val PREFS = "freshMindPrefs"
    }

    override fun onServiceConnected() {
        Log.i(TAG, "FreshMindService connected")
        prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs.registerOnSharedPreferenceChangeListener { _, _ -> loadSettings() }
        loadSettings()
    }

    private fun loadSettings() {
        enabled     = prefs.getBoolean("enabled", true)
        removeShorts = prefs.getBoolean("removeShorts", true)
        backBounce  = prefs.getBoolean("backBounce", true)
        removeReels = prefs.getBoolean("removeReels", true)
        skipAds     = prefs.getBoolean("skipAds", true)
        strictMode  = prefs.getBoolean("strictMode", false)
        strictEndTime = prefs.getLong("strictEndTime", 0L)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (!enabled) return

        val now = System.currentTimeMillis()

        // Strict mode — if active, immediately bounce to home
        if (strictMode && strictEndTime > 0 && now < strictEndTime) {
            val pkg = event.packageName?.toString() ?: return
            val blockedRaw = prefs.getString("strictPackages", "") ?: ""
            val blocked = if (blockedRaw.isNotBlank()) blockedRaw.split(",") else emptyList()
            if (blocked.contains(pkg)) {
                if (now - lastBackTime > BACK_COOLDOWN_MS) {
                    performGlobalAction(GLOBAL_ACTION_HOME)
                    lastBackTime = now
                }
                return
            }
        }

        val type = event.eventType
        val pkg  = event.packageName?.toString() ?: return

        // ── Scroll throttle ────────────────────────────────────────────────────
        if (type == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            if (now - lastScrollActionTime < SCROLL_THROTTLE_MS) return
            lastScrollActionTime = now
        }

        val root = rootInActiveWindow ?: return

        try {
            when (pkg) {
                // YouTube + YT Music + YT Kids + YT Lite (if applicable)
                "com.google.android.youtube", "com.google.android.apps.youtube.lite" -> handleYouTube(root, now)
                
                // Facebook + Lite + Messenger
                "com.facebook.katana",
                "com.facebook.lite",
                "com.facebook.orca" -> handleFacebook(root, now)
                
                // Instagram + Lite
                "com.instagram.android", "com.instagram.lite" -> handleInstagram(root, now)
                
                // TikTok + Lite
                "com.zhiliaoapp.musically", "com.ss.android.ugc.trill.go" -> handleTikTok(root, now)

                // Browsers
                "com.android.chrome",
                "org.mozilla.firefox",
                "com.sec.android.app.sbrowser",
                "com.opera.browser",
                "com.microsoft.emmx" -> handleBrowser(root)
            }
        } finally {
            root.recycle()
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // YOUTUBE
    // ════════════════════════════════════════════════════════════════════════════

    private fun handleYouTube(root: AccessibilityNodeInfo, now: Long) {
        // 1. Ad Skip — highest priority
        if (skipAds) {
            val skipNode = findClickableText(root, listOf("Skip Ad", "Skip ads"))
            if (skipNode != null) {
                skipNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                skipNode.recycle()
                incrementStat("adsSkipped")
                return
            }
        }

        // 2. Back-bounce from Shorts player
        if (backBounce) {
            val shortsPlayer = root.findAccessibilityNodeInfosByViewId(
                "com.google.android.youtube:id/shorts_player_view"
            ).firstOrNull()
            if (shortsPlayer != null) {
                shortsPlayer.recycle()
                if (now - lastBackTime > BACK_COOLDOWN_MS) {
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    lastBackTime = now
                    incrementStat("shortsBlocked")
                    triggerReward(now)
                }
                return
            }
        }

        // 3. Menu heuristic — YouTube popup menu
        if (removeShorts && now - lastMenuActionTime > ACTION_COOLDOWN_MS) {
            handleMenuHeuristic(root, now, "shorts")
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // FACEBOOK
    // ════════════════════════════════════════════════════════════════════════════

    private fun handleFacebook(root: AccessibilityNodeInfo, now: Long) {
        if (!removeReels) return

        // 1. Back-bounce from Reels viewer
        if (backBounce) {
            val reelsViewer = root.findAccessibilityNodeInfosByViewId(
                "com.facebook.katana:id/reels_video_container"
            ).firstOrNull() ?: root.findAccessibilityNodeInfosByViewId(
                "com.facebook.katana:id/video_container"
            ).firstOrNull()

            if (reelsViewer != null) {
                reelsViewer.recycle()
                if (now - lastBackTime > BACK_COOLDOWN_MS) {
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    lastBackTime = now
                    incrementStat("reelsBlocked")
                    triggerReward(now)
                }
                return
            }
        }

        // 2. Menu heuristic
        if (now - lastMenuActionTime > ACTION_COOLDOWN_MS) {
            handleMenuHeuristic(root, now, "reels")
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // INSTAGRAM
    // ════════════════════════════════════════════════════════════════════════════

    private fun handleInstagram(root: AccessibilityNodeInfo, now: Long) {
        if (!removeReels) return

        // Back-bounce from Reels / Clips
        if (backBounce) {
            val clipsContainer = root.findAccessibilityNodeInfosByViewId(
                "com.instagram.android:id/clips_video_container"
            ).firstOrNull() ?: root.findAccessibilityNodeInfosByViewId(
                "com.instagram.android:id/reel_player_container"
            ).firstOrNull()

            if (clipsContainer != null) {
                clipsContainer.recycle()
                if (now - lastBackTime > BACK_COOLDOWN_MS) {
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    lastBackTime = now
                    incrementStat("reelsBlocked")
                    triggerReward(now)
                }
                return
            }
        }

        // Menu heuristic for IG feed posts (hide reel suggestions)
        if (now - lastMenuActionTime > ACTION_COOLDOWN_MS) {
            handleMenuHeuristic(root, now, "reels")
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // TIKTOK
    // ════════════════════════════════════════════════════════════════════════════

    private fun handleTikTok(root: AccessibilityNodeInfo, now: Long) {
        if (!removeReels) return

        if (backBounce) {
            val mainPager = root.findAccessibilityNodeInfosByViewId(
                "com.zhiliaoapp.musically:id/view_pager"
            ).firstOrNull() ?: root.findAccessibilityNodeInfosByViewId(
                "com.ss.android.ugc.trill.go:id/view_pager"
            ).firstOrNull()

            if (mainPager != null) {
                mainPager.recycle()
                if (now - lastBackTime > BACK_COOLDOWN_MS) {
                    performGlobalAction(GLOBAL_ACTION_HOME) // TikTok traps BACK, Home is safer
                    lastBackTime = now
                    incrementStat("reelsBlocked")
                    triggerReward(now)
                }
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // BROWSER
    // ════════════════════════════════════════════════════════════════════════════

    private fun handleBrowser(root: AccessibilityNodeInfo) {
        if (!backBounce) return

        val urlBar = root.findAccessibilityNodeInfosByViewId("com.android.chrome:id/url_bar").firstOrNull()
            ?: root.findAccessibilityNodeInfosByViewId("org.mozilla.firefox:id/mozac_browser_toolbar_url_view").firstOrNull()
            ?: root.findAccessibilityNodeInfosByViewId("com.sec.android.app.sbrowser:id/location_bar_edit_text").firstOrNull()
            ?: root.findAccessibilityNodeInfosByViewId("com.opera.browser:id/url_field").firstOrNull()
            ?: root.findAccessibilityNodeInfosByViewId("com.microsoft.emmx:id/url_bar").firstOrNull()

        val url = urlBar?.text?.toString()?.lowercase() ?: ""
        urlBar?.recycle()

        val now = System.currentTimeMillis()
        if (now - lastBackTime > BACK_COOLDOWN_MS && (
            url.contains("youtube.com/shorts") || 
            url.contains("facebook.com/reels") || 
            url.contains("instagram.com/reels") ||
            url.contains("tiktok.com")
        )) {
            performGlobalAction(GLOBAL_ACTION_BACK)
            lastBackTime = now
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // MENU ITEM COUNT HEURISTIC — The Core Intelligence
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * When a popup/context menu appears, count its items.
     *   1-2 items → Short/Reel-style menu → click first "Not interested" / "Show less" / "Hide"
     *   3-4 items → Regular video menu with limited options → close (do nothing)
     *   5+ items  → Full context menu, not a short → close immediately
     */
    private fun handleMenuHeuristic(root: AccessibilityNodeInfo, now: Long, contentType: String) {
        // Find a popup/dialog list node
        val menuList = findMenuList(root) ?: return

        val itemCount = menuList.childCount
        Log.d(TAG, "Menu detected: $itemCount items")

        if (itemCount in 1..2) {
            // Short/Reel specific menu — click the removal option
            val clicked = clickMenuRemovalOption(menuList)
            if (clicked) {
                lastMenuActionTime = now
                incrementStat(if (contentType == "shorts") "shortsBlocked" else "reelsBlocked")
                triggerReward(now)
                Log.i(TAG, "Menu heuristic: removed $contentType (${itemCount} items)")
            }
        } else if (itemCount in 3..4) {
            // Ambiguous — close the menu safely
            performGlobalAction(GLOBAL_ACTION_BACK)
            lastMenuActionTime = now
        }
        // 5+ items = regular app menu, ignore completely

        menuList.recycle()
    }

    private fun findMenuList(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        // Look for a ListView or RecyclerView that is a popup/dialog
        return findNodeByClassName(root, "android.widget.ListView")
            ?: findNodeByClassName(root, "androidx.recyclerview.widget.RecyclerView")
    }

    private fun findNodeByClassName(node: AccessibilityNodeInfo, className: String): AccessibilityNodeInfo? {
        if (node.className?.toString() == className && node.childCount in 1..8) {
            return node
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val found = findNodeByClassName(child, className)
            if (found != null) {
                child.recycle()
                return found
            }
            child.recycle()
        }
        return null
    }

    private fun clickMenuRemovalOption(menuList: AccessibilityNodeInfo): Boolean {
        val removalTexts = listOf(
            "Not interested", "Don't recommend channel", "Don't recommend this",
            "Show less", "Show fewer", "Hide reel", "Hide Reel",
            "Hide video", "Remove from queue"
        )

        for (i in 0 until menuList.childCount) {
            val item = menuList.getChild(i) ?: continue
            val text = getNodeText(item)
            if (removalTexts.any { text.contains(it, ignoreCase = true) }) {
                if (item.isClickable) {
                    item.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                } else {
                    item.parent?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                }
                item.recycle()
                return true
            }
            item.recycle()
        }
        return false
    }

    // ════════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════════

    private fun findClickableText(root: AccessibilityNodeInfo, texts: List<String>): AccessibilityNodeInfo? {
        texts.forEach { text ->
            val nodes = root.findAccessibilityNodeInfosByText(text)
            nodes.forEach { node ->
                if (node.isClickable) return node
                val parent = node.parent
                if (parent?.isClickable == true) {
                    node.recycle()
                    return parent
                }
                node.recycle()
            }
        }
        return null
    }

    private fun getNodeText(node: AccessibilityNodeInfo): String {
        val text = node.text?.toString() ?: ""
        if (text.isNotBlank()) return text
        // Check children for text
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val childText = child.text?.toString() ?: ""
            child.recycle()
            if (childText.isNotBlank()) return childText
        }
        return ""
    }

    private fun incrementStat(key: String) {
        prefs.edit()
            .putInt(key, (prefs.getInt(key, 0) + 1))
            .apply()
    }

    private fun triggerReward(now: Long) {
        prefs.edit().putLong("rewardTriggerTime", now).apply()
    }

    override fun onInterrupt() {
        Log.w(TAG, "FreshMindService interrupted")
    }
}
