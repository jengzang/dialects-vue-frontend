package top.yzup.dialects;

import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

final class AppLaunchReporter {
    private AppLaunchReporter() {}

    static void send(String base) {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(base.replaceAll("/+$", "") + "/logs/visits/app-start");
            if (!"https".equals(url.getProtocol()) && !"http".equals(url.getProtocol())) return;
            connection = (HttpURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            byte[] body = "{\"platform\":\"android\"}".getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(body.length);
            try (java.io.OutputStream output = connection.getOutputStream()) { output.write(body); }
            connection.getResponseCode();
        } catch (Exception ignored) {
            // Best-effort reporting: no retries and no effect on the user.
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}
