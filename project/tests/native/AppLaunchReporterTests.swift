import Foundation

@main
struct AppLaunchReporterTests {
    static func main() throws {
        let config = Data(#"{"webBase":"https://example.test/base"}"#.utf8)
        guard let request = AppLaunchReporter.request(config: config) else { fatalError("missing request") }
        precondition(request.url?.absoluteString == "https://example.test/base/logs/visits/app-start")
        precondition(request.httpMethod == "POST")
        let body = try JSONSerialization.jsonObject(with: request.httpBody!) as? [String: String]
        precondition(body == ["platform": "ios"])
        precondition(AppLaunchReporter.request(config: Data("{}".utf8)) == nil)
        print("AppLaunchReporter tests passed")
    }
}
