import SwiftUI

@main
struct GuttyApp: App {
    @StateObject private var store = GuttyStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
