import CoreLocation
import MapKit
import SwiftUI
import UIKit
import WebKit

// MARK: - Data Models

struct DialectMapPoint: Equatable {
    let index: Int
    let longitude: Double
    let latitude: Double
    let locationName: String
    let entryCount: String
    let colorHex: String
    let transitionColorHex: String?
    let coordinate: CLLocationCoordinate2D

    init(
        index: Int,
        longitude: Double,
        latitude: Double,
        locationName: String,
        entryCount: String,
        colorHex: String,
        transitionColorHex: String?
    ) {
        self.index = index
        self.longitude = longitude
        self.latitude = latitude
        self.locationName = locationName
        self.entryCount = entryCount
        self.colorHex = colorHex
        self.transitionColorHex = transitionColorHex
        self.coordinate = DialectCoordinateTransform.wgs84ToGcj02(
            latitude: latitude,
            longitude: longitude
        )
    }

    static func == (lhs: DialectMapPoint, rhs: DialectMapPoint) -> Bool {
        lhs.index == rhs.index
            && lhs.longitude == rhs.longitude
            && lhs.latitude == rhs.latitude
            && lhs.locationName == rhs.locationName
            && lhs.entryCount == rhs.entryCount
            && lhs.colorHex == rhs.colorHex
            && lhs.transitionColorHex == rhs.transitionColorHex
    }
}

struct DialectMapStyleConfig: Equatable {
    let nameFontSize: CGFloat
    let countFontSize: CGFloat
    let paddingX: CGFloat
    let paddingY: CGFloat
    let borderWidth: CGFloat
    let gap: CGFloat
    let cornerRadius: CGFloat
    let isDark: Bool

    static let `default` = DialectMapStyleConfig(
        nameFontSize: 10,
        countFontSize: 8,
        paddingX: 6,
        paddingY: 3,
        borderWidth: 1,
        gap: 2,
        cornerRadius: 12,
        isDark: false
    )
}

struct DialectMapCameraSnapshot {
    var center: CLLocationCoordinate2D
    var zoom: Double
    var pitch: CGFloat
    var heading: CLLocationDirection

    static let defaultChina = DialectMapCameraSnapshot(
        center: DialectCoordinateTransform.wgs84ToGcj02(latitude: 30.6, longitude: 114.3),
        zoom: 3.5,
        pitch: 0,
        heading: 0
    )
}

enum DialectMapZoomTier: String {
    case dots
    case count
    case full
}

// MARK: - WGS-84 to GCJ-02 (China Mainland Only)

private enum DialectCoordinateTransform {
    private static let a: Double = 6378245.0
    private static let ee: Double = 0.00669342162296594323

    static func isOutOfChina(latitude: Double, longitude: Double) -> Bool {
        longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271
    }

    static func wgs84ToGcj02(latitude: Double, longitude: Double) -> CLLocationCoordinate2D {
        guard !isOutOfChina(latitude: latitude, longitude: longitude) else {
            return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        }
        var dLat = transformLat(x: longitude - 105.0, y: latitude - 35.0)
        var dLon = transformLon(x: longitude - 105.0, y: latitude - 35.0)
        let radLat = latitude / 180.0 * .pi
        var magic = sin(radLat)
        magic = 1.0 - ee * magic * magic
        let sqrtMagic = sqrt(magic)
        dLat = (dLat * 180.0) / ((a * (1.0 - ee)) / (magic * sqrtMagic) * .pi)
        dLon = (dLon * 180.0) / (a / sqrtMagic * cos(radLat) * .pi)
        return CLLocationCoordinate2D(latitude: latitude + dLat, longitude: longitude + dLon)
    }

    private static func transformLat(x: Double, y: Double) -> Double {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * sqrt(abs(x))
        ret += (20.0 * sin(6.0 * x * .pi) + 20.0 * sin(2.0 * x * .pi)) * 2.0 / 3.0
        ret += (20.0 * sin(y * .pi) + 40.0 * sin(y / 3.0 * .pi)) * 2.0 / 3.0
        ret += (160.0 * sin(y / 12.0 * .pi) + 320.0 * sin(y * .pi / 30.0)) * 2.0 / 3.0
        return ret
    }

