# Photo paths

- **User-taken & downloaded photos** (site photos, creature/taxon photos) live in `Ti.Filesystem.applicationDataDirectory` and are stored as **relative names** (no leading `/`), e.g. `taxon_12_171_1758403516.jpg`.
- **Taxonomy reference images** live in `Ti.Filesystem.resourcesDirectory` and are stored as **absolute paths** (leading `/`).

`PhotoUtils.absolutePath()` resolves both conventions — call it whenever you need the resolved filesystem path, and never assign a stored path straight to `ImageView.image`.

## Never store an absolute container path (WB-88)

On iOS the app's data-container path includes a UUID (`…/Application/<UUID>/Documents/`) that **changes across app updates/reinstalls**. A stored absolute `file:///…/<UUID>/…` path therefore goes stale — the file still exists, but under a *different* container, so the old path resolves to nothing and the image renders blank.

Two safeguards keep this from biting:

1. **Write relative.** `taxa.setPhoto` / `sample.setSitePhoto` persist the bare filename, not `nativePath`.
2. **Heal on read.** `absolutePath()` collapses any `file:///…` value to its basename and re-resolves it against the *current* `applicationDataDirectory`, so legacy rows that already hold a stale absolute path self-heal the next time they're read. The pure decision lives in `resolvePhotoLocation()` (unit-tested in `test/util/PhotoUtils_spec.js`).
