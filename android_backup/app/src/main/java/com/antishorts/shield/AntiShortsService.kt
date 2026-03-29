package com.antishorts.shield

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Path
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class AntiShortsService : AccessibilityService() {

    private val TAG = "AntiShortsService"
    private lateinit var prefs: SharedPreferences

    // Configuration map loaded from React Native via settings
    private var config = mutableMapOf<String, Boolean>()
    
    // Core parameters
    private var isSystemEnabled = true
    private var suddenBlockEndTime: Long = 0L

    // Throttler to prevent overwhelming the CPU
    private var lastEventTime = 0L
    private val EVENT_THROTTLE_MS = 300L

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Neural Scanner Activated (v4.1)")
        prefs = getSharedPreferences("com.antishorts.shield.PREFERENCE_FILE_KEY", Context.MODE_PRIVATE)
        
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or 
                         AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            // Extensive monitoring of core dopamine-trigger apps
            packageNames = arrayOf("com.google.android.youtube", "com.facebook.katana")
            notificationTimeout = 100
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        }
        this.serviceInfo = info
        loadConfig()
    }

    private fun loadConfig() {
        // Read native preferences populated by React Native
        isSystemEnabled = prefs.getBoolean("systemEnabled", true)
        suddenBlockEndTime = prefs.getLong("suddenBlockEndTime", 0L)
        
        config["youtube_enabled"] = prefs.getBoolean("youtube_enabled", true)
        config["youtube_removeShorts"] = prefs.getBoolean("youtube_removeShorts", true)
        config["skipAds"] = prefs.getBoolean("skipAds", true)
        config["youtube_subscribedOnly"] = prefs.getBoolean("youtube_subscribedOnly", false)
        config["facebook_enabled"] = prefs.getBoolean("facebook_enabled", true)
        config["facebook_removeReels"] = prefs.getBoolean("facebook_removeReels", true)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val now = System.currentTimeMillis()
        if (now - lastEventTime < EVENT_THROTTLE_MS) return
        
        loadConfig() // Fast reload mapping

        // Panic Mode Check
        if (suddenBlockEndTime > now) {
            performGlobalAction(GLOBAL_ACTION_HOME)
            Log.d(TAG, "Panic Mode Active: Booted user to Home")
            lastEventTime = now
            return
        }

        if (!isSystemEnabled) return

        val rootNode = rootInActiveWindow ?: return
        val packageName = event.packageName?.toString() ?: ""

        try {
            when (packageName) {
                "com.google.android.youtube" -> if (config["youtube_enabled"] == true) handleYouTube(rootNode)
                "com.facebook.katana" -> if (config["facebook_enabled"] == true) handleFacebook(rootNode)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Neural Scan Exception: ${e.message}")
        } finally {
            rootNode.recycle()
        }

        lastEventTime = now
    }

    private fun handleYouTube(rootNode: AccessibilityNodeInfo) {
        // 1. Shorts Annihilation (Heuristic + ID Based)
        if (config["youtube_removeShorts"] == true) {
            val isViewingShorts = recursiveFindAndDestroy(rootNode, listOf(
                "shorts_player", // Common ID
                "reel_recycler",
                "reel_player"
            ), listOf("Shorts", "Short"), detectShortsAspect = true)

            if (isViewingShorts) {
                recordStat("shortsShieldedToday")
                performGlobalAction(GLOBAL_ACTION_HOME)
                Log.d(TAG, "Intercepted YouTube Short - Sent to Home")
            } else {
                // Secondary check: Remove shorts rows from Home Feed selectively
                removeFeedRows(rootNode, listOf("Shorts", "Reels"))
            }
        }

        // 2. Automate Ad Skipping
        if (config["skipAds"] == true) {
            clickNodesByText(rootNode, listOf("Skip Ad", "Skip ads", "Skip navigation"))
        }

        // 3. Subscriptions Only (Strict Feed Control)
        if (config["youtube_subscribedOnly"] == true) {
            preventNonSubscriptionBrowsing(rootNode)
        }
    }

    private fun handleFacebook(rootNode: AccessibilityNodeInfo) {
        if (config["facebook_removeReels"] == true) {
            val isViewingReel = recursiveFindAndDestroy(rootNode, listOf(
                "reels_video_player",
                "reels_viewer_video"
            ), listOf("Reels", "Reel"), detectShortsAspect = true)

            if (isViewingReel) {
                recordStat("reelsRejectedToday")
                performGlobalAction(GLOBAL_ACTION_HOME)
                Log.d(TAG, "Intercepted Facebook Reel - Sent to Home")
            } else {
                // Remove reels containers from news feed
                removeFeedRows(rootNode, listOf("Reels and short videos", "Reels"))
            }
        }
    }

    // --- Neural Heuristics Engine ---

    private fun recursiveFindAndDestroy(
        node: AccessibilityNodeInfo, 
        targetIds: List<String>, 
        targetTexts: List<String>, 
        detectShortsAspect: Boolean
    ): Boolean {
        if (node.isDestroyed) return false

        // ID Check
        val viewId = node.viewIdResourceName ?: ""
        if (targetIds.any { viewId.contains(it, ignoreCase = true) }) return true

        // Text Check (Content Description or Text)
        val text = node.text?.toString()?.trim() ?: ""
        val contentDesc = node.contentDescription?.toString()?.trim() ?: ""
        if (targetTexts.any { text.equals(it, ignoreCase = true) || contentDesc.equals(it, ignoreCase = true) }) {
            // Confirm it's a main structural element, not just a random text view
            if (node.className?.toString()?.contains("Button") == true || viewId.contains("tab")) {
                return true
            }
        }

        // Geometric Aspect Ratio Check (The ultimate short-form killer)
        if (detectShortsAspect && (node.className == "android.widget.FrameLayout" || node.className == "android.view.ViewGroup")) {
            val bounds = Rect()
            node.getBoundsInScreen(bounds)
            val h = bounds.height().toFloat()
            val w = bounds.width().toFloat()
            
            // If the video container is vertically tall (aspect ratio > 1.4) AND takes up > 70% of the screen height
            val displayMetrics = resources.displayMetrics
            val screenHeight = displayMetrics.heightPixels.toFloat()
            
            if (w > 0 && h / w > 1.4f && h > screenHeight * 0.7f) {
                // We've detected a full-screen vertical swipe video player natively.
                return true
            }
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            if (child != null) {
                if (recursiveFindAndDestroy(child, targetIds, targetTexts, detectShortsAspect)) {
                    child.recycle()
                    return true
                }
                child.recycle()
            }
        }
        return false
    }

    private fun removeFeedRows(rootNode: AccessibilityNodeInfo, triggerWords: List<String>) {
        for (word in triggerWords) {
            val nodes = rootNode.findAccessibilityNodeInfosByText(word)
            for (node in nodes) {
                var parent = node.parent
                var depth = 0
                while (parent != null && depth < 4) {
                    if (parent.className?.toString()?.contains("RecyclerView") == true) {
                        performSwipeUp()
                        break
                    }
                    parent = parent.parent
                    depth++
                }
                node.recycle()
            }
        }
    }

    private fun preventNonSubscriptionBrowsing(rootNode: AccessibilityNodeInfo) {
         // Attempt to find the bottoms tabs and force selected tab to 'Subscriptions' 
         // If a 'Home' or 'Explore' container is dominant, auto-redirect or auto-click 'Subscriptions'
         val subsTab = rootNode.findAccessibilityNodeInfosByText("Subscriptions")
         if (subsTab.isNotEmpty()) {
             // Basic heuristic: check if it's selected. If not, click it. (Only once per app launch to avoid locking)
             val tabNode = subsTab[0]
             if (tabNode.parent != null && !tabNode.parent.isSelected) {
                 // We only enforce this heavily if strictly in Home.
                 // This requires careful state management, so for now we leave it passive.
             }
             tabNode.recycle()
         }
    }

    private fun clickNodesByText(rootNode: AccessibilityNodeInfo, texts: List<String>) {
        for (text in texts) {
            val nodes = rootNode.findAccessibilityNodeInfosByText(text)
            for (node in nodes) {
                var clickableNode: AccessibilityNodeInfo? = node
                while (clickableNode != null && !clickableNode.isClickable) {
                    clickableNode = clickableNode.parent
                }
                if (clickableNode != null) {
                    clickableNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    recordStat("adsRemovedToday")
                    Log.d(TAG, "Ad Skipped successfully via heuristic.")
                    clickableNode.recycle()
                }
                node.recycle()
            }
        }
    }

    private fun performSwipeUp() {
        Log.d(TAG, "Executing evasive maneuver (Swipe Up)")
        val path = Path().apply {
            moveTo(500f, 1500f)
            lineTo(500f, 500f) // Swipe Up relative coords
        }
        val builder = GestureDescription.Builder()
        val gesture = builder.addStroke(GestureDescription.StrokeDescription(path, 0, 300)).build()
        dispatchGesture(gesture, null, null)
    }

    private fun recordStat(key: String) {
        val current = prefs.getInt(key, 0)
        prefs.edit().putInt(key, current + 1).apply()
    }

    override fun onInterrupt() {
        Log.d(TAG, "Neural Scanner Interrupted")
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
    }
}
