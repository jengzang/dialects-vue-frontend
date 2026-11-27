package top.yzup.dialects;

import android.app.Application;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

public class DialectsApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        new Thread(() -> {
            try (InputStream input = getAssets().open("public/native-launch-config.json")) {
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                byte[] buffer = new byte[1024];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                String base = new JSONObject(output.toString(StandardCharsets.UTF_8.name())).getString("webBase");
                AppLaunchReporter.send(base);
            } catch (Exception ignored) {
                // An unavailable config or network must not affect app startup.
            }
        }, "app-launch-report").start();
    }
}