    private static func transformLon(x: Double, y: Double) -> Double {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * sqrt(abs(x))
        ret += (20.0 * sin(6.0 * x * .pi) + 20.0 * sin(2.0 * x * .pi)) * 2.0 / 3.0
        ret += (20.0 * sin(x * .pi) + 40.0 * sin(x / 3.0 * .pi)) * 2.0 / 3.0
        ret += (150.0 * sin(x / 12.0 * .pi) + 300.0 * sin(x / 30.0 * .pi)) * 2.0 / 3.0
        return ret
    }
}

// MARK: - Color & Sprite Rendering Helpers

private enum DialectSpriteRenderer {
    static func color(from hex: String) -> UIColor {
        var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.hasPrefix("#") { cleaned.removeFirst() }
        if cleaned.count == 3 {
            cleaned = cleaned.map { "\($0)\($0)" }.joined()
        }
        guard cleaned.count == 6, let value = UInt64(cleaned, radix: 16) else {
            return UIColor.systemBlue
        }
        let r = CGFloat((value >> 16) & 0xFF) / 255.0
        let g = CGFloat((value >> 8) & 0xFF) / 255.0
        let b = CGFloat(value & 0xFF) / 255.0
        return UIColor(red: r, green: g, blue: b, alpha: 1.0)
    }

