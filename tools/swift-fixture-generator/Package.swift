// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "SwiftFixtureGenerator",
    platforms: [.macOS("14.4")],
    products: [
        .executable(name: "SwiftFixtureGenerator", targets: ["SwiftFixtureGenerator"])
    ],
    dependencies: [
        .package(path: "../../../Investor")
    ],
    targets: [
        .executableTarget(
            name: "SwiftFixtureGenerator",
            dependencies: [
                .product(name: "InvestorCore", package: "Investor")
            ]
        )
    ]
)
