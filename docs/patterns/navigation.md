# `Navigation.js` — screen history stack

Maintains a history stack of `{ ctl, args }` entries. Behaviour:

- **`openController()`** calls `garbageCollectControllers()` first. If the target screen is already in history (matched by controller name + node id), everything above that point is truncated and a `PAGES_UNLOADED` topic is fired. This prevents the user from building up navigation loops.
- **Unsaved-changes prompt:** if a `SiteDetails` screen is in the truncated range and has unsaved changes, the user is prompted to discard or submit before navigation proceeds.
- **`goBack()`** re-opens the second-to-last entry — *not* a native back gesture; the whole screen is re-rendered.