    static func contrastTextColor(for hex: String) -> UIColor {
        let uiColor = color(from: hex)
        var r: CGFloat = 0
        var g: CGFloat = 0
        var b: CGFloat = 0
        var a: CGFloat = 0
        uiColor.getRed(&r, green: &g, blue: &b, alpha: &a)

        func linear(_ c: CGFloat) -> Double {
            let v = Double(c)
            return v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4)
        }
        let luminance = linear(r) * 0.2126 + linear(g) * 0.7152 + linear(b) * 0.0722
        return luminance > 0.179 ? .black : .white
    }

    static func renderDotImage(colorHex: String, scale: CGFloat) -> UIImage {
        let size = CGSize(width: 8, height: 8)
        let format = UIGraphicsImageRendererFormat()
        format.scale = scale
        format.opaque = false
        let renderer = UIGraphicsImageRenderer(size: size, format: format)
        return renderer.image { ctx in
            let rect = CGRect(x: 1, y: 1, width: 6, height: 6)
            color(from: colorHex).setFill()
            ctx.cgContext.fillEllipse(in: rect)
        }
    }

    struct LabelMetrics {
        let key: String
        let tier: DialectMapZoomTier
        let name: String
        let count: String
        let colorHex: String
        let transitionColorHex: String?
        let nameWidth: CGFloat
        let nameHeight: CGFloat
        let width: CGFloat
        let height: CGFloat
        let countLine: CGFloat
        let gap: CGFloat
    }

    static func measureLabel(
        point: DialectMapPoint,
        tier: DialectMapZoomTier,
        style: DialectMapStyleConfig
    ) -> LabelMetrics {
        let nameFont = UIFont.systemFont(ofSize: style.nameFontSize, weight: .regular)
        let countFont = UIFont.systemFont(ofSize: style.countFontSize, weight: .bold)

        let nameAttrs: [NSAttributedString.Key: Any] = [.font: nameFont]
        let countAttrs: [NSAttributedString.Key: Any] = [.font: countFont]

        let nameTextWidth = ceil((point.locationName as NSString).size(withAttributes: nameAttrs).width)
        let countTextWidth = ceil((point.entryCount as NSString).size(withAttributes: countAttrs).width)

        let nameWidth = nameTextWidth + 2 * (style.paddingX + style.borderWidth)
        let countWidth = countTextWidth + 2 * style.paddingX
        let nameLine = style.nameFontSize * 1.2
        let countLine = style.countFontSize
        let nameHeight = nameLine + 2 * (style.paddingY + style.borderWidth)

        let width = tier == .count ? countWidth : max(nameWidth, countWidth)
        let height = tier == .count ? nameHeight : (nameHeight + style.gap + countLine)

        let key = tier == .count
            ? "count|\(point.entryCount)|\(point.colorHex)|\(point.transitionColorHex ?? "")"
            : "full|\(point.locationName)|\(point.entryCount)|\(point.colorHex)|\(point.transitionColorHex ?? "")"

        return LabelMetrics(
            key: key,
            tier: tier,
            name: point.locationName,
            count: point.entryCount,
            colorHex: point.colorHex,
            transitionColorHex: point.transitionColorHex,
            nameWidth: nameWidth,
            nameHeight: nameHeight,
            width: width,
            height: height,
            countLine: countLine,
            gap: style.gap
        )
    }

    static func renderLabelImage(
        metrics: LabelMetrics,
        style: DialectMapStyleConfig,
        scale: CGFloat
    ) -> UIImage {
        let margin: CGFloat = 4
        let canvasSize = CGSize(
            width: max(1, ceil(metrics.width + margin * 2)),
            height: max(1, ceil(metrics.height + margin * 2))
        )
        let format = UIGraphicsImageRendererFormat()
        format.scale = scale
        format.opaque = false

        let nameFont = UIFont.systemFont(ofSize: style.nameFontSize, weight: .regular)
        let countFont = UIFont.systemFont(ofSize: style.countFontSize, weight: .bold)
        let primary = color(from: metrics.colorHex)
        let transition = metrics.transitionColorHex.flatMap { $0.isEmpty ? nil : color(from: $0) }
        let contrastColor = contrastTextColor(for: metrics.colorHex)

        let renderer = UIGraphicsImageRenderer(size: canvasSize, format: format)
        return renderer.image { ctx in
            let cg = ctx.cgContext
            let centerX = margin + metrics.width / 2

            func fillShape(in rect: CGRect, isEllipse: Bool) {
                cg.saveGState()
                let path = isEllipse ? CGPath(ellipseIn: rect, transform: nil) : CGPath(rect: rect, transform: nil)
                cg.addPath(path)
                cg.clip()
                if let transition {
                    let colors = [primary.cgColor, primary.cgColor, transition.cgColor] as CFArray
                    let locations: [CGFloat] = [0.0, 0.6, 1.0]
                    if let gradient = CGGradient(
                        colorsSpace: CGColorSpaceCreateDeviceRGB(),
                        colors: colors,
                        locations: locations
                    ) {
                        cg.drawLinearGradient(
                            gradient,
                            start: CGPoint(x: rect.minX, y: rect.midY),
                            end: CGPoint(x: rect.maxX, y: rect.midY),
                            options: []
                        )
                    }
                } else {
                    cg.setFillColor(primary.cgColor)
                    cg.fill(rect)
                }
                cg.restoreGState()
            }

            if metrics.tier == .count {
                let ellipseRect = CGRect(
                    x: centerX - metrics.width / 2,
                    y: margin,
                    width: metrics.width,
                    height: metrics.nameHeight
                )
                fillShape(in: ellipseRect, isEllipse: true)

                let countAttrs: [NSAttributedString.Key: Any] = [
                    .font: countFont,
                    .foregroundColor: contrastColor,
                ]
                let textSize = (metrics.count as NSString).size(withAttributes: countAttrs)
                let textRect = CGRect(
                    x: ellipseRect.midX - textSize.width / 2,
                    y: ellipseRect.midY - textSize.height / 2,
                    width: textSize.width,
                    height: textSize.height
                )
                (metrics.count as NSString).draw(in: textRect, withAttributes: countAttrs)
            } else {
                let badgeRect = CGRect(
                    x: centerX - metrics.nameWidth / 2,
                    y: margin,
                    width: metrics.nameWidth,
                    height: metrics.nameHeight
                )
                fillShape(in: badgeRect, isEllipse: false)

                let nameAttrs: [NSAttributedString.Key: Any] = [
                    .font: nameFont,
                    .foregroundColor: contrastColor,
                ]
                let nameSize = (metrics.name as NSString).size(withAttributes: nameAttrs)
                let nameRect = CGRect(
                    x: badgeRect.midX - nameSize.width / 2,
                    y: badgeRect.midY - nameSize.height / 2,
                    width: nameSize.width,
                    height: nameSize.height
                )
                (metrics.name as NSString).draw(in: nameRect, withAttributes: nameAttrs)

                let shadow = NSShadow()
                shadow.shadowColor = style.isDark
                    ? UIColor.black.withAlphaComponent(0.85)
                    : UIColor.white.withAlphaComponent(0.9)
                shadow.shadowOffset = CGSize(width: 0, height: 1)
                shadow.shadowBlurRadius = 2
                let countAttrs: [NSAttributedString.Key: Any] = [
                    .font: countFont,
                    .foregroundColor: style.isDark ? UIColor.white : UIColor.black,
                    .shadow: shadow,
                ]
                let countSize = (metrics.count as NSString).size(withAttributes: countAttrs)
                let countCenterY = margin + metrics.nameHeight + metrics.gap + metrics.countLine / 2
                let countRect = CGRect(
                    x: centerX - countSize.width / 2,
                    y: countCenterY - countSize.height / 2,
                    width: countSize.width,
                    height: countSize.height
                )
                (metrics.count as NSString).draw(in: countRect, withAttributes: countAttrs)
            }
        }
    }
}

