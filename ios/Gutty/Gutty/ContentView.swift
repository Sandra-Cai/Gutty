import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: GuttyStore

    var body: some View {
        NavigationStack {
            ZStack {
                GuttyColors.background.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 16) {
                        HeaderView()
                        if store.isSignedUp {
                            DashboardView()
                        } else {
                            LockedView()
                        }
                    }
                    .padding(16)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct HeaderView: View {
    @EnvironmentObject private var store: GuttyStore

    var body: some View {
        VStack(spacing: 14) {
            HStack {
                BrandMark()
                Spacer()
                Text(store.signup == nil ? "Sign up" : "Signed up")
                    .font(.system(size: 14, weight: .black))
                    .padding(.horizontal, 14)
                    .frame(height: 40)
                    .background(GuttyColors.text)
                    .foregroundStyle(GuttyColors.background)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            VStack(alignment: .leading, spacing: 20) {
                Text("Free gut health analyzer")
                    .eyebrow()
                Text("Your gut has signals. Gutty turns them into a dashboard.")
                    .font(.system(size: 56, weight: .black, design: .default))
                    .minimumScaleFactor(0.72)
                    .lineLimit(4)
                    .foregroundStyle(GuttyColors.text)
                Text("Everyone says trust your gut. But how do you know your gut is even trustworthy? Log the poop situation, watch the pattern, and act before your body starts sending all-caps messages.")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(GuttyColors.muted)
                    .lineSpacing(4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(24)
            .background(
                LinearGradient(
                    colors: [GuttyColors.panelStrong, GuttyColors.panel],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .overlay(alignment: .topTrailing) {
                Circle()
                    .fill(GuttyColors.green.opacity(0.16))
                    .frame(width: 180, height: 180)
                    .blur(radius: 20)
                    .offset(x: 36, y: -52)
            }
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(GuttyColors.line))

            if store.signup == nil {
                SignupCard()
            }
        }
    }
}

struct LockedView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Sign up above to unlock the analyzer.")
                .font(.system(size: 24, weight: .black))
            Text("Gutty is free to use. Signup keeps the app intentional before people start logging extremely personal market data.")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(GuttyColors.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }
}

struct SignupCard: View {
    @EnvironmentObject private var store: GuttyStore
    @State private var name = ""
    @State private var email = ""
    @State private var reason = "building a baseline"
    @State private var status = "No payment. No shame. Just data."

    private let reasons = [
        "building a baseline",
        "constipation patterns",
        "loose stool patterns",
        "food trigger clues",
        "general gut curiosity"
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Start free").eyebrow(dark: true)
            Text("Sign up to use Gutty")
                .font(.system(size: 24, weight: .black))
                .foregroundStyle(GuttyColors.textDark)
            Text("Create your free local Gutty account, then start logging. Your poop data stays on this device in this MVP.")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(GuttyColors.mutedDark)

            TextField("Name", text: $name)
                .textContentType(.name)
                .guttyLightField()
            TextField("Email", text: $email)
                .textContentType(.emailAddress)
                .guttyLightField()
            Picker("What are you tracking?", selection: $reason) {
                ForEach(reasons, id: \.self) { reason in
                    Text(reason.capitalized).tag(reason)
                }
            }
            .pickerStyle(.menu)
            .tint(GuttyColors.greenDark)

            Button("Use Gutty free") {
                do {
                    try store.signUp(name: name, email: email, reason: reason)
                    status = "Signed in as \(store.signup?.name ?? "Gutty user"). Your gut may now speak."
                } catch {
                    status = error.localizedDescription
                }
            }
            .buttonStyle(GuttyPrimaryButtonStyle())

            Text(status)
                .statusPill(light: true)
        }
        .padding(20)
        .background(GuttyColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct DashboardView: View {
    var body: some View {
        VStack(spacing: 16) {
            HighlightsView()
            SignalBoardView()
            ScoreSection()
            LogFormView()
            InsightsView()
            CommunitySection()
            DonationSection()
            SafetySection()
        }
    }
}

struct HighlightsView: View {
    var body: some View {
        HStack(spacing: 1) {
            HighlightTile(label: "Tracked signals", value: "8", detail: "Bristol, color, amount, urgency, comfort, hydration, fiber, stress.")
            HighlightTile(label: "Community mode", value: "Opt-in", detail: "Publish a poop note only when you choose.")
            HighlightTile(label: "Safety", value: "Red flags", detail: "Symptoms that interrupt the joke.")
        }
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(GuttyColors.line))
    }
}

struct HighlightTile: View {
    var label: String
    var value: String
    var detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).eyebrow()
            Text(value)
                .font(.system(size: 24, weight: .black))
                .foregroundStyle(GuttyColors.text)
            Text(detail)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(GuttyColors.muted)
        }
        .frame(maxWidth: .infinity, minHeight: 150, alignment: .topLeading)
        .padding(14)
        .background(GuttyColors.panel)
    }
}

struct SignalBoardView: View {
    var body: some View {
        VStack(spacing: 10) {
            SignalRow(label: "Type 4", value: "Smooth zone", tag: "+ balanced", tone: .good)
            SignalRow(label: "Hydration", value: "4 / 5", tag: "watch", tone: .info)
            SignalRow(label: "Stress", value: "Rising", tag: "test routine", tone: .warning)
            SignalRow(label: "Red flags", value: "Clinician", tag: "do not crowdsource", tone: .urgent)
        }
        .card()
    }
}

struct SignalRow: View {
    var label: String
    var value: String
    var tag: String
    var tone: Insight.Tone

    var body: some View {
        HStack {
            Text(label)
                .foregroundStyle(GuttyColors.muted)
            Spacer()
            Text(value)
                .fontWeight(.black)
            Text(tag)
                .fontWeight(.black)
                .foregroundStyle(GuttyColors.color(for: tone))
        }
        .font(.system(size: 14, weight: .bold))
        .padding(14)
        .background(GuttyColors.darkField)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(GuttyColors.line))
    }
}

struct ScoreSection: View {
    @EnvironmentObject private var store: GuttyStore

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Gut check").eyebrow()
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(store.gutScore())")
                    .font(.system(size: 64, weight: .black))
                    .foregroundStyle(GuttyColors.green)
                Text("/100")
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(GuttyColors.muted)
            }
            Text(store.gutHeadline())
                .font(.system(size: 25, weight: .black))
            Text(store.gutSummary())
                .foregroundStyle(GuttyColors.muted)
                .fontWeight(.semibold)
            Text(store.nextStep())
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(GuttyColors.muted)
                .padding(14)
                .background(GuttyColors.darkField)
                .clipShape(RoundedRectangle(cornerRadius: 8))

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 10) {
                MetricTile(label: "Total logs", value: "\(store.logs.count)")
                MetricTile(label: "This week", value: "\(store.weekCount)")
                MetricTile(label: "Avg Bristol", value: String(format: "%.1f", store.averageBristol))
                MetricTile(label: "Comfort", value: String(format: "%.1f", store.averageComfort))
            }
        }
        .card()
    }
}

