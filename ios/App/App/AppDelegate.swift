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
    private var launchOverlay: NativeLaunchOverlayView?
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

        let overlay = NativeLaunchOverlayView(frame: container.bounds)
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        container.addSubview(overlay)
        launchOverlay = overlay
        overlay.startAnimation()
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in self?.hideLaunch() }
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
        guard let overlay = launchOverlay else { return }
        launchOverlay = nil
        overlay.dismiss {
            overlay.removeFromSuperview()
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

private final class NativeLaunchOverlayView: UIView {
    private let titleWidth: CGFloat = 248
    private let titleHeight: CGFloat = 91

    private let contentStack = UIStackView()
    private let logoImageView = UIImageView(image: UIImage(named: "LaunchLogo"))
    private let titleContainer = UIView()
    private let brushImageView = UIImageView(image: UIImage(named: "LaunchTitleBrush"))
    private let sealImageView = UIImageView(image: UIImage(named: "LaunchTitleSeal"))
    private let descriptionLabel = UILabel()
    private let phoneticsLabel = UILabel()
    private let versionLabel = UILabel()

    private var isDismissing = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        backgroundColor = UIColor(named: "LaunchBackground") ?? .systemBackground
        accessibilityElementsHidden = true

        contentStack.axis = .vertical
        contentStack.alignment = .center
        contentStack.spacing = 12
        contentStack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(contentStack)

        logoImageView.contentMode = .scaleAspectFit
        logoImageView.translatesAutoresizingMaskIntoConstraints = false
        contentStack.addArrangedSubview(logoImageView)
        contentStack.setCustomSpacing(14, after: logoImageView)

        titleContainer.translatesAutoresizingMaskIntoConstraints = false
        titleContainer.clipsToBounds = false
        brushImageView.contentMode = .scaleAspectFit
        brushImageView.translatesAutoresizingMaskIntoConstraints = false
        sealImageView.contentMode = .scaleAspectFit
        sealImageView.translatesAutoresizingMaskIntoConstraints = false
        titleContainer.addSubview(brushImageView)
        titleContainer.addSubview(sealImageView)
        contentStack.addArrangedSubview(titleContainer)
        contentStack.setCustomSpacing(12, after: titleContainer)

        let descriptionColor = UIColor(named: "LaunchDescription") ?? .secondaryLabel
        descriptionLabel.attributedText = NSAttributedString(
            string: Self.localizedDescription(),
            attributes: [
                .font: UIFont.systemFont(ofSize: 14),
                .foregroundColor: descriptionColor,
                .kern: 1.8
            ]
        )
        descriptionLabel.textAlignment = .center
        contentStack.addArrangedSubview(descriptionLabel)
        contentStack.setCustomSpacing(10, after: descriptionLabel)

        let serifDescriptor = UIFontDescriptor.preferredFontDescriptor(withTextStyle: .footnote)
            .withDesign(.serif) ?? UIFontDescriptor.preferredFontDescriptor(withTextStyle: .footnote)
        phoneticsLabel.attributedText = NSAttributedString(
            string: "攝 · 韻 · æ · ɔ · tʂʰ",
            attributes: [
                .font: UIFont(descriptor: serifDescriptor, size: 12),
                .foregroundColor: descriptionColor,
                .kern: 1.4
            ]
        )
        phoneticsLabel.alpha = 0.58
        phoneticsLabel.textAlignment = .center
        contentStack.addArrangedSubview(phoneticsLabel)

        versionLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 11, weight: .regular)
        versionLabel.textColor = descriptionColor
        versionLabel.alpha = 0.55
        versionLabel.textAlignment = .center
        versionLabel.text = Self.appVersionLabel()
        versionLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(versionLabel)

        NSLayoutConstraint.activate([
            contentStack.centerXAnchor.constraint(equalTo: centerXAnchor),
            contentStack.centerYAnchor.constraint(equalTo: centerYAnchor),
            contentStack.leadingAnchor.constraint(greaterThanOrEqualTo: leadingAnchor, constant: 24),
            contentStack.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor, constant: -24),

            logoImageView.widthAnchor.constraint(equalToConstant: 116),
            logoImageView.heightAnchor.constraint(equalToConstant: 116),

            titleContainer.widthAnchor.constraint(equalToConstant: titleWidth),
            titleContainer.heightAnchor.constraint(equalToConstant: titleHeight),

            brushImageView.topAnchor.constraint(equalTo: titleContainer.topAnchor),
            brushImageView.bottomAnchor.constraint(equalTo: titleContainer.bottomAnchor),
            brushImageView.leadingAnchor.constraint(equalTo: titleContainer.leadingAnchor),
            brushImageView.trailingAnchor.constraint(equalTo: titleContainer.trailingAnchor),

            sealImageView.topAnchor.constraint(equalTo: titleContainer.topAnchor),
            sealImageView.bottomAnchor.constraint(equalTo: titleContainer.bottomAnchor),
            sealImageView.leadingAnchor.constraint(equalTo: titleContainer.leadingAnchor),
            sealImageView.trailingAnchor.constraint(equalTo: titleContainer.trailingAnchor),

            versionLabel.centerXAnchor.constraint(equalTo: centerXAnchor),
            versionLabel.bottomAnchor.constraint(equalTo: safeAreaLayoutGuide.bottomAnchor, constant: -24)
        ])
    }

    func startAnimation() {
        guard !UIAccessibility.isReduceMotionEnabled else { return }

        // Start logo aligned with the centered LaunchScreen.storyboard, then ease into the full stack.
        contentStack.transform = CGAffineTransform(translationX: 0, y: 52)
        descriptionLabel.alpha = 0
        descriptionLabel.transform = CGAffineTransform(translationX: 0, y: 10)
        phoneticsLabel.alpha = 0
        phoneticsLabel.transform = CGAffineTransform(translationX: 0, y: 10)
        versionLabel.alpha = 0

        // Pivot seal stamp around its exact position (0.85, 0.19) inside the shared title canvas.
        let dx = titleWidth * 0.35
        let dy = -titleHeight * 0.31
        sealImageView.alpha = 0
        sealImageView.transform = CGAffineTransform(translationX: dx, y: dy)
            .scaledBy(x: 1.65, y: 1.65)
            .rotated(by: -10 * .pi / 180)
            .translatedBy(x: -dx, y: -dy)

        // Left-to-right ink brush reveal via CALayer mask.
        let maskLayer = CALayer()
        maskLayer.backgroundColor = UIColor.black.cgColor
        maskLayer.anchorPoint = CGPoint(x: 0, y: 0.5)
        maskLayer.position = CGPoint(x: 0, y: titleHeight / 2)
        maskLayer.bounds = CGRect(x: 0, y: 0, width: titleWidth, height: titleHeight)
        brushImageView.layer.mask = maskLayer

        let inkSweep = CABasicAnimation(keyPath: "bounds.size.width")
        inkSweep.fromValue = 0
        inkSweep.toValue = titleWidth
        inkSweep.beginTime = CACurrentMediaTime() + 0.10
        inkSweep.duration = 0.56
        inkSweep.fillMode = .backwards
        inkSweep.timingFunction = CAMediaTimingFunction(controlPoints: 0.22, 1.0, 0.36, 1.0)
        maskLayer.add(inkSweep, forKey: "inkSweep")

        let easeOut = UICubicTimingParameters(controlPoint1: CGPoint(x: 0.22, y: 1.0), controlPoint2: CGPoint(x: 0.36, y: 1.0))

        let stackAnimator = UIViewPropertyAnimator(duration: 0.34, timingParameters: easeOut)
        stackAnimator.addAnimations {
            self.contentStack.transform = .identity
        }
        stackAnimator.startAnimation()

        UIView.animate(
            withDuration: 0.42,
            delay: 0.46,
            usingSpringWithDamping: 0.58,
            initialSpringVelocity: 0.9,
            options: [.allowUserInteraction],
            animations: {
                self.sealImageView.alpha = 1
                self.sealImageView.transform = .identity
            }
        )

        let descAnimator = UIViewPropertyAnimator(duration: 0.34, timingParameters: easeOut)
        descAnimator.addAnimations {
            self.descriptionLabel.alpha = 1
            self.descriptionLabel.transform = .identity
        }
        descAnimator.startAnimation(afterDelay: 0.52)

        let versionAnimator = UIViewPropertyAnimator(duration: 0.32, timingParameters: easeOut)
        versionAnimator.addAnimations {
            self.versionLabel.alpha = 0.55
        }
        versionAnimator.startAnimation(afterDelay: 0.48)

        let phoneticsAnimator = UIViewPropertyAnimator(duration: 0.34, timingParameters: easeOut)
        phoneticsAnimator.addAnimations {
            self.phoneticsLabel.alpha = 0.62
            self.phoneticsLabel.transform = .identity
        }
        phoneticsAnimator.addCompletion { [weak self] _ in
            guard let self, !self.isDismissing else { return }
            UIView.animate(
                withDuration: 1.25,
                delay: 0,
                options: [.repeat, .autoreverse, .allowUserInteraction],
                animations: {
                    self.phoneticsLabel.alpha = 0.26
                }
            )
        }
        phoneticsAnimator.startAnimation(afterDelay: 0.64)
    }

    func dismiss(completion: @escaping () -> Void) {
        isDismissing = true
        phoneticsLabel.layer.removeAllAnimations()

        if UIAccessibility.isReduceMotionEnabled {
            UIView.animate(withDuration: 0.2, animations: {
                self.alpha = 0
            }, completion: { _ in
                completion()
            })
            return
        }

        let easeOut = UICubicTimingParameters(controlPoint1: CGPoint(x: 0.22, y: 1.0), controlPoint2: CGPoint(x: 0.36, y: 1.0))
        let exitAnimator = UIViewPropertyAnimator(duration: 0.36, timingParameters: easeOut)
        exitAnimator.addAnimations {
            self.contentStack.transform = CGAffineTransform(translationX: 0, y: -36).scaledBy(x: 0.94, y: 0.94)
            self.contentStack.alpha = 0
            self.alpha = 0
        }
        exitAnimator.addCompletion { _ in
            completion()
        }
        exitAnimator.startAnimation()
    }

    private static func localizedDescription() -> String {
        let preferred = Locale.preferredLanguages.first?.lowercased() ?? "en"
        if preferred.hasPrefix("zh-hant") || preferred.hasPrefix("zh-tw") || preferred.hasPrefix("zh-hk") || preferred.hasPrefix("zh-mo") {
            return "探索漢語方言"
        }
        if preferred.hasPrefix("zh") {
            return "探索汉语方言"
        }
        return "Explore Chinese dialects"
    }

    private static func appVersionLabel() -> String {
        guard let raw = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String, !raw.isEmpty else {
            return ""
        }
        return raw.hasPrefix("v") ? raw : "v\(raw)"
    }
}