// MARK: - Map Annotation

private final class DialectPointAnnotation: NSObject, MKAnnotation {
    let point: DialectMapPoint
    let imageKey: String
    dynamic var coordinate: CLLocationCoordinate2D

    init(point: DialectMapPoint, imageKey: String) {
        self.point = point
        self.imageKey = imageKey
        self.coordinate = point.coordinate
    }
}

// MARK: - Observable State for SwiftUI

final class DialectAppleMapModel: ObservableObject {
    @Published var points: [DialectMapPoint] = []
    @Published var style: DialectMapStyleConfig = .default
    @Published var fullscreen: Bool = false
    @Published var revision: Int = 0
}

// MARK: - SwiftUI Map Container (iOS 15+ Compatible)

struct DialectAppleMapContainerView: View {
    @ObservedObject var model: DialectAppleMapModel
    let initialCamera: DialectMapCameraSnapshot
    let onCameraChanged: (DialectMapCameraSnapshot) -> Void
    let onExitFullscreen: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            DialectMKMapRepresentable(
                points: model.points,
                style: model.style,
                revision: model.revision,
                initialCamera: initialCamera,
                onCameraChanged: onCameraChanged
            )
            .ignoresSafeArea()

            if model.fullscreen {
                Button(action: onExitFullscreen) {
                    Image(systemName: "arrow.down.right.and.arrow.up.left")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.primary)
                        .frame(width: 40, height: 40)
                        .background(.ultraThinMaterial, in: Circle())
                        .overlay(
                            Circle().stroke(Color.primary.opacity(0.15), lineWidth: 1)
                        )
                        .shadow(color: Color.black.opacity(0.16), radius: 6, x: 0, y: 2)
                }
                .accessibilityLabel("Exit fullscreen")
                .padding(.top, 14)
                .padding(.trailing, 18)
            }
        }
    }
}

