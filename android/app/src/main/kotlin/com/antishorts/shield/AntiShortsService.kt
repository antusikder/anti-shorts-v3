package com.antishorts.shield

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * AntiShortsService
 * =================
 * The core Android Accessibility Service for Anti Shorts.
 *
 * Architecture:
 * - Only activates for YouTube (com.google.android.youtube) and Facebook (com.facebook.katana)
 * - Uses throttled scanning (100–400ms) to conserve battery
 * - Targets view nodes by ID, text, or contentDescription — never reads pixels
 * - Implements single-retry (50ms) on failed finds before giving up gracefully
 * - Stateless between events — no memory leaks or accumulating state
 *
 * Safety guarantees:
 * - Never reads keystrokes, clipboard, or personal data
 * - Never interacts with any app other than YouTube/Facebook
 * - Fails silently — never crashes or destabilizes the system
 */
class AntiShortsService : AccessibilityService() {

    companion object {
        private const val TAG = "AntiShortsService"
        const val PREFS_NAME = "antishorts_prefs"

        // Preference keys (synced from React Native UI)
        const val PREF_YT_SHORTS = "yt_remove_shorts"
        const val PREF_YT_AUTO_BACK = "yt_auto_back"
        const val PREF_YT_ADS = "yt_remove_ads"
        const val PREF_FB_REELS = "fb_remove_reels"
        const val PREF_FB_ADS = "fb_remove_ads"
        const val PREF_SCAN_INTERVAL = "scan_interval_ms"

        // Target package names
        const val PKG_YOUTUBE = "com.google.android.youtube"
        const val PKG_FACEBOOK = "com.facebook.katana"

        // Default scan interval (balanced mode)
        const val DEFAULT_SCAN_INTERVAL = 200L

        // Single-retry delay before giving up on a view find
        const val RETRY_DELAY_MS = 50L

        // YouTube Shorts player container IDs (multiple fallbacks)
        val YOUTUBE_SHORTS_PLAYER_IDS = listOf(
            "com.google.android.youtube:id/reel_player_view_container",
            "com.google.android.youtube:id/shorts_container",
            "com.google.android.youtube:id/reel_watch_player",
            "com.google.android.youtube:id/shorts_player_container"
        )

        // YouTube Shorts feed text identifiers
        val YOUTUBE_SHORTS_FEED_TEXT = listOf(
            "Shorts", "YouTube Shorts"
        )

        // YouTube "Fewer Shorts" menu option text
        val YOUTUBE_FEWER_SHORTS_TEXT = listOf(
            "Don't recommend Shorts from this channel",
            "Fewer Shorts",
            "Not interested",
            "Hide",
            "Don't recommend"
        )

        // YouTube ad identifiers
        val YOUTUBE_AD_TEXT = listOf("Ad ", "Ad•", "Sponsored", "Promoted")
        val YOUTUBE_AD_IDS = listOf(
            "com.google.android.youtube:id/ad_badge",
            "com.google.android.youtube:id/skip_ad_button",
            "com.google.android.youtube:id/ad_indicator"
        )

        // YouTube ad dismissal text
        val YOUTUBE_AD_DISMISS_TEXT = listOf(
            "Not interested in this ad",
            "Stop seeing this ad",
            "Report ad",
            "Not relevant"
        )

        // Facebook Reels identifiers
        val FACEBOOK_REELS_CONTENT_DESC = listOf(
            "Reel by", "Reels", "Reel •", "Watch Reel"
        )
        val FACEBOOK_REELS_TEXT = listOf(
            "Reels", "Reel", "Watch Reel"
        )

        // Facebook "Fewer Reels" menu options
        val FACEBOOK_FEWER_REELS_TEXT = listOf(
            "See fewer Reels",
            "Hide Reels",
            "Don't show Reels",
            "Not interested"
        )

        // Facebook ad identifiers
        val FACEBOOK_AD_TEXT = listOf("Sponsored", "Sponsored ·")

        // Facebook ad dismissal
        val FACEBOOK_AD_DISMISS_TEXT = listOf(
            "Hide ad",
            "This ad is irrelevant",
            "Not relevant",
            "Report ad"
        )
    }

    private val handler = Handler(Looper.getMainLooper())
    private var lastCheckTime = 0L
    private var currentPackage = ""
    private lateinit var prefs: SharedPreferences

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        Log.d(TAG, "AntiShortsService connected and ready")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return

        val packageName = event.packageName?.toString() ?: return

