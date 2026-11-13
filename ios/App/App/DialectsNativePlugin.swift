import Capacitor
import UIKit

@objc(DialectsNativePlugin)
public class DialectsNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DialectsNativePlugin"
    public let jsName = "DialectsNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getPendingAudio", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "consumeAudio", returnType: CAPPluginReturnPromise)
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

    @objc func getPendingAudio(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .userInitiated).async {
            do { call.resolve(try SharedAudioInbox.pending()) }
            catch { call.reject(error.localizedDescription) }
        }
    }

    @objc func consumeAudio(_ call: CAPPluginCall) {
        do { try SharedAudioInbox.consume(call.getString("id") ?? ""); call.resolve() }
        catch { call.reject(error.localizedDescription) }
    }

    deinit { NotificationCenter.default.removeObserver(self) }
}
