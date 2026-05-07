# Gutty Feature Log

## 2026-05-07 - Upload Quality Audit

- Added a last-upload audit under Data controls so users can see whether an import contained detailed stool data or timing-only entries.
- Import history now stores detailed count, timing-only count, added count, and a plain-language note about what the upload can support.
- Import status messages now explain when Gutty can only analyze frequency/gaps versus richer stool-form patterns.

## 2026-05-05 - Confidence-aware Health Scoring

- Added an evidence-quality panel so uploaded logs are graded by detailed logs, timing-only imports, completeness, coverage, and logs per week.
- Changed Gut Check scoring so frequency-only uploads no longer look medically healthy by default; they are labeled as low clinical confidence until users add Bristol type, color, comfort, symptoms, and red flags.
- Updated analysis language to separate pattern tracking from diagnosis and to prioritize clinician review for blood, black/tarry stool, severe pain, fever, or dehydration.

## 2026-05-05

- Added an on-page **Erase poop logs** control under Data controls.
- The new erase action deletes local poop logs and import history from the current browser while keeping the Google account session, community notes, and donation pledge drafts.
- Kept the existing **Clear local data** action for the full local reset flow.
- Bumped frontend assets to `20260505-erase-logs` so Vercel and Chrome load the updated UI and behavior.

## 2026-05-05 - Markdown Upload

- Added Markdown upload support for poop situation files under Data controls.
- Users can upload `.md` or `.markdown` files with fields like `When`, `Bristol`, `Color`, `Foods`, `Symptoms`, `Flags`, and `Notes`.
- Markdown prose still imports as a notes-only bowel movement entry when structured fields are missing.
- Bumped frontend assets to `20260505-md-upload`.

