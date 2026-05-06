# `SampleUploader.js` — sample sync (upload side)

Uploads samples sequentially. For each sample:

1. Submit/update the sample record.
2. Upload the site photo.
3. Upload taxa photos.
4. Upload unknown-creature records (with photos).
5. Delete any pending-delete unknown creatures.

**Photo optimisation before upload** (via `PhotoUtils`):

- Anything over 4 MB is resized to max 1600 px wide.
- On iOS, PNG files are converted to JPEG **first** — PNG→JPEG reduces memory pressure during resize, working around a known intermittent corruption issue.

A `delay` parameter threads through all upload calls to rate-limit requests.
