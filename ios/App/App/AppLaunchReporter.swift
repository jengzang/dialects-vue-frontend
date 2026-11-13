import Foundation

enum AppLaunchReporter {
    static func request(config: Data) -> URLRequest? {
        guard let object = try? JSONSerialization.jsonObject(with: config) as? [String: Any],
              let base = object["webBase"] as? String,
              let url = URL(string: base.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/logs/visits/app-start"),
              ["https", "http"].contains(url.scheme?.lowercased() ?? ""), url.host != nil else { return nil }
        var request = URLRequest(url: url, timeoutInterval: 5)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["platform": "ios"])
        return request
    }

    static func report() {
        guard let url = Bundle.main.url(forResource: "native-launch-config", withExtension: "json", subdirectory: "public"),
              let config = try? Data(contentsOf: url), let request = request(config: config) else { return }
        URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
    }
}