struct MetricTile: View {
    var label: String
    var value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).eyebrow()
            Text(value)
                .font(.system(size: 30, weight: .black))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(GuttyColors.darkField)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(GuttyColors.line))
    }
}

struct LogFormView: View {
    @EnvironmentObject private var store: GuttyStore
    @State private var draft = PoopLog()
    @State private var status = "Ready when your gut is."

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Field report").eyebrow()
            Text("Log your poop situation")
                .font(.system(size: 24, weight: .black))

            DatePicker("When", selection: $draft.loggedAt)
            Stepper("Bristol type \(draft.bristolType): \(draft.bristolLabel)", value: $draft.bristolType, in: 1...7)
            Picker("Color", selection: $draft.color) {
                ForEach(StoolColor.allCases) { color in Text(color.label).tag(color) }
            }
            Picker("Amount", selection: $draft.amount) {
                ForEach(StoolAmount.allCases) { amount in Text(amount.label).tag(amount) }
            }
            .pickerStyle(.segmented)

            SliderRow(label: "Urgency", value: $draft.urgency)
            SliderRow(label: "Comfort", value: $draft.comfort)
            SliderRow(label: "Hydration", value: $draft.hydration)
            SliderRow(label: "Fiber", value: $draft.fiber)
            SliderRow(label: "Stress", value: $draft.stress)

            Text("Red flags").eyebrow()
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(RedFlag.allCases) { flag in
                    Toggle(flag.label, isOn: Binding(
                        get: { draft.flags.contains(flag) },
                        set: { isOn in
                            if isOn {
                                draft.flags.insert(flag)
                            } else {
                                draft.flags.remove(flag)
                            }
                        }
                    ))
                    .toggleStyle(.button)
                }
            }

            TextField("What did you eat, drink, feel, or regret?", text: $draft.notes, axis: .vertical)
                .lineLimit(3...5)
                .guttyDarkField()

            Button("Analyze this poop") {
                store.addLog(draft)
                draft = PoopLog()
                status = "Logged. Analysis refreshed."
            }
            .buttonStyle(GuttyPrimaryButtonStyle())

            Text(status).statusPill()
        }
        .card()
    }
}

