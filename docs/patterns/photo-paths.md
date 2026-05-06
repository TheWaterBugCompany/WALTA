# Photo paths

- **User-taken photos** live in `Ti.Filesystem.applicationDataDirectory` and are stored as **relative paths** (no leading `/`).
- **Taxonomy reference images** live in `Ti.Filesystem.resourcesDirectory` and are stored as **absolute paths** (leading `/`).

`PhotoUtils.absolutePath()` handles both conventions — call it whenever you need the resolved filesystem path for either kind.
