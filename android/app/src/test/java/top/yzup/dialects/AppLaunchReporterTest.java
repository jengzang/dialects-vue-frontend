package top.yzup.dialects;

import org.junit.Test;
import static org.junit.Assert.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class AppLaunchReporterTest {
    @Test public void postsLaunchToConfiguredBackend() throws Exception {
        try (ServerSocket server = new ServerSocket(0)) {
            server.setSoTimeout(4000);
            Thread sender = new Thread(() -> AppLaunchReporter.send("http://127.0.0.1:" + server.getLocalPort()));
            sender.start();
            try (Socket socket = server.accept()) {
                socket.setSoTimeout(3000);
                BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                assertEquals("POST /logs/visits/app-start HTTP/1.1", reader.readLine());
                String line;
                int contentLength = 0;
                while (!(line = reader.readLine()).isEmpty()) {
                    if (line.toLowerCase().startsWith("content-length:")) contentLength = Integer.parseInt(line.substring(line.indexOf(':') + 1).trim());
                }
                char[] body = new char[contentLength];
                int count = 0;
                while (count < body.length) count += reader.read(body, count, body.length - count);
                assertEquals("{\"platform\":\"android\"}", new String(body));
                socket.getOutputStream().write("HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n".getBytes(StandardCharsets.UTF_8));
            }
            sender.join(4000);
            assertFalse(sender.isAlive());
        }
    }
}
