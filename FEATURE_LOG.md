# Gutty Feature Log

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

