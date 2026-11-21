package com.nightdrops.glowbelow

import android.os.Bundle
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

/**
 * Glow Below's activity: full screen in landscape (set in the manifest), system
 * bars hidden and back only if swiped in, a back button that never quits, and
 * a keep-awake switch the game flips while the child plays.
 */
class MainActivity : TauriActivity() {
  private var webView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    // Added after Tauri's own handler, so it runs first.
    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() = back()
    })
  }

  override fun onWebViewCreate(webView: WebView) {
    this.webView = webView
    webView.addJavascriptInterface(Native(), "GlowNative")
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) hideSystemBars()
  }

  private fun hideSystemBars() {
    WindowCompat.setDecorFitsSystemWindows(window, false)
    WindowInsetsControllerCompat(window, window.decorView).apply {
      hide(WindowInsetsCompat.Type.systemBars())
      systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
  }

  /** Asks the game to close the album or the parent corner; with nothing open, goes to the background. */
  private fun back() {
    val view = webView ?: return moveTaskToBack(true).let {}
    view.evaluateJavascript("String(!!(window.__glowBack && window.__glowBack()))") { closed ->
      if (closed != "\"true\"") moveTaskToBack(true)
    }
  }

  /** Called from the page as `window.GlowNative`. */
  private inner class Native {
    @JavascriptInterface
    fun keepAwake(on: Boolean) = runOnUiThread {
      if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
  }
}
