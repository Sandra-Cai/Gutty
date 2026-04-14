import Foundation

enum GuttyTheme {
    static let signupStorageKey = "gutty_signup"
    static let logsStorageKey = "gutty_logs"
    static let postsStorageKey = "gutty_posts"
    static let donationsStorageKey = "gutty_donations"
}

struct Signup: Codable, Equatable {
    var name: String
    var email: String
    var reason: String
}

struct PoopLog: Codable, Identifiable, Equatable {
    var id: UUID = UUID()
    var loggedAt: Date = Date()
    var bristolType: Int = 4
    var color: StoolColor = .brown
    var amount: StoolAmount = .medium
    var urgency: Double = 3
    var comfort: Double = 4
    var hydration: Double = 3
    var fiber: Double = 3
    var stress: Double = 3
    var notes: String = ""
    var flags: Set<RedFlag> = []

    var bristolLabel: String {
        BristolType.label(for: bristolType)
    }
}

struct CommunityPost: Codable, Identifiable, Equatable {
    var id: UUID = UUID()
    var displayName: String
    var story: String
    var suggestion: String
    var createdAt: Date = Date()
}

struct DonationPledge: Codable, Identifiable, Equatable {
    var id: UUID = UUID()
    var name: String
    var email: String
    var amount: Double
    var message: String
    var createdAt: Date = Date()
}

struct Insight: Identifiable, Equatable {
    enum Tone {
        case good
        case info
        case warning
        case urgent
    }

    var id = UUID()
    var tone: Tone
    var title: String
    var detail: String
}

enum BristolType {
    static func label(for type: Int) -> String {
        switch type {
        case 1: return "Hard separate lumps"
        case 2: return "Lumpy sausage"
        case 3: return "Cracked sausage"
        case 4: return "Smooth soft sausage"
        case 5: return "Soft blobs"
        case 6: return "Mushy fluffy pieces"
        case 7: return "Watery liquid"
        default: return "Unknown"
        }
    }
}

enum StoolColor: String, Codable, CaseIterable, Identifiable {
    case brown
    case green
    case yellow
    case black
    case red
    case pale

    var id: String { rawValue }
    var label: String { rawValue.capitalized }
}

enum StoolAmount: String, Codable, CaseIterable, Identifiable {
    case small
    case medium
    case large

    var id: String { rawValue }
    var label: String { rawValue.capitalized }
}

enum RedFlag: String, Codable, CaseIterable, Hashable, Identifiable {
    case blood
    case blackTarry
    case severePain
    case fever
    case dehydration

    var id: String { rawValue }

    var label: String {
        switch self {
        case .blood: return "Blood"
        case .blackTarry: return "Black or tarry"
        case .severePain: return "Severe pain"
        case .fever: return "Fever"
        case .dehydration: return "Dehydration"
        }
    }

    var clinicalLabel: String {
        switch self {
        case .blood: return "blood in stool"
        case .blackTarry: return "black or tarry stool"
        case .severePain: return "severe belly pain"
        case .fever: return "fever"
        case .dehydration: return "dehydration symptoms"
        }
    }
}
