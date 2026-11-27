import Foundation
import UniformTypeIdentifiers

enum SharedAudioInbox {
    static let group = "group.top.yzup.dialects"
    static let maxBytes = 5 * 1024 * 1024

    static func directory() throws -> URL {
        guard let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group) else {
            throw NSError(domain: "SharedAudio", code: 1, userInfo: [NSLocalizedDescriptionKey: "Shared audio storage is unavailable."])
        }
        let directory = container.appendingPathComponent("SharedAudio", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }

    static func save(_ source: URL) throws {
        let accessing = source.startAccessingSecurityScopedResource()
        defer { if accessing { source.stopAccessingSecurityScopedResource() } }
        let type = UTType(filenameExtension: source.pathExtension)
        guard type?.conforms(to: .audio) == true else {
            throw NSError(domain: "SharedAudio", code: 2, userInfo: [NSLocalizedDescriptionKey: "Please select an audio file."])
        }
        let size = try source.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        guard size > 0 && size <= maxBytes else {
            throw NSError(domain: "SharedAudio", code: 3, userInfo: [NSLocalizedDescriptionKey: "Audio must be between 1 byte and 5 MB."])
        }
        let id = "\(Int(Date().timeIntervalSince1970 * 1000))-\(UUID().uuidString)"
        let folder = try directory()
        let destination = folder.appendingPathComponent(id + ".audio")
        try FileManager.default.copyItem(at: source, to: destination)
        do {
            let metadata: [String: String] = [
                "id": id, "name": source.lastPathComponent,
                "mime": type?.preferredMIMEType ?? "audio/wav"
            ]
            try JSONSerialization.data(withJSONObject: metadata)
                .write(to: folder.appendingPathComponent(id + ".json"), options: .atomic)
        } catch {
            try? FileManager.default.removeItem(at: destination)
            throw error
        }
    }

    static func pending() throws -> [String: Any] {
        let folder = try directory()
        let entries = try FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)
            .filter { $0.pathExtension == "json" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
        guard let entry = entries.first,
              var result = try JSONSerialization.jsonObject(with: Data(contentsOf: entry)) as? [String: Any],
              let id = result["id"] as? String else { return [:] }
        result["base64"] = try Data(contentsOf: folder.appendingPathComponent(id + ".audio")).base64EncodedString()
        return result
    }

    static func consume(_ id: String) throws {
        guard id.range(of: "^[0-9]+-[A-Fa-f0-9-]+$", options: .regularExpression) != nil else { return }
        let folder = try directory()
        try? FileManager.default.removeItem(at: folder.appendingPathComponent(id + ".audio"))
        try? FileManager.default.removeItem(at: folder.appendingPathComponent(id + ".json"))
    }
}
