// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.2"),
        .package(name: "CapacitorFilesystem", path: "../../../project/node_modules/@capacitor/filesystem"),
        .package(name: "CapacitorPreferences", path: "../../../project/node_modules/@capacitor/preferences"),
        .package(name: "CapacitorShare", path: "../../../project/node_modules/@capacitor/share"),
        .package(name: "CapawesomeCapacitorFilePicker", path: "../../../project/node_modules/@capawesome/capacitor-file-picker"),
        .package(name: "CapgoCapacitorAudioRecorder", path: "../../../project/node_modules/@capgo/capacitor-audio-recorder")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorFilesystem", package: "CapacitorFilesystem"),
                .product(name: "CapacitorPreferences", package: "CapacitorPreferences"),
                .product(name: "CapacitorShare", package: "CapacitorShare"),
                .product(name: "CapawesomeCapacitorFilePicker", package: "CapawesomeCapacitorFilePicker"),
                .product(name: "CapgoCapacitorAudioRecorder", package: "CapgoCapacitorAudioRecorder")
            ]
        )
    ]
)
