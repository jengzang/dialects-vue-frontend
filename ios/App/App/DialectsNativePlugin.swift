import Capacitor
import UIKit

@objc(DialectsNativePlugin)
public class DialectsNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DialectsNativePlugin"
    public let jsName = "DialectsNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "hideLaunch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPendingAudio", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "consumeAudio", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setBackBlocked", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSystemChrome", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "mountDialectMap", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateDialectMap", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setDialectMapFrame", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unmountDialectMap", returnType: CAPPluginReturnPromise)
    ]

    public override func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(audioAvailable),
            name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(audioAvailable),
            name: Notification.Name("DialectsAudioReceived"), object: nil)
    }

    @objc private func audioAvailable() {
        notifyListeners("audioReceived", data: [:], retainUntilConsumed: true)
    }

    @objc func hideLaunch(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            (self.bridge?.viewController as? DialectsBridgeViewController)?.hideLaunch()
            call.resolve()
        }
    }

    @objc func getPendingAudio(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .userInitiated).async {
            do { call.resolve(try SharedAudioInbox.pending()) }
            catch { call.reject(error.localizedDescription) }
        }
    }

    @objc func setBackBlocked(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            (self.bridge?.viewController as? DialectsBridgeViewController)?.setOverlayBlocked(call.getBool("blocked") ?? false)
            call.resolve()
        }
    }

    @objc func setSystemChrome(_ call: CAPPluginCall) {
        let edgeToEdge = call.getBool("edgeToEdge")
        let backgroundColor = call.getString("backgroundColor")
        let isDark = call.getBool("isDark")
        DispatchQueue.main.async {
            (self.bridge?.viewController as? DialectsBridgeViewController)?.setSystemChrome(
                edgeToEdge: edgeToEdge,
                backgroundColorHex: backgroundColor,
                isDark: isDark
            )
            call.resolve()
        }
    }

    @objc func consumeAudio(_ call: CAPPluginCall) {
        do { try SharedAudioInbox.consume(call.getString("id") ?? ""); call.resolve() }
        catch { call.reject(error.localizedDescription) }
    }

    @objc func mountDialectMap(_ call: CAPPluginCall) {
        let points = parseDialectPoints(call.getArray("points") as? [[String: Any]] ?? [])
        let style = parseDialectStyle(call.getObject("style"))
        let frame = parseRect(call.getObject("frame"))
        let fullscreen = call.getBool("fullscreen") ?? false

        DispatchQueue.main.async {
            (self.bridge?.viewController as? DialectsBridgeViewController)?.mountDialectMap(
                points: points,
                style: style,
                frame: frame,
                fullscreen: fullscreen,
                onExitFullscreen: { [weak self] in
                    self?.notifyListeners("dialectMapExitFullscreen", data: [:])
                }
            )
            call.resolve()
        }
    }

    @objc func updateDialectMap(_ call: CAPPluginCall) {
        let rawPoints = call.getArray("points") as? [[String: Any]]
        let points = rawPoints.map { parseDialectPoints($0) }
        let style = call.getObject("style").map { parseDialectStyle($0) }
        let frame = call.getObject("frame").map { parseRect($0) }
        let fullscreen = call.getBool("fullscreen")

        DispatchQueue.main.async {
            (self.bridge?.viewController as? DialectsBridgeViewController)?.updateDialectMap(
                points: points,
                style: style,
                frame: frame,
                fullscreen: fullscreen
            )
            call.resolve()
        }
    }

    @objc func setDialectMapFrame(_ call: CAPPluginCall) {
        let frame = parseRect(call.getObject("frame"))
        let fullscreen = call.getBool("fullscreen")

        DispatchQueue.main.async {
            (self.bridge?.viewController as? DialectsBridgeViewController)?.updateDialectMap(
                points: nil,
                style: nil,
                frame: frame,
                fullscreen: fullscreen
            )
            call.resolve()
        }
    }

    @objc func unmountDialectMap(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            (self.bridge?.viewController as? DialectsBridgeViewController)?.unmountDialectMap()
            call.resolve()
        }
    }

    private func parseDialectPoints(_ items: [[String: Any]]) -> [DialectMapPoint] {
        var result: [DialectMapPoint] = []
        result.reserveCapacity(items.count)
        for (index, item) in items.enumerated() {
            guard let lon = (item["longitude"] as? NSNumber)?.doubleValue,
                  let lat = (item["latitude"] as? NSNumber)?.doubleValue,
                  lon.isFinite, lat.isFinite
            else { continue }
            let name = (item["locationName"] as? String) ?? "-"
            let count = (item["entryCount"] as? String) ?? String((item["entryCount"] as? NSNumber)?.intValue ?? 0)
            let color = (item["color"] as? String) ?? "#2563eb"
            let transitionColor = item["transitionColor"] as? String
            result.append(
                DialectMapPoint(
                    index: index,
                    longitude: lon,
                    latitude: lat,
                    locationName: name,
                    entryCount: count,
                    colorHex: color,
                    transitionColorHex: transitionColor
                )
            )
        }
        return result
    }

    private func parseDialectStyle(_ dict: [String: Any]?) -> DialectMapStyleConfig {
        guard let dict else { return .default }
        func num(_ key: String, fallback: CGFloat) -> CGFloat {
            CGFloat((dict[key] as? NSNumber)?.doubleValue ?? Double(fallback))
        }
        return DialectMapStyleConfig(
            nameFontSize: num("nameFontSize", fallback: DialectMapStyleConfig.default.nameFontSize),
            countFontSize: num("countFontSize", fallback: DialectMapStyleConfig.default.countFontSize),
            paddingX: num("paddingX", fallback: DialectMapStyleConfig.default.paddingX),
            paddingY: num("paddingY", fallback: DialectMapStyleConfig.default.paddingY),
            borderWidth: num("borderWidth", fallback: DialectMapStyleConfig.default.borderWidth),
            gap: num("gap", fallback: DialectMapStyleConfig.default.gap),
            cornerRadius: num("cornerRadius", fallback: DialectMapStyleConfig.default.cornerRadius),
            isDark: (dict["isDark"] as? Bool) ?? false
        )
    }

    private func parseRect(_ dict: [String: Any]?) -> CGRect {
        guard let dict else { return .zero }
        let x = CGFloat((dict["x"] as? NSNumber)?.doubleValue ?? 0)
        let y = CGFloat((dict["y"] as? NSNumber)?.doubleValue ?? 0)
        let width = CGFloat((dict["width"] as? NSNumber)?.doubleValue ?? 0)
        let height = CGFloat((dict["height"] as? NSNumber)?.doubleValue ?? 0)
        return CGRect(x: x, y: y, width: max(0, width), height: max(0, height))
    }

    deinit { NotificationCenter.default.removeObserver(self) }
}
