package top.yzup.dialects;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.widget.Toast;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.*;
import java.util.Arrays;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "DialectsNative")
public class DialectsNativePlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private static final int MAX_BYTES = 5 * 1024 * 1024;

    private File inbox() {
        File directory = new File(getContext().getCacheDir(), "shared-audio");
        directory.mkdirs();
        return directory;
    }

    @Override public void load() {
        receiveAudio(getActivity().getIntent());
    }

    @Override protected void handleOnNewIntent(Intent intent) {
        receiveAudio(intent);
    }

    private void receiveAudio(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri uri = Intent.ACTION_SEND.equals(action)
            ? intent.getParcelableExtra(Intent.EXTRA_STREAM)
            : Intent.ACTION_VIEW.equals(action) ? intent.getData() : null;
        if (uri == null || !"content".equals(uri.getScheme())) return;
        String mime = getContext().getContentResolver().getType(uri);
        if (mime == null || !mime.startsWith("audio/")) return;
        // Do not replay the same launch intent after activity recreation.
        intent.removeExtra(Intent.EXTRA_STREAM);
        intent.setData(null);
        worker.execute(() -> {
            File destination = null;
            try {
                String name = "recording";
                try (Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null)) {
                    if (cursor != null && cursor.moveToFirst()) {
                        int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                        if (index >= 0) name = cursor.getString(index);
                    }
                }
                String id = System.currentTimeMillis() + "-" + UUID.randomUUID();
                destination = new File(inbox(), id + ".audio");
                int total = 0;
                try (InputStream input = getContext().getContentResolver().openInputStream(uri);
                     OutputStream output = new FileOutputStream(destination)) {
                    if (input == null) throw new IOException("Audio is unavailable");
                    byte[] buffer = new byte[8192];
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        total += count;
                        if (total > MAX_BYTES) throw new IOException("Audio exceeds 5 MB");
                        output.write(buffer, 0, count);
                    }
                }
                if (total == 0) throw new IOException("Audio is empty");
                JSObject metadata = new JSObject().put("id", id).put("name", name).put("mime", mime);
                try (Writer writer = new FileWriter(new File(inbox(), id + ".json"))) {
                    writer.write(metadata.toString());
                }
                getActivity().runOnUiThread(() -> notifyListeners("audioReceived", new JSObject(), true));
            } catch (Exception error) {
                if (destination != null) destination.delete();
                getActivity().runOnUiThread(() ->
                    Toast.makeText(getContext(), "Cannot import audio (maximum 5 MB).", Toast.LENGTH_LONG).show());
            }
        });
    }

    private byte[] readBytes(File file) throws IOException {
        try (InputStream input = new FileInputStream(file);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return output.toByteArray();
        }
    }

    @PluginMethod public void getPendingAudio(PluginCall call) {
        worker.execute(() -> {
            try {
                File[] entries = inbox().listFiles((dir, name) -> name.endsWith(".json"));
                if (entries == null || entries.length == 0) { call.resolve(new JSObject()); return; }
                Arrays.sort(entries);
                JSObject metadata = new JSObject(new String(readBytes(entries[0]), java.nio.charset.StandardCharsets.UTF_8));
                File audio = new File(inbox(), metadata.getString("id") + ".audio");
                metadata.put("base64", Base64.encodeToString(readBytes(audio), Base64.NO_WRAP));
                call.resolve(metadata);
            } catch (Exception error) { call.reject("Cannot read shared audio", error); }
        });
    }

    @PluginMethod public void setBackBlocked(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            ((MainActivity) getActivity()).setOverlayBackBlocked(call.getBoolean("blocked", false));
            call.resolve();
        });
    }

    @PluginMethod public void consumeAudio(PluginCall call) {
        String id = call.getString("id", "");
        if (!id.matches("[0-9]+-[a-f0-9-]+")) { call.reject("Invalid audio ID"); return; }
        new File(inbox(), id + ".audio").delete();
        new File(inbox(), id + ".json").delete();
        call.resolve();
    }
}