private struct DialectMKMapRepresentable: UIViewRepresentable {
    let points: [DialectMapPoint]
    let style: DialectMapStyleConfig
    let revision: Int
    let initialCamera: DialectMapCameraSnapshot
    let onCameraChanged: (DialectMapCameraSnapshot) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onCameraChanged: onCameraChanged)
    }

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView(frame: .zero)
        mapView.delegate = context.coordinator
        mapView.mapType = .standard
        mapView.showsCompass = true
        mapView.showsScale = false
        mapView.isRotateEnabled = true
        mapView.isPitchEnabled = false
        mapView.pointOfInterestFilter = .excludingAll
        mapView.overrideUserInterfaceStyle = style.isDark ? .dark : .light
        context.coordinator.attach(mapView: mapView, initialCamera: initialCamera)
        context.coordinator.sync(points: points, style: style, revision: revision)
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        mapView.overrideUserInterfaceStyle = style.isDark ? .dark : .light
        context.coordinator.sync(points: points, style: style, revision: revision)
    }

    static func dismantleUIView(_ mapView: MKMapView, coordinator: Coordinator) {
        coordinator.teardown(mapView: mapView)
    }

    final class Coordinator: NSObject, MKMapViewDelegate {
        private static let reuseIdentifier = "DialectPointAnnotationView"
        private static let pixelBudget: Double = 16.0 * 1024.0 * 1024.0

        private weak var mapView: MKMapView?
        private let onCameraChanged: (DialectMapCameraSnapshot) -> Void
        private let imageCache = NSCache<NSString, UIImage>()

        private var points: [DialectMapPoint] = []
        private var style: DialectMapStyleConfig = .default
        private var lastRevision: Int = -1
        private var currentTier: DialectMapZoomTier?
        private var pendingInitialCamera: DialectMapCameraSnapshot?
        private var hasAppliedInitialCamera = false
        private var viewportWorkItem: DispatchWorkItem?
        private var activeAnnotations: [DialectPointAnnotation] = []

        init(onCameraChanged: @escaping (DialectMapCameraSnapshot) -> Void) {
            self.onCameraChanged = onCameraChanged
            super.init()
            imageCache.countLimit = 4000
        }

        func attach(mapView: MKMapView, initialCamera: DialectMapCameraSnapshot) {
            self.mapView = mapView
            self.pendingInitialCamera = initialCamera
        }

        func sync(points: [DialectMapPoint], style: DialectMapStyleConfig, revision: Int) {
            guard revision != lastRevision else { return }
            lastRevision = revision
            self.points = points
            self.style = style
            imageCache.removeAllObjects()
            currentTier = nil
            applyInitialCameraIfPossible()
            renderPoints(resetAnnotations: true)
        }

        func teardown(mapView: MKMapView) {
            viewportWorkItem?.cancel()
            viewportWorkItem = nil
            emitCameraSnapshot(from: mapView)
            if !activeAnnotations.isEmpty {
                mapView.removeAnnotations(activeAnnotations)
                activeAnnotations.removeAll()
            }
            imageCache.removeAllObjects()
            mapView.delegate = nil
        }

        private func applyInitialCameraIfPossible() {
            guard !hasAppliedInitialCamera,
                  let mapView,
                  let snapshot = pendingInitialCamera
            else { return }
            let width = Double(mapView.bounds.width)
            let height = Double(mapView.bounds.height)
            guard width > 1, height > 1 else { return }

            hasAppliedInitialCamera = true
            let lonDelta = min(180.0, max(0.001, 360.0 * (width / 512.0) / pow(2.0, snapshot.zoom)))
            let latCos = max(0.1, cos(snapshot.center.latitude * .pi / 180.0))
            let latDelta = min(140.0, max(0.001, lonDelta * latCos * (height / width)))
            let region = MKCoordinateRegion(
                center: snapshot.center,
                span: MKCoordinateSpan(latitudeDelta: latDelta, longitudeDelta: lonDelta)
            )
            mapView.setRegion(region, animated: false)
            if snapshot.heading != 0 || snapshot.pitch != 0 {
                let camera = mapView.camera.copy() as! MKMapCamera
                camera.heading = snapshot.heading
                camera.pitch = snapshot.pitch
                mapView.setCamera(camera, animated: false)
            }
        }

        private func computeZoom(for mapView: MKMapView) -> Double {
            let width = max(Double(mapView.bounds.width), 512.0 * 0.25)
            let lonDelta = max(mapView.region.span.longitudeDelta, 1e-6)
            return log2(360.0 * (width / 512.0) / lonDelta)
        }

        private func zoomTier(for mapView: MKMapView) -> DialectMapZoomTier {
            let zoom = computeZoom(for: mapView)
            if zoom < 5.0 { return .dots }
            if zoom < 8.0 { return .count }
            return .full
        }

        private func emitCameraSnapshot(from mapView: MKMapView) {
            guard hasAppliedInitialCamera else { return }
            onCameraChanged(
                DialectMapCameraSnapshot(
                    center: mapView.region.center,
                    zoom: computeZoom(for: mapView),
                    pitch: mapView.camera.pitch,
                    heading: mapView.camera.heading
                )
            )
        }

        private func renderPoints(resetAnnotations: Bool) {
            guard let mapView else { return }
            viewportWorkItem?.cancel()
            viewportWorkItem = nil

            applyInitialCameraIfPossible()

            let tier = zoomTier(for: mapView)
            if tier == .dots && currentTier == .dots && !resetAnnotations {
                return
            }
            currentTier = tier

            if !activeAnnotations.isEmpty {
                mapView.removeAnnotations(activeAnnotations)
                activeAnnotations.removeAll()
            }

            guard !points.isEmpty else { return }

            if tier == .dots {
                let scale = min(UIScreen.main.scale, 3.0)
                var next: [DialectPointAnnotation] = []
                next.reserveCapacity(points.count)
                for point in points {
                    let key = "dots|\(point.colorHex)"
                    if imageCache.object(forKey: key as NSString) == nil {
                        let image = DialectSpriteRenderer.renderDotImage(colorHex: point.colorHex, scale: scale)
                        imageCache.setObject(image, forKey: key as NSString)
                    }
                    next.append(DialectPointAnnotation(point: point, imageKey: key))
                }
                activeAnnotations = next
                mapView.addAnnotations(next)
                return
            }

            // Viewport culling with slight padding for count/full tiers (matches DialectPointMap.vue).
            let visibleRect = mapView.visibleMapRect
            let paddedRect = visibleRect.insetBy(
                dx: -visibleRect.size.width * 0.15,
                dy: -visibleRect.size.height * 0.15
            )

            var distinctMetrics: [String: DialectSpriteRenderer.LabelMetrics] = [:]
            var totalArea: Double = 0
            var visibleEntries: [(DialectMapPoint, String)] = []

            for point in points {
                let mapPoint = MKMapPoint(point.coordinate)
                guard paddedRect.contains(mapPoint) else { continue }
                let metrics = DialectSpriteRenderer.measureLabel(point: point, tier: tier, style: style)
                if distinctMetrics[metrics.key] == nil {
                    distinctMetrics[metrics.key] = metrics
                    totalArea += Double((metrics.width + 16) * (metrics.height + 16))
                }
                visibleEntries.append((point, metrics.key))
            }

            let maxScale = Double(min(UIScreen.main.scale, 3.0))
            let budgetedScale = sqrt(Self.pixelBudget / max(1.0, totalArea))
            let renderScale = CGFloat(max(1.0, min(maxScale, budgetedScale)))

            for (key, metrics) in distinctMetrics where imageCache.object(forKey: key as NSString) == nil {
                let image = DialectSpriteRenderer.renderLabelImage(
                    metrics: metrics,
                    style: style,
                    scale: renderScale
                )
                imageCache.setObject(image, forKey: key as NSString)
            }

            var next: [DialectPointAnnotation] = []
            next.reserveCapacity(visibleEntries.count)
            for (point, key) in visibleEntries {
                next.append(DialectPointAnnotation(point: point, imageKey: key))
            }
            activeAnnotations = next
            mapView.addAnnotations(next)
        }

        // MARK: MKMapViewDelegate

        func mapViewDidFinishLoadingMap(_ mapView: MKMapView) {
            if !hasAppliedInitialCamera {
                applyInitialCameraIfPossible()
                renderPoints(resetAnnotations: true)
            }
        }

        func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
            if !hasAppliedInitialCamera {
                applyInitialCameraIfPossible()
            }
            emitCameraSnapshot(from: mapView)

            viewportWorkItem?.cancel()
            viewportWorkItem = nil

            let nextTier = zoomTier(for: mapView)
            if nextTier != currentTier {
                renderPoints(resetAnnotations: true)
            } else if currentTier != .dots {
                let item = DispatchWorkItem { [weak self] in
                    self?.renderPoints(resetAnnotations: true)
                }
                viewportWorkItem = item
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2, execute: item)
            }
        }

        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard let dialectAnnotation = annotation as? DialectPointAnnotation else { return nil }
            let view = mapView.dequeueReusableAnnotationView(withIdentifier: Self.reuseIdentifier)
                ?? MKAnnotationView(annotation: dialectAnnotation, reuseIdentifier: Self.reuseIdentifier)
            view.annotation = dialectAnnotation
            view.image = imageCache.object(forKey: dialectAnnotation.imageKey as NSString)
            view.canShowCallout = false
            view.displayPriority = .required
            view.collisionMode = .none
            view.clusteringIdentifier = nil
            return view
        }
    }
}