struct SliderRow: View {
    var label: String
    @Binding var value: Double

    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Text(label)
                    .fontWeight(.bold)
                Spacer()
                Text("\(Int(value))/5")
                    .fontWeight(.black)
                    .foregroundStyle(GuttyColors.green)
            }
            Slider(value: $value, in: 1...5, step: 1)
                .tint(GuttyColors.green)
        }
    }
}

struct InsightsView: View {
    @EnvironmentObject private var store: GuttyStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Analyzer").eyebrow()
            Text("What Gutty noticed")
                .font(.system(size: 24, weight: .black))
            ForEach(store.insights()) { insight in
                InsightCard(insight: insight)
            }
            Text("Gutty can notice patterns. Gutty cannot diagnose you. Blood, tarry black stool, severe pain, fever, dehydration, or symptoms that persist deserve a real clinician.")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(GuttyColors.muted)
                .padding(14)
                .background(GuttyColors.darkField)
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .card()
    }
}

struct InsightCard: View {
    var insight: Insight

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(insight.title)
                .font(.system(size: 16, weight: .black))
            Text(insight.detail)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(GuttyColors.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(GuttyColors.darkField)
        .overlay(alignment: .leading) {
            Rectangle()
                .fill(GuttyColors.color(for: insight.tone))
                .frame(width: 5)
        }
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(GuttyColors.line))
    }
}

struct CommunitySection: View {
    @EnvironmentObject private var store: GuttyStore
    @State private var displayName = ""
    @State private var story = ""
    @State private var suggestion = ""
    @State private var status = "Be brave, be useful, be kind."

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Community").eyebrow()
            Text("Publish a poop note")
                .font(.system(size: 24, weight: .black))

            TextField("Display name", text: $displayName)
                .guttyDarkField()
            TextField("Your situation", text: $story, axis: .vertical)
                .lineLimit(3...5)
                .guttyDarkField()
            TextField("Suggestion you are inviting", text: $suggestion, axis: .vertical)
                .lineLimit(2...4)
                .guttyDarkField()

            Button("Publish locally") {
                do {
                    try store.addCommunityPost(displayName: displayName, story: story, suggestion: suggestion)
                    story = ""
                    suggestion = ""
                    status = "Published locally."
                } catch {
                    status = error.localizedDescription
                }
            }
            .buttonStyle(GuttySecondaryButtonStyle())

            Text(status).statusPill()

            if store.communityPosts.isEmpty {
                Text("No community notes yet.")
                    .foregroundStyle(GuttyColors.muted)
            } else {
                ForEach(store.communityPosts.prefix(5)) { post in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(post.displayName)
                            .fontWeight(.black)
                        Text(post.story)
                            .foregroundStyle(GuttyColors.muted)
                        Text("Asking for: \(post.suggestion)")
                            .font(.system(size: 13, weight: .black))
                            .foregroundStyle(GuttyColors.green)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(GuttyColors.darkField)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
        .card()
    }
}

struct DonationSection: View {
    @EnvironmentObject private var store: GuttyStore
    @State private var amount = 7.0
    @State private var name = ""
    @State private var email = ""
    @State private var message = "Keep Gutty free for everyone."
    @State private var status = "Demo pledge only. Connect Apple IAP, Stripe, PayPal, or Ko-fi before collecting real payments."

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Pay what you want").eyebrow()
            Text("Gutty stays 100% free.")
                .font(.system(size: 34, weight: .black))
            Text("Donations are optional support for hosting, maintenance, research, and the questionable courage it takes to build public-interest poop software.")
                .foregroundStyle(GuttyColors.muted)
                .fontWeight(.semibold)

            HStack {
                ForEach([3.0, 7.0, 15.0, 25.0], id: \.self) { preset in
                    Button("$\(Int(preset))") { amount = preset }
                        .buttonStyle(AmountButtonStyle(selected: amount == preset))
                }
            }

            HStack {
                Text("Custom amount")
                    .fontWeight(.bold)
                Spacer()
                TextField("7.00", value: $amount, format: .number.precision(.fractionLength(2)))
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 120)
                    .guttyDarkField()
            }

            TextField("Name", text: $name)
                .guttyDarkField()
            TextField("Email", text: $email)
                .guttyDarkField()
            TextField("Note", text: $message, axis: .vertical)
                .lineLimit(2...4)
                .guttyDarkField()