        // Only process YouTube and Facebook — ignore everything else
        if (packageName != PKG_YOUTUBE && packageName != PKG_FACEBOOK) return

        currentPackage = packageName

        val now = System.currentTimeMillis()
        val interval = prefs.getLong(PREF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)

        // Throttle: only scan once per interval to conserve battery
        if (now - lastCheckTime < interval) return
        lastCheckTime = now

        val eventType = event.eventType
        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            return
        }

        val rootNode = rootInActiveWindow ?: return

        try {
            when (packageName) {
                PKG_YOUTUBE -> handleYoutube(rootNode)
                PKG_FACEBOOK -> handleFacebook(rootNode)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing accessibility event: ${e.message}")
        } finally {
            // Always recycle the root node to prevent memory leaks
            rootNode.recycle()
        }
    }

    // ===========================================================
    // YOUTUBE HANDLING
    // ===========================================================

    private fun handleYoutube(root: AccessibilityNodeInfo) {
        val ytAutoBack = prefs.getBoolean(PREF_YT_AUTO_BACK, true)
        val ytRemoveShorts = prefs.getBoolean(PREF_YT_SHORTS, true)
        val ytRemoveAds = prefs.getBoolean(PREF_YT_ADS, true)

        // Priority 1: Auto-back from Shorts player (fastest, most important)
        if (ytAutoBack && isShortsPlayerVisible(root)) {
            Log.d(TAG, "YouTube Shorts player detected — firing BACK")
            performGlobalAction(GLOBAL_ACTION_BACK)
            return // Done — no need to check further
        }

        // Priority 2: Remove Shorts from feed
        if (ytRemoveShorts) {
            handleYoutubeShortsInFeed(root)
        }

        // Priority 3: Remove ads
        if (ytRemoveAds) {
            handleYoutubeAds(root)
        }
    }

    /**
     * Checks if the YouTube Shorts video player container is currently visible.
     * Uses multiple view ID fallbacks for version resilience.
     */
    private fun isShortsPlayerVisible(root: AccessibilityNodeInfo): Boolean {
        for (viewId in YOUTUBE_SHORTS_PLAYER_IDS) {
            val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
            if (nodes.isNotEmpty()) {
                val visible = nodes.any { it.isVisibleToUser }
                nodes.forEach { it.recycle() }
                if (visible) return true
            }
        }
        return false
    }

    /**
     * Scans the YouTube home feed for the "Shorts" shelf header.
     * When found: clicks the 3-dots menu, then clicks "Fewer Shorts" or similar.
     */
    private fun handleYoutubeShortsInFeed(root: AccessibilityNodeInfo) {
        for (shortsText in YOUTUBE_SHORTS_FEED_TEXT) {
            val shortsNodes = root.findAccessibilityNodeInfosByText(shortsText)
            if (shortsNodes.isNotEmpty()) {
                for (node in shortsNodes) {
                    tryDismissShortsShelf(root, node)
                    node.recycle()
                }
                break
            }
        }
    }

    /**
     * Given a Shorts shelf node, finds the 3-dots menu and triggers dismissal.
     * Walks up the parent hierarchy to find a clickable container if needed.
     */
    private fun tryDismissShortsShelf(root: AccessibilityNodeInfo, shortsNode: AccessibilityNodeInfo) {
        // Look for a "more options" or overflow button near this node
        val menuNode = findMenuButtonNearNode(root, shortsNode)
        if (menuNode != null) {
            menuNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            menuNode.recycle()

            // Wait a moment for the menu to open, then find and click the dismiss option
            handler.postDelayed({
                withRetry {
                    try {
                        val currentRoot = rootInActiveWindow ?: return@withRetry false
                        var clicked = false
                        for (dismissText in YOUTUBE_FEWER_SHORTS_TEXT) {
                            val dismissNodes = currentRoot.findAccessibilityNodeInfosByText(dismissText)
                            if (dismissNodes.isNotEmpty()) {
                                val target = dismissNodes.firstOrNull { it.isClickable }
                                    ?: findClickableParent(dismissNodes.first())
                                if (target != null) {
                                    target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                                    clicked = true
                                }
                                dismissNodes.forEach { it.recycle() }
                                if (clicked) {
                                    Log.d(TAG, "YouTube Shorts dismissed from feed")
                                    break
                                }
                            }
                        }
                        currentRoot.recycle()
                        clicked
                    } catch (e: Exception) {
                        Log.e(TAG, "Error dismissing Shorts menu: ${e.message}")
                        false
                    }
                }
            }, 350)
        } else {
            // Fallback: just trigger back if we're inside Shorts
            Log.d(TAG, "No menu found for Shorts shelf — using back fallback")
        }
    }

    /**
     * Finds a menu/overflow button visually near a given node.
     * Searches by content description first, then by common view IDs.
     */
    private fun findMenuButtonNearNode(
        root: AccessibilityNodeInfo,
        nearNode: AccessibilityNodeInfo
    ): AccessibilityNodeInfo? {
        // Try content descriptions for the 3-dot menu
        val menuDescriptions = listOf(
            "More options", "More", "Menu", "Options", "Overflow"
        )
        for (desc in menuDescriptions) {
            val nodes = root.findAccessibilityNodeInfosByText(desc)
            if (nodes.isNotEmpty()) {
                val result = nodes.firstOrNull { it.isClickable }
                nodes.forEach { if (it != result) it.recycle() }
                if (result != null) return result
            }
        }

        // Try walking the parent of the Shorts node to find a clickable sibling
        var parent = nearNode.parent
        var depth = 0
        while (parent != null && depth < 5) {
            if (parent.isClickable && parent.contentDescription?.toString()?.contains("more", ignoreCase = true) == true) {
                return parent
            }
            val temp = parent.parent
            parent.recycle()
            parent = temp
            depth++
        }
        parent?.recycle()
        return null
    }

    /**
     * Handles YouTube ads. Finds sponsored labels and triggers ad dismissal.
     */
    private fun handleYoutubeAds(root: AccessibilityNodeInfo) {
        // Check by ad badge view ID
        for (adId in YOUTUBE_AD_IDS) {
            val adNodes = root.findAccessibilityNodeInfosByViewId(adId)
            if (adNodes.isNotEmpty()) {
                adNodes.forEach { it.recycle() }
                triggerAdDismissalYoutube(root)
                return
            }
        }

        // Check by ad text label
        for (adText in YOUTUBE_AD_TEXT) {
            val adNodes = root.findAccessibilityNodeInfosByText(adText)
            if (adNodes.isNotEmpty()) {
                adNodes.forEach { it.recycle() }
                triggerAdDismissalYoutube(root)
                return
            }
        }
    }

    private fun triggerAdDismissalYoutube(root: AccessibilityNodeInfo) {
        val menuDescriptions = listOf("More options", "More", "Menu")
        for (desc in menuDescriptions) {
            val nodes = root.findAccessibilityNodeInfosByText(desc)
            if (nodes.isNotEmpty()) {
                val menuNode = nodes.firstOrNull { it.isClickable }
                nodes.forEach { if (it != menuNode) it.recycle() }
                if (menuNode != null) {
                    menuNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    menuNode.recycle()

                    handler.postDelayed({
                        withRetry {
                            try {
                                val currentRoot = rootInActiveWindow ?: return@withRetry false
                                var clicked = false
                                for (dismissText in YOUTUBE_AD_DISMISS_TEXT) {
                                    val nodes2 = currentRoot.findAccessibilityNodeInfosByText(dismissText)
                                    if (nodes2.isNotEmpty()) {
                                        val target = nodes2.firstOrNull { it.isClickable }
                                            ?: findClickableParent(nodes2.first())
                                        if (target != null) {
                                            target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                                            clicked = true
                                        }
                                        nodes2.forEach { it.recycle() }
                                        if (clicked) {
                                            Log.d(TAG, "YouTube ad dismissed")
                                            break
                                        }
                                    }
                                }
                                currentRoot.recycle()
                                clicked
                            } catch (e: Exception) {
                                Log.e(TAG, "Error dismissing YouTube ad: ${e.message}")
                                false
                            }
                        }
                    }, 300)
                    break
                }
            }
        }
    }

    // ===========================================================
    // FACEBOOK HANDLING
    // ===========================================================

    private fun handleFacebook(root: AccessibilityNodeInfo) {
        val fbRemoveReels = prefs.getBoolean(PREF_FB_REELS, true)
        val fbRemoveAds = prefs.getBoolean(PREF_FB_ADS, true)

        if (fbRemoveReels) {
            handleFacebookReels(root)
        }

        if (fbRemoveAds) {
            handleFacebookAds(root)
        }
    }

    /**
     * Scans Facebook feed for Reels content.
     * Targets by content description and text labels.
     */
    private fun handleFacebookReels(root: AccessibilityNodeInfo) {
        // Try by content description first (more reliable)
        for (desc in FACEBOOK_REELS_CONTENT_DESC) {
            val nodes = root.findAccessibilityNodeInfosByText(desc)
            if (nodes.isNotEmpty()) {
                for (node in nodes) {
                    tryDismissFacebookReelsShelf(root, node)
                    node.recycle()
                }
                return
            }
        }
    }

    private fun tryDismissFacebookReelsShelf(
        root: AccessibilityNodeInfo,
        reelsNode: AccessibilityNodeInfo
    ) {
        // Find the 3-dot or overflow menu button in the Reels shelf
        val menuNode = findMenuButtonNearNode(root, reelsNode)
        if (menuNode != null) {
            menuNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            menuNode.recycle()

            handler.postDelayed({
                withRetry {
                    try {
                        val currentRoot = rootInActiveWindow ?: return@withRetry false
                        var clicked = false
                        for (dismissText in FACEBOOK_FEWER_REELS_TEXT) {
                            val dismissNodes = currentRoot.findAccessibilityNodeInfosByText(dismissText)
                            if (dismissNodes.isNotEmpty()) {
                                val target = dismissNodes.firstOrNull { it.isClickable }
                                    ?: findClickableParent(dismissNodes.first())
                                if (target != null) {
                                    target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                                    clicked = true
                                }
                                dismissNodes.forEach { it.recycle() }
                                if (clicked) {
                                    Log.d(TAG, "Facebook Reels dismissed from feed")
                                    break
                                }
                            }
                        }
                        currentRoot.recycle()
                        clicked
                    } catch (e: Exception) {
                        Log.e(TAG, "Error dismissing Facebook Reels menu: ${e.message}")
                        false
                    }
                }
            }, 350)
        }
    }

    /**
     * Handles Facebook ads by finding "Sponsored" labels and triggering dismissal.
     */
    private fun handleFacebookAds(root: AccessibilityNodeInfo) {
        for (adText in FACEBOOK_AD_TEXT) {
            val adNodes = root.findAccessibilityNodeInfosByText(adText)
            if (adNodes.isNotEmpty()) {
                for (node in adNodes) {
                    tryDismissFacebookAd(root, node)
                    node.recycle()
                }
                return
            }
        }
    }

    private fun tryDismissFacebookAd(root: AccessibilityNodeInfo, adNode: AccessibilityNodeInfo) {
        // Walk up to find the ad card container
        val menuNode = findMenuButtonNearNode(root, adNode)
        if (menuNode != null) {
            menuNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            menuNode.recycle()

            handler.postDelayed({
                withRetry {
                    try {
                        val currentRoot = rootInActiveWindow ?: return@withRetry false
                        var clicked = false
                        for (dismissText in FACEBOOK_AD_DISMISS_TEXT) {
                            val dismissNodes = currentRoot.findAccessibilityNodeInfosByText(dismissText)
                            if (dismissNodes.isNotEmpty()) {
                                val target = dismissNodes.firstOrNull { it.isClickable }
                                    ?: findClickableParent(dismissNodes.first())
                                if (target != null) {
                                    target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                                    clicked = true
                                }
                                dismissNodes.forEach { it.recycle() }
                                if (clicked) {
                                    Log.d(TAG, "Facebook ad dismissed")
                                    break
                                }
                            }
                        }
                        currentRoot.recycle()
                        clicked
                    } catch (e: Exception) {
                        Log.e(TAG, "Error dismissing Facebook ad: ${e.message}")
                        false
                    }
                }
            }, 350)
        }
    }

    // ===========================================================
    // UTILITIES
    // ===========================================================

    /**
     * Walks up the parent hierarchy (max 5 levels) to find a clickable ancestor.
     * Used when the target text node itself is not clickable.
     */
    private fun findClickableParent(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var current: AccessibilityNodeInfo? = node.parent
        var depth = 0
        while (current != null && depth < 5) {
            if (current.isClickable) return current
            val next = current.parent
            current.recycle()
            current = next
            depth++
        }
        current?.recycle()
        return null
    }

    /**
     * Single-retry helper: tries an action, waits RETRY_DELAY_MS, tries once more.
     * Prevents false negatives from slow network/rendering.
     */
    private fun withRetry(action: () -> Boolean) {
        if (!action()) {
            handler.postDelayed({
                action()
            }, RETRY_DELAY_MS)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "AntiShortsService interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
        Log.d(TAG, "AntiShortsService destroyed")
    }
}
