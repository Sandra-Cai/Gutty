# Gutty

Gutty is a free local gut health analyzer for logging your poop situation, noticing patterns, and sharing opt-in community notes.

The pitch:

> Everyone is saying you should trust your gut. But how do you know your gut is even trustworthy?

Gutty helps you track Bristol stool type, color, amount, urgency, comfort, hydration, fiber, stress, notes, and red flags. It gives simple wellness guidance and points out symptoms that should not be crowdsourced.

## What it does

- Logs poop situations in a local SQLite database at `data/gutty.db`
- Asks people to sign up before using the analyzer
- Includes an optional pay-what-you-want support pledge flow
- Scores recent gut signals from stool type, color, comfort, urgency, hydration, fiber, stress, and red flags
- Highlights constipation-like, loose-stool, color, hydration, fiber, and stress patterns
- Includes conservative red-flag guidance for blood, black/tarry stool, severe pain, fever, and dehydration
- Lets users publish local community notes and request suggestions
- Keeps data local by default

## Run it

```bash
python3 app.py
```

Then open [http://127.0.0.1:8420](http://127.0.0.1:8420).

## iOS app

The native SwiftUI app lives in `ios/Gutty`.

Open `ios/Gutty/Gutty.xcodeproj` in Xcode, choose the `Gutty` scheme, and run it on an iPhone simulator or device. The iOS app mirrors the web MVP with local signup, poop logging, gut scoring, community notes, and optional support pledges. Pledges are stored locally and do not process real payments yet.

## Supabase setup

The live Vercel site uses Supabase Auth for Google sign-in and saves donation pledges to Supabase using the public publishable key in `app.js`.

To enable Google sign-in:

1. Open Supabase and choose the Gutty project.
2. Go to Authentication -> Providers -> Google.
3. Enable Google and add the Google OAuth client ID and secret.
4. Go to Authentication -> URL Configuration.
5. Set Site URL to `https://gutty.io`.
6. Add `https://gutty.io` to Redirect URLs.

To enable the optional profile and donation tables:

1. Go to SQL Editor, create a new query, and paste `supabase/schema.sql`.
2. Run the query.
3. Test Google sign-in at `https://gutty.io`, then check Authentication -> Users.
4. Check Table Editor -> `signups` for the lightweight signup profile mirror and Table Editor -> `donation_pledges` for pledge forms.

Poop logs stay in the visitor's browser for now so Gutty does not collect sensitive health details before real accounts, privacy controls, and export/delete flows are ready.

## Medical note

Gutty is for personal tracking and general wellness education. It is not a diagnosis, treatment plan, or medical advice. Red flags like blood in stool, tarry black stool, severe abdominal pain, fever, dehydration, pale stool that persists, or symptoms that do not resolve should be discussed with a medical professional.

## Project structure

- `app.py`: local server, API routes, SQLite setup, gut pattern analyzer, community posts
- `static/index.html`: Gutty app markup
- `static/styles.css`: responsive app styling
- `static/app.js`: frontend behavior
- `docs/PRODUCT_NOTES.md`: product notes and roadmap
- `ios/Gutty`: native SwiftUI iOS app

## Current limitations

- Signup and donation pledges can save to Supabase when `supabase/schema.sql` has been run; poop logs and community posts stay browser-local in the static Vercel build
- Donation pledges do not process real payments until a provider such as Stripe, PayPal, or Ko-fi is connected
- The analyzer uses simple rule-based wellness heuristics
- No real authentication, export, reminders, or clinician-facing reports yet