            Button("Pledge support") {
                do {
                    try store.addDonation(name: name, email: email, amount: amount, message: message)
                    status = "Thank you. Your $\(String(format: "%.2f", amount)) support pledge was saved locally."
                    message = ""
                } catch {
                    status = error.localizedDescription
                }
            }
            .buttonStyle(GuttyPrimaryButtonStyle())

            Text(status).statusPill()
        }
        .card()
        .onAppear {
            name = store.signup?.name ?? name
            email = store.signup?.email ?? email
        }
    }
}

struct SafetySection: View {
    @EnvironmentObject private var store: GuttyStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Safety").eyebrow()
            Text("Everyone is saying you should trust your gut.")
                .font(.system(size: 24, weight: .black))
            Text("But how do you know your gut is even trustworthy? Introducing Gutty: a free gut health analyzer for everyone to develop a healthier gut by logging the poop situation.")
                .foregroundStyle(GuttyColors.muted)
                .fontWeight(.semibold)
            Button("Reset local demo data") {
                store.resetDemoData()
            }
            .buttonStyle(GuttyDangerButtonStyle())
        }
        .card()
    }
}

struct BrandMark: View {
    var body: some View {
        HStack(spacing: 10) {
            Text("G")
                .font(.system(size: 18, weight: .black))
                .foregroundStyle(GuttyColors.background)
                .frame(width: 38, height: 38)
                .background(GuttyColors.green)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            Text("Gutty")
                .font(.system(size: 20, weight: .black))
        }
    }
}

enum GuttyColors {
    static let background = Color(red: 0.02, green: 0.024, blue: 0.028)
    static let panel = Color(red: 0.063, green: 0.075, blue: 0.086)
    static let panelStrong = Color(red: 0.09, green: 0.106, blue: 0.125)
    static let darkField = Color(red: 0.039, green: 0.051, blue: 0.063)
    static let surface = Color(red: 0.965, green: 0.973, blue: 0.961)
    static let text = Color(red: 0.969, green: 0.984, blue: 0.965)
    static let textDark = Color(red: 0.067, green: 0.09, blue: 0.086)
    static let muted = Color(red: 0.616, green: 0.659, blue: 0.643)
    static let mutedDark = Color(red: 0.325, green: 0.38, blue: 0.365)
    static let line = Color.white.opacity(0.12)
    static let green = Color(red: 0.471, green: 0.949, blue: 0.427)
    static let greenDark = Color(red: 0.161, green: 0.553, blue: 0.259)
    static let violet = Color(red: 0.549, green: 0.424, blue: 1)
    static let warning = Color(red: 0.941, green: 0.706, blue: 0.302)
    static let danger = Color(red: 1, green: 0.392, blue: 0.392)

    static func color(for tone: Insight.Tone) -> Color {
        switch tone {
        case .good: return green
        case .info: return violet
        case .warning: return warning
        case .urgent: return danger
        }
    }
}

extension View {
    func card() -> some View {
        self
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(GuttyColors.panel)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(GuttyColors.line))
    }

    func guttyDarkField() -> some View {
        self
            .padding(12)
            .background(GuttyColors.darkField)
            .foregroundStyle(GuttyColors.text)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(GuttyColors.line))
    }

    func guttyLightField() -> some View {
        self
            .padding(12)
            .background(Color.white)
            .foregroundStyle(GuttyColors.textDark)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.black.opacity(0.12)))
    }

    func eyebrow(dark: Bool = false) -> some View {
        self
            .font(.system(size: 12, weight: .black))
            .textCase(.uppercase)
            .foregroundStyle(dark ? GuttyColors.greenDark : GuttyColors.green)
    }

    func statusPill(light: Bool = false) -> some View {
        self
            .font(.system(size: 13, weight: .black))
            .foregroundStyle(light ? GuttyColors.mutedDark : GuttyColors.muted)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(light ? GuttyColors.greenDark.opacity(0.1) : GuttyColors.green.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct GuttyPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .black))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(GuttyColors.green.opacity(configuration.isPressed ? 0.75 : 1))
            .foregroundStyle(GuttyColors.background)
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct GuttySecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .black))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(GuttyColors.text.opacity(configuration.isPressed ? 0.75 : 1))
            .foregroundStyle(GuttyColors.background)
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct GuttyDangerButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .black))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(GuttyColors.danger.opacity(configuration.isPressed ? 0.75 : 1))
            .foregroundStyle(Color.black)
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct AmountButtonStyle: ButtonStyle {
    var selected: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .black))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(selected ? GuttyColors.green : GuttyColors.darkField)
            .foregroundStyle(selected ? GuttyColors.background : GuttyColors.text)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(GuttyColors.line))
            .opacity(configuration.isPressed ? 0.75 : 1)
    }
}
