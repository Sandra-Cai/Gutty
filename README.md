# Gutty

Gutty is a free local gut health analyzer for logging your poop situation, noticing patterns, and sharing opt-in community notes.

The pitch:

> Everyone is saying you should trust your gut. But how do you know your gut is even trustworthy?

Gutty helps you track Bristol stool type, color, amount, urgency, comfort, hydration, fiber, stress, notes, and red flags. It gives simple wellness guidance and points out symptoms that should not be crowdsourced.

## What it does

- Logs poop situations in a local SQLite database at `data/gutty.db`
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

## Medical note

Gutty is for personal tracking and general wellness education. It is not a diagnosis, treatment plan, or medical advice. Red flags like blood in stool, tarry black stool, severe abdominal pain, fever, dehydration, pale stool that persists, or symptoms that do not resolve should be discussed with a medical professional.

## Project structure

- `app.py`: local server, API routes, SQLite setup, gut pattern analyzer, community posts
- `static/index.html`: Gutty app markup
- `static/styles.css`: responsive app styling
- `static/app.js`: frontend behavior
- `docs/PRODUCT_NOTES.md`: product notes and roadmap

## Current limitations

- Community posts are local-only demo data
- The analyzer uses simple rule-based wellness heuristics
- No authentication, export, reminders, or clinician-facing reports yet
