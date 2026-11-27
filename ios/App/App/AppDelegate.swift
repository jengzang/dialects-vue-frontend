import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        AppLaunchReporter.report()
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        if url.isFileURL {
            do {
                try SharedAudioInbox.save(url)
                NotificationCenter.default.post(name: Notification.Name("DialectsAudioReceived"), object: nil)
                return true
            } catch {
                let alert = UIAlertController(title: "Audio import", message: error.localizedDescription, preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: "OK", style: .default))
                window?.rootViewController?.present(alert, animated: true)
                return false
            }
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// Enable WebKit history gestures, including Vue Router pushState entries.
class DialectsBridgeViewController: CAPBridgeViewController {
    private var launchController: UIViewController?
    private var dialectMapHost: DialectAppleMapHost?
    private var overlayBlocked = false
    private var keyboardVisible = false
    private var overlayBackGesture: UIScreenEdgePanGestureRecognizer?
    private var safeAreaConstraints: [NSLayoutConstraint] = []
    private var edgeToEdgeConstraints: [NSLayoutConstraint] = []
    private var edgeToEdge = false
    private var prefersLightStatusBar: Bool?

    override var preferredStatusBarStyle: UIStatusBarStyle {
        guard let prefersLightStatusBar else { return super.preferredStatusBarStyle }
        return prefersLightStatusBar ? .lightContent : .darkContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let webView = webView else { return }

        // Keep non-home pages clear of system safe areas, while allowing the homepage to opt into full edge-to-edge.
        let container = UIView()
        container.backgroundColor = .systemBackground
        view = container
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        container.addSubview(webView)
        let safeArea = container.safeAreaLayoutGuide
        safeAreaConstraints = [
            webView.topAnchor.constraint(equalTo: safeArea.topAnchor),
            webView.bottomAnchor.constraint(equalTo: safeArea.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: safeArea.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: safeArea.trailingAnchor)
        ]
        edgeToEdgeConstraints = [
            webView.topAnchor.constraint(equalTo: container.topAnchor),
            webView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor)
        ]
        NSLayoutConstraint.activate(safeAreaConstraints)

        if let launch = UIStoryboard(name: "LaunchScreen", bundle: nil).instantiateInitialViewController() {
            launchController = launch
            addChild(launch)
            launch.view.frame = container.bounds
            launch.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            container.addSubview(launch.view)
            launch.didMove(toParent: self)
            DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in self?.hideLaunch() }
        }
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(DialectsNativePlugin())
        webView?.allowsBackForwardNavigationGestures = true
        let gesture = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(handleOverlayBack(_:)))
        gesture.edges = .left
        gesture.isEnabled = false
        webView?.addGestureRecognizer(gesture)
        overlayBackGesture = gesture
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardShown),
            name: UIResponder.keyboardDidShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardHidden),
            name: UIResponder.keyboardDidHideNotification, object: nil)
    }

    func hideLaunch() {
        guard let launch = launchController else { return }
        launchController = nil
        launch.willMove(toParent: nil)
        UIView.animate(withDuration: 0.18, animations: { launch.view.alpha = 0 }) { _ in
            launch.view.removeFromSuperview()
            launch.removeFromParent()
        }
    }

    func setOverlayBlocked(_ blocked: Bool) {
        overlayBlocked = blocked
        dialectMapHost?.setOverlayBlocked(blocked)
        updateBackGestures()
    }

    func setSystemChrome(edgeToEdge: Bool?, backgroundColorHex: String?, isDark: Bool?) {
        if let edgeToEdge, edgeToEdge != self.edgeToEdge, !safeAreaConstraints.isEmpty {
            self.edgeToEdge = edgeToEdge
            if edgeToEdge {
                NSLayoutConstraint.deactivate(safeAreaConstraints)
                NSLayoutConstraint.activate(edgeToEdgeConstraints)
            } else {
                NSLayoutConstraint.deactivate(edgeToEdgeConstraints)
                NSLayoutConstraint.activate(safeAreaConstraints)
            }
            view.layoutIfNeeded()
        }

        if let hex = backgroundColorHex, let color = Self.parseHexColor(hex) {
            view.backgroundColor = color
            webView?.backgroundColor = color
            webView?.scrollView.backgroundColor = color
        }

        if let isDark {
            prefersLightStatusBar = isDark
            overrideUserInterfaceStyle = isDark ? .dark : .light
            setNeedsStatusBarAppearanceUpdate()
        }
    }

    private static func parseHexColor(_ hex: String) -> UIColor? {
        var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.hasPrefix("#") { cleaned.removeFirst() }
        if cleaned.count == 3 {
            cleaned = cleaned.map { "\($0)\($0)" }.joined()
        }
        guard cleaned.count == 6, let value = UInt64(cleaned, radix: 16) else { return nil }
        return UIColor(
            red: CGFloat((value >> 16) & 0xFF) / 255.0,
            green: CGFloat((value >> 8) & 0xFF) / 255.0,
            blue: CGFloat(value & 0xFF) / 255.0,
            alpha: 1.0
        )
    }

    func mountDialectMap(
        points: [DialectMapPoint],
        style: DialectMapStyleConfig,
        frame: CGRect,
        fullscreen: Bool,
        onExitFullscreen: @escaping () -> Void
    ) {
        guard let webView else { return }
        if dialectMapHost == nil {
            dialectMapHost = DialectAppleMapHost(parentController: self, webView: webView)
        }
        dialectMapHost?.setOverlayBlocked(overlayBlocked)
        dialectMapHost?.mount(
            points: points,
            style: style,
            frame: frame,
            fullscreen: fullscreen,
            onExitFullscreen: onExitFullscreen
        )
    }

    func updateDialectMap(
        points: [DialectMapPoint]?,
        style: DialectMapStyleConfig?,
        frame: CGRect?,
        fullscreen: Bool?
    ) {
        dialectMapHost?.update(points: points, style: style, frame: frame, fullscreen: fullscreen)
    }

    func unmountDialectMap() {
        dialectMapHost?.unmount()
    }

    @objc private func keyboardShown() { keyboardVisible = true; updateBackGestures() }
    @objc private func keyboardHidden() { keyboardVisible = false; updateBackGestures() }

    private func updateBackGestures() {
        let blocked = overlayBlocked || keyboardVisible
        webView?.allowsBackForwardNavigationGestures = !blocked
        overlayBackGesture?.isEnabled = blocked
    }

    @objc private func handleOverlayBack(_ gesture: UIScreenEdgePanGestureRecognizer) {
        guard gesture.state == .ended, gesture.translation(in: webView).x > 40 else { return }
        webView?.evaluateJavaScript("Boolean(window.__dialectsHandleBack && window.__dialectsHandleBack())") { [weak self] handled, _ in
            if (handled as? Bool) != true { self?.view.endEditing(true) }
        }
    }

    deinit { NotificationCenter.default.removeObserver(self) }
}
