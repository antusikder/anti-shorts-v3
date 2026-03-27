package com.antishorts.shield

import android.content.ComponentName
import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LauncherModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LauncherModule"

    @ReactMethod
    fun setIcon(iconName: String) {
        val context = reactApplicationContext
        val pm = context.packageManager
        
        val pkg = context.packageName
        val mainActivity = ComponentName(pkg, "$pkg.MainActivity")
        val calculatorAlias = ComponentName(pkg, "$pkg.CalculatorActivityAlias")

        if (iconName == "calculator") {
            // Enable calculator, disable main
            pm.setComponentEnabledSetting(
                calculatorAlias,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            pm.setComponentEnabledSetting(
                mainActivity,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )
        } else {
            // Enable main, disable calculator
            pm.setComponentEnabledSetting(
                mainActivity,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            pm.setComponentEnabledSetting(
                calculatorAlias,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )
        }
    }
}
