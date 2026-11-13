package top.yzup.dialects;

import android.os.Bundle;
import android.os.SystemClock;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long lastExitBackPress = -1;
    private Toast exitToast;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() == null ? null : getBridge().getWebView();
                if (webView != null && webView.canGoBack()) {
                    lastExitBackPress = -1;
                    if (exitToast != null) exitToast.cancel();
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
                exitToast = Toast.makeText(MainActivity.this, R.string.press_back_again_to_exit, Toast.LENGTH_SHORT);
                exitToast.show();
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        lastExitBackPress = -1;
    }
}
