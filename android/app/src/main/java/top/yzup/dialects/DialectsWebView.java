package top.yzup.dialects;

import android.content.Context;
import android.content.ContextWrapper;
import android.os.Build;
import android.util.AttributeSet;
import android.view.KeyEvent;
import com.getcapacitor.CapacitorWebView;

public class DialectsWebView extends CapacitorWebView {
    public DialectsWebView(Context context, AttributeSet attrs) { super(context, attrs); }

    private MainActivity activity() {
        Context context = getContext();
        while (context instanceof ContextWrapper) {
            if (context instanceof MainActivity) return (MainActivity) context;
            context = ((ContextWrapper) context).getBaseContext();
        }
        return null;
    }

    @Override public boolean onKeyPreIme(int keyCode, KeyEvent event) {
        // Older Android delivers BACK to the IME before the Activity.
        if (Build.VERSION.SDK_INT < 33 && keyCode == KeyEvent.KEYCODE_BACK
                && activity() != null && activity().isOverlayBackBlocked()) {
            if (event.getAction() == KeyEvent.ACTION_UP && !event.isCanceled()) {
                activity().handleNativeBack();
            }
            return true;
        }
        return super.onKeyPreIme(keyCode, event);
    }
}
