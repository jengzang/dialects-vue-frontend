package top.yzup.dialects;

import android.os.Bundle;
import android.os.Build;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import android.os.SystemClock;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long lastExitBackPress = -1;
    private Toast exitToast;
    private boolean backDispatchInFlight;
    private OnBackInvokedCallback overlayBackCallback;
    private boolean overlayBackBlocked;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(DialectsNativePlugin.class);
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleNativeBack();
            }
        });
    }

    public boolean isOverlayBackBlocked() { return overlayBackBlocked; }

    public void setOverlayBackBlocked(boolean blocked) {
        overlayBackBlocked = blocked;
        // Overlay priority runs before the IME on Android 13+.
        if (Build.VERSION.SDK_INT < 33) return;
        if (blocked && overlayBackCallback == null) {
            overlayBackCallback = this::handleNativeBack;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_OVERLAY, overlayBackCallback);
        } else if (!blocked && overlayBackCallback != null) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(overlayBackCallback);
            overlayBackCallback = null;
        }
    }

    public void handleNativeBack() {
        WebView webView = getBridge() == null ? null : getBridge().getWebView();
        if (backDispatchInFlight) return;
        if (webView == null) {
            navigateBack(null);
            return;
        }
        backDispatchInFlight = true;
        webView.evaluateJavascript(
            "Boolean(window.__dialectsHandleBack && window.__dialectsHandleBack())",
            handled -> {
                backDispatchInFlight = false;
                if ("true".equals(handled)) {
                    resetExitBackPress();
                    return;
                }
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(webView);
                if (insets != null && insets.isVisible(WindowInsetsCompat.Type.ime())) {
                    new WindowInsetsControllerCompat(getWindow(), webView).hide(WindowInsetsCompat.Type.ime());
                    webView.clearFocus();
                    resetExitBackPress();
                    return;
                }
                navigateBack(webView);
            });
    }

    private void resetExitBackPress() {
        lastExitBackPress = -1;
        if (exitToast != null) exitToast.cancel();
    }

    private void navigateBack(WebView webView) {
        if (webView != null && webView.canGoBack()) {
            resetExitBackPress();
            webView.goBack();
            return;
        }
        long now = SystemClock.elapsedRealtime();
        if (lastExitBackPress >= 0 && now - lastExitBackPress <= 2000) {
            if (exitToast != null) exitToast.cancel();
            finish();
            return;
        }
        lastExitBackPress = now;
        exitToast = Toast.makeText(this, R.string.press_back_again_to_exit, Toast.LENGTH_SHORT);
        exitToast.show();
    }

    @Override
    public void onResume() {
        super.onResume();
        lastExitBackPress = -1;
    }
}
