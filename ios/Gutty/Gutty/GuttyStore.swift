import Foundation

@MainActor
final class GuttyStore: ObservableObject {
    @Published var signup: Signup? {
        didSet { save(signup, key: GuttyTheme.signupStorageKey) }
    }

    @Published var logs: [PoopLog] = [] {
        didSet { save(logs, key: GuttyTheme.logsStorageKey) }
    }

    @Published var communityPosts: [CommunityPost] = [] {
        didSet { save(communityPosts, key: GuttyTheme.postsStorageKey) }
    }

    @Published var donationPledges: [DonationPledge] = [] {
        didSet { save(donationPledges, key: GuttyTheme.donationsStorageKey) }
    }

    init() {
        signup = load(Signup.self, key: GuttyTheme.signupStorageKey)
        logs = load([PoopLog].self, key: GuttyTheme.logsStorageKey) ?? []
        communityPosts = load([CommunityPost].self, key: GuttyTheme.postsStorageKey) ?? []
        donationPledges = load([DonationPledge].self, key: GuttyTheme.donationsStorageKey) ?? []
    }

    var isSignedUp: Bool {
        signup != nil
    }

    var recentLogs: [PoopLog] {
        logs.sorted { $0.loggedAt > $1.loggedAt }
    }

    var weekCount: Int {
        let cutoff = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return logs.filter { $0.loggedAt >= cutoff }.count
    }

    var averageBristol: Double {
        guard !logs.isEmpty else { return 0 }
        return Double(logs.map(\.bristolType).reduce(0, +)) / Double(logs.count)
    }

    var averageComfort: Double {
        guard !logs.isEmpty else { return 0 }
        return logs.map(\.comfort).reduce(0, +) / Double(logs.count)
    }

    func signUp(name: String, email: String, reason: String) throws {
        let cleanedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard cleanedEmail.contains("@"), cleanedEmail.contains(".") else {
            throw GuttyError.invalidEmail
        }
        signup = Signup(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Gutty user" : name,
            email: cleanedEmail,
            reason: reason
        )
    }

    func addLog(_ log: PoopLog) {
        logs.insert(log, at: 0)
    }

