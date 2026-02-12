package com.timigs.timigs_android

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Auto-start the foreground tracking service after boot
            TrackingForegroundService.start(context)
        }
    }
}