// MARK: - Native Host Controller inside DialectsBridgeViewController

final class DialectAppleMapHost {
    private weak var parentController: UIViewController?
    private weak var webView: WKWebView?
    private var hostingController: UIHostingController<DialectAppleMapContainerView>?
    private let model = DialectAppleMapModel()

    private var savedCamera: DialectMapCameraSnapshot = .defaultChina
    private var cardFrame: CGRect = .zero
    private var cornerRadius: CGFloat = 12
    private var overlayBlocked: Bool = false
    private var onExitFullscreen: (() -> Void)?

    init(parentController: UIViewController, webView: WKWebView) {
        self.parentController = parentController
        self.webView = webView
    }

    func mount(
        points: [DialectMapPoint],
        style: DialectMapStyleConfig,
        frame: CGRect,
        fullscreen: Bool,
        onExitFullscreen: @escaping () -> Void
    ) {
        self.onExitFullscreen = onExitFullscreen
        self.cardFrame = frame
        self.cornerRadius = style.cornerRadius
        self.model.points = points
        self.model.style = style
        self.model.fullscreen = fullscreen
        self.model.revision += 1

        if hostingController == nil {
            let rootView = DialectAppleMapContainerView(
                model: model,
                initialCamera: savedCamera,
                onCameraChanged: { [weak self] snapshot in
                    self?.savedCamera = snapshot
                },
                onExitFullscreen: { [weak self] in
                    self?.onExitFullscreen?()
                }
            )
            let controller = UIHostingController(rootView: rootView)
            controller.view.backgroundColor = .clear
            controller.view.clipsToBounds = true
            self.hostingController = controller
            parentController?.addChild(controller)
            controller.didMove(toParent: parentController)
        }

        attachHostView()
    }