    func addCommunityPost(displayName: String, story: String, suggestion: String) throws {
        guard !story.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !suggestion.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw GuttyError.missingCommunityFields
        }
        communityPosts.insert(
            CommunityPost(
                displayName: displayName.isEmpty ? "anonymous gut scout" : displayName,
                story: story,
                suggestion: suggestion
            ),
            at: 0
        )
    }

    func addDonation(name: String, email: String, amount: Double, message: String) throws {
        let cleanedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard cleanedEmail.contains("@"), cleanedEmail.contains(".") else {
            throw GuttyError.invalidEmail
        }
        guard amount > 0 else {
            throw GuttyError.invalidDonationAmount
        }
        donationPledges.insert(
            DonationPledge(
                name: name.isEmpty ? "Gutty supporter" : name,
                email: cleanedEmail,
                amount: amount,
                message: message
            ),
            at: 0
        )
    }

    func resetDemoData() {
        logs = []
        communityPosts = []
        donationPledges = []
    }

    func gutScore() -> Int {
        guard !recentLogs.isEmpty else { return 50 }

        var score = 82
        for log in recentLogs.prefix(7) {
            if [1, 2, 6, 7].contains(log.bristolType) {
                score -= 5
            }
            if [.black, .red, .pale].contains(log.color) {
                score -= 8
            }
            if !log.flags.isEmpty {
                score -= 20
            }
            score += Int(log.hydration) - 3
            score += Int(log.fiber) - 3
            score += Int(log.comfort) - 3
            score -= max(0, Int(log.stress) - 3)
        }
        return max(0, min(100, score))
    }

    func gutHeadline() -> String {
        guard let latest = recentLogs.first else {
            return "Gutty is waiting for the first field report"
        }
        if !latest.flags.isEmpty { return "Your gut is asking for backup" }
        if [3, 4].contains(latest.bristolType) { return "Your latest log is in the smooth zone" }
        if latest.bristolType <= 2 { return "Your latest log leaned hard" }
        if latest.bristolType >= 6 { return "Your latest log leaned loose" }
        return "Your gut is giving usable data"
    }

    func gutSummary() -> String {
        guard let latest = recentLogs.first else {
            return "Everyone says trust your gut. First, let us find out whether your gut is behaving like a reliable narrator."
        }
        return "Latest report: type \(latest.bristolType) (\(latest.bristolLabel)), \(latest.color.label.lowercased()) color, \(latest.amount.label.lowercased()) amount, urgency \(Int(latest.urgency))/5."
    }

    func nextStep() -> String {
        guard let latest = recentLogs.first else {
            return "Log your next poop situation with Bristol type, color, comfort, hydration, fiber, stress, and any red flags."
        }
        if !latest.flags.isEmpty {
            return "Red flags beat experiments. Consider contacting a medical professional, especially for blood, tarry black stool, severe pain, fever, or dehydration."
        }
        return "Try one controlled experiment for the next 24 hours: hydration, fiber, movement, or stress reduction. Change one variable at a time."
    }

    func insights() -> [Insight] {
        guard !recentLogs.isEmpty else {
            return [
                Insight(
                    tone: .info,
                    title: "Your gut needs a baseline",
                    detail: "Log three situations and Gutty can start comparing texture, color, urgency, comfort, hydration, fiber, and stress."
                )
            ]
        }

        let recent = Array(recentLogs.prefix(7))
        let flags = Set(recent.flatMap { $0.flags })
        if !flags.isEmpty {
            let labels = flags.map(\.clinicalLabel).sorted().joined(separator: ", ")
            return [
                Insight(
                    tone: .urgent,
                    title: "Do not crowdsource this one",
                    detail: "You marked \(labels). Consider calling a clinician, urgent care, or emergency services if symptoms are severe."
                )
            ]
        }

        var output: [Insight] = []
        let avgBristol = recent.map { Double($0.bristolType) }.reduce(0, +) / Double(recent.count)
        let avgHydration = recent.map(\.hydration).reduce(0, +) / Double(recent.count)
        let avgFiber = recent.map(\.fiber).reduce(0, +) / Double(recent.count)
        let avgStress = recent.map(\.stress).reduce(0, +) / Double(recent.count)
        let avgComfort = recent.map(\.comfort).reduce(0, +) / Double(recent.count)

        if avgBristol <= 2.4 {
            output.append(Insight(tone: .warning, title: "Harder stools are trending", detail: "Types 1-2 often show up with constipation patterns. Water, fiber, movement, and routine timing are the usual first things to review."))
        } else if avgBristol >= 5.8 {
            output.append(Insight(tone: .warning, title: "Looser stools are trending", detail: "Types 6-7 can happen with illness, stress, alcohol, caffeine, or food triggers. Hydration matters if this keeps happening."))
        } else {
            output.append(Insight(tone: .good, title: "Texture looks mostly in range", detail: "Your recent logs are clustering near Bristol types 3-5, which is usually the calmer middle of the stool chart."))
        }

        if let color = recent.map(\.color).first(where: { [.black, .red, .pale, .yellow].contains($0) }) {
            output.append(Insight(tone: [.black, .red, .pale].contains(color) ? .warning : .info, title: "\(color.label) color note", detail: colorNote(color)))
        }
        if avgHydration <= 2.3 {
            output.append(Insight(tone: .info, title: "Hydration is a suspect", detail: "Low hydration scores can make stools harder and bowel movements less comfortable."))
        }
        if avgFiber <= 2.3 {
            output.append(Insight(tone: .info, title: "Fiber could use backup", detail: "A gradual fiber bump from beans, oats, fruit, vegetables, nuts, or seeds may help. Go slowly so your gut does not stage a protest."))
        }
        if avgStress >= 4 && avgComfort <= 3 {
            output.append(Insight(tone: .info, title: "Stress may be in the chat", detail: "Stress and gut motility are annoyingly close friends. A calmer pre-bathroom routine may be worth testing."))
        }

        return Array(output.prefix(4))
    }

    private func colorNote(_ color: StoolColor) -> String {
        switch color {
        case .brown: return "Brown is the usual baseline."
        case .green: return "Green can happen with leafy foods, coloring, or faster transit."
        case .yellow: return "Yellow can be food-related, but persistent greasy yellow stool is worth checking."
        case .black: return "Black can come from iron or bismuth, but tarry black stool can be urgent."
        case .red: return "Red can come from foods, but blood-red stool should be taken seriously."
        case .pale: return "Pale or clay-colored stool can point to bile-flow issues if it persists."
        }
    }

    private func save<T: Encodable>(_ value: T, key: String) {
        guard let data = try? JSONEncoder.gutty.encode(value) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }

    private func load<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder.gutty.decode(type, from: data)
    }
}

enum GuttyError: LocalizedError {
    case invalidEmail
    case missingCommunityFields
    case invalidDonationAmount

    var errorDescription: String? {
        switch self {
        case .invalidEmail: return "Use a valid email address."
        case .missingCommunityFields: return "Add your situation and the suggestion you want."
        case .invalidDonationAmount: return "Choose a support amount greater than zero."
        }
    }
}

extension JSONEncoder {
    static var gutty: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

extension JSONDecoder {
    static var gutty: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}
