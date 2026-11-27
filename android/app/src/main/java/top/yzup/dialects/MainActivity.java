package top.yzup.dialects;

import android.animation.Animator;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.content.pm.PackageInfo;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.Build;
import android.provider.Settings;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import android.os.SystemClock;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.OvershootInterpolator;
import android.view.animation.PathInterpolator;
import android.widget.TextView;
import androidx.core.splashscreen.SplashScreen;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final long MIN_LAUNCH_DISPLAY_MS = 900L;
    private View launchOverlay;
    private long launchShownAtMs = 0L;
    private boolean launchHideScheduled = false;
    private final List<Animator> launchAnimators = new ArrayList<>();
    private long lastExitBackPress = -1;
    private Toast exitToast;
    private boolean backDispatchInFlight;
    private OnBackInvokedCallback overlayBackCallback;
    private boolean overlayBackBlocked;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(DialectsNativePlugin.class);
        super.onCreate(savedInstanceState);
        launchOverlay = getLayoutInflater().inflate(R.layout.native_launch, null);
        addContentView(launchOverlay, new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        startLaunchAnimation(launchOverlay);
        launchOverlay.postDelayed(this::hideLaunch, 15000);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleNativeBack();
            }
        });
    }

    private boolean isReduceMotionEnabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !ValueAnimator.areAnimatorsEnabled()) {
            return true;
        }
        return Settings.Global.getFloat(
            getContentResolver(), Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f;
    }

    private String resolveAppVersionLabel() {
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            if (info != null && info.versionName != null && !info.versionName.isEmpty()) {
                return info.versionName.startsWith("v") ? info.versionName : "v" + info.versionName;
            }
        } catch (Exception ignored) {
            // Fall back to empty version label if package metadata is unavailable.
        }
        return "";
    }

    private void cancelLaunchAnimators() {
        for (Animator animator : launchAnimators) {
            animator.cancel();
        }
        launchAnimators.clear();
    }

    private void startLaunchAnimation(View overlay) {
        launchShownAtMs = SystemClock.elapsedRealtime();
        launchHideScheduled = false;

        View header = overlay.findViewById(R.id.launch_header);
        View footer = overlay.findViewById(R.id.launch_footer);
        final int baseHeaderTop = header != null ? header.getPaddingTop() : 0;
        final int baseFooterBottom = footer != null ? footer.getPaddingBottom() : 0;
        ViewCompat.setOnApplyWindowInsetsListener(overlay, (v, insets) -> {
            androidx.core.graphics.Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            if (header != null) {
                header.setPadding(
                    header.getPaddingLeft(),
                    baseHeaderTop + bars.top,
                    header.getPaddingRight(),
                    header.getPaddingBottom()
                );
            }
            if (footer != null) {
                footer.setPadding(
                    footer.getPaddingLeft(),
                    footer.getPaddingTop(),
                    footer.getPaddingRight(),
                    baseFooterBottom + bars.bottom
                );
            }
            return insets;
        });
        ViewCompat.requestApplyInsets(overlay);

        TextView versionView = overlay.findViewById(R.id.launch_version);
        if (versionView != null) {
            versionView.setText(resolveAppVersionLabel());
        }
        if (isReduceMotionEnabled()) return;

        View logo = overlay.findViewById(R.id.launch_logo);
        View brush = overlay.findViewById(R.id.launch_title_brush);
        View seal = overlay.findViewById(R.id.launch_title_seal);
        View description = overlay.findViewById(R.id.launch_description);
        View phonetics = overlay.findViewById(R.id.launch_phonetics);

        float density = getResources().getDisplayMetrics().density;
        PathInterpolator easeOut = new PathInterpolator(0.22f, 1f, 0.36f, 1f);

        if (logo != null) {
            logo.setScaleX(1.03f);
            logo.setScaleY(1.03f);
            logo.animate().scaleX(1f).scaleY(1f).setDuration(360).setInterpolator(easeOut).start();
        }
        if (brush != null) {
            brush.setAlpha(0f);
        }
        if (seal != null) {
            seal.setAlpha(0f);
            seal.setScaleX(1.65f);
            seal.setScaleY(1.65f);
            seal.setRotation(-10f);
        }
        if (description != null) {
            description.setAlpha(0f);
            description.setTranslationY(10f * density);
        }
        if (phonetics != null) {
            phonetics.setAlpha(0f);
            phonetics.setTranslationY(10f * density);
        }
        if (versionView != null) {
            versionView.setAlpha(0f);
        }

        overlay.post(() -> {
            if (launchOverlay != overlay) return;

            if (brush != null && brush.getWidth() > 0 && brush.getHeight() > 0) {
                int w = brush.getWidth();
                int h = brush.getHeight();
                Rect clipRect = new Rect(0, 0, 0, h);
                brush.setClipBounds(clipRect);
                brush.setAlpha(1f);

                ValueAnimator inkSweep = ValueAnimator.ofFloat(0f, 1f);
                inkSweep.setStartDelay(100);
                inkSweep.setDuration(560);
                inkSweep.setInterpolator(easeOut);
                inkSweep.addUpdateListener(anim -> {
                    float progress = (float) anim.getAnimatedValue();
                    clipRect.right = Math.round(w * progress);
                    brush.setClipBounds(clipRect);
                });
                inkSweep.start();
                launchAnimators.add(inkSweep);
            } else if (brush != null) {
                brush.animate().alpha(1f).setStartDelay(100).setDuration(420).setInterpolator(easeOut).start();
            }

            if (seal != null) {
                if (seal.getWidth() > 0 && seal.getHeight() > 0) {
                    seal.setPivotX(seal.getWidth() * 0.85f);
                    seal.setPivotY(seal.getHeight() * 0.19f);
                }
                seal.animate()
                    .alpha(1f)
                    .scaleX(1f)
                    .scaleY(1f)
                    .rotation(0f)
                    .setStartDelay(460)
                    .setDuration(360)
                    .setInterpolator(new OvershootInterpolator(1.6f))
                    .start();
            }

            if (description != null) {
                description.animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setStartDelay(520)
                    .setDuration(340)
                    .setInterpolator(easeOut)
                    .start();
            }

            if (phonetics != null) {
                phonetics.animate()
                    .alpha(0.62f)
                    .translationY(0f)
                    .setStartDelay(640)
                    .setDuration(340)
                    .setInterpolator(easeOut)
                    .withEndAction(() -> {
                        if (launchOverlay != overlay) return;
                        ObjectAnimator pulse = ObjectAnimator.ofFloat(phonetics, View.ALPHA, 0.62f, 0.26f);
                        pulse.setDuration(1250);
                        pulse.setRepeatMode(ValueAnimator.REVERSE);
                        pulse.setRepeatCount(ValueAnimator.INFINITE);
                        pulse.start();
                        launchAnimators.add(pulse);
                    })
                    .start();
            }

            if (versionView != null) {
                versionView.animate()
                    .alpha(0.55f)
                    .setStartDelay(480)
                    .setDuration(320)
                    .setInterpolator(easeOut)
                    .start();
            }
        });
    }

    public void hideLaunch() {
        if (launchOverlay == null || launchHideScheduled) return;
        launchHideScheduled = true;

        long delayMs = 0L;
        if (!isReduceMotionEnabled()) {
            long elapsedMs = SystemClock.elapsedRealtime() - launchShownAtMs;
            delayMs = Math.max(0L, MIN_LAUNCH_DISPLAY_MS - elapsedMs);
        }

        if (delayMs > 0L) {
            launchOverlay.postDelayed(this::performHideLaunch, delayMs);
        } else {
            performHideLaunch();
        }
    }

    private void performHideLaunch() {
        if (launchOverlay == null) return;
        View overlay = launchOverlay;
        launchOverlay = null;
        cancelLaunchAnimators();

        Runnable removeOverlay = () -> {
            if (overlay.getParent() instanceof ViewGroup) {
                ((ViewGroup) overlay.getParent()).removeView(overlay);
            }
        };

        if (isReduceMotionEnabled()) {
            overlay.animate().alpha(0f).setDuration(200).withEndAction(removeOverlay).start();
            return;
        }

        PathInterpolator easeOut = new PathInterpolator(0.22f, 1f, 0.36f, 1f);
        float density = getResources().getDisplayMetrics().density;
        View header = overlay.findViewById(R.id.launch_header);
        View center = overlay.findViewById(R.id.launch_center);
        View footer = overlay.findViewById(R.id.launch_footer);
        if (header != null) {
            header.animate()
                .translationY(-20f * density)
                .alpha(0f)
                .setDuration(320)
                .setInterpolator(easeOut)
                .start();
        }
        if (center != null) {
            center.animate()
                .scaleX(0.95f)
                .scaleY(0.95f)
                .alpha(0f)
                .setDuration(340)
                .setInterpolator(easeOut)
                .start();
        }
        if (footer != null) {
            footer.animate()
                .translationY(12f * density)
                .alpha(0f)
                .setDuration(320)
                .setInterpolator(easeOut)
                .start();
        }
        overlay.animate()
            .alpha(0f)
            .setDuration(360)
            .setInterpolator(easeOut)
            .withEndAction(removeOverlay)
            .start();
    }

    @Override
    public void onDestroy() {
        cancelLaunchAnimators();
        super.onDestroy();
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