    func update(
        points: [DialectMapPoint]?,
        style: DialectMapStyleConfig?,
        frame: CGRect?,
        fullscreen: Bool?
    ) {
        if let style {
            self.cornerRadius = style.cornerRadius
            self.model.style = style
        }
        if let points {
            self.model.points = points
        }
        if let frame {
            self.cardFrame = frame
        }
        if let fullscreen {
            self.model.fullscreen = fullscreen
        }
        if points != nil || style != nil {
            self.model.revision += 1
        }
        attachHostView()
    }

    func setOverlayBlocked(_ blocked: Bool) {
        overlayBlocked = blocked
        updateVisibility()
    }

    func unmount() {
        guard let controller = hostingController else { return }
        hostingController = nil
        controller.willMove(toParent: nil)
        controller.view.removeFromSuperview()
        controller.removeFromParent()
    }

    private func attachHostView() {
        guard let controller = hostingController,
              let hostView = controller.view,
              let parentView = parentController?.view,
              let webView
        else { return }

        controller.overrideUserInterfaceStyle = model.style.isDark ? .dark : .light

        if model.fullscreen {
            if #available(iOS 16.4, *) {
                controller.safeAreaRegions = .all
            }
            hostView.insetsLayoutMarginsFromSafeArea = true
            if hostView.superview !== parentView {
                hostView.removeFromSuperview()
                parentView.addSubview(hostView)
            }
            hostView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            hostView.frame = parentView.bounds
            hostView.layer.cornerRadius = 0
        } else {
            if #available(iOS 16.4, *) {
                controller.safeAreaRegions = []
            }
            hostView.insetsLayoutMarginsFromSafeArea = false
            if hostView.superview !== webView.scrollView {
                hostView.removeFromSuperview()
                webView.scrollView.addSubview(hostView)
            }
            hostView.autoresizingMask = []
            hostView.frame = cardFrame
            hostView.layer.cornerRadius = cornerRadius
        }

        updateVisibility()
    }

    private func updateVisibility() {
        guard let hostView = hostingController?.view else { return }
        hostView.isHidden = !model.fullscreen && overlayBlocked
    }
}
