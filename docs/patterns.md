# Patterns & Conventions

Cross-cutting conventions for controllers, storage, and shared state. Patterns specific to one subsystem live in their own doc — see [viewmodels.md](viewmodels.md), [toolbar-buttons.md](toolbar-buttons.md), [device-specs.md](device-specs.md).

## Controller communication

Controllers communicate via `Topics` — a pub/sub event bus over Ti's global event system, see `lib/ui/Topics.js`. Use `Topics.fireTopicEvent(Topics.SOME_EVENT, payload)` to publish and `Topics.subscribe(Topics.SOME_EVENT, handler)` to listen.

Direct function calls are used **within** a controller. Topics are used **across** controllers.

## Controller lifecycle

Controllers receive injected dependencies via `$.args`. Always implement a `cleanUp()` function that:

- unsubscribes Topics listeners, and
- destroys child views.

`cleanUp()` is called by the navigation system when the screen is unloaded. Forgetting it leaves listeners registered after teardown, which causes test pollution between specs and intermittent UI reactions in production.

## No `Alloy.Globals`

Don't read or write `Alloy.Globals.*` for shared state — it's a deprecated anti-pattern that makes data flow invisible and tests brittle.

Pass shared objects (e.g. the loaded `key` from `walta-taxonomy`) explicitly via `$.args` from parent controllers to children, including sub-controllers created with `Alloy.createController(name, { key, ... })`. The key is threaded from the topmost controller that loads it down through every screen and sub-widget that needs it.

## Photo paths

- **User-taken photos** live in `Ti.Filesystem.applicationDataDirectory` and are stored as **relative paths** (no leading `/`).
- **Taxonomy reference images** live in `Ti.Filesystem.resourcesDirectory` and are stored as **absolute paths** (leading `/`).

`PhotoUtils.absolutePath()` handles both conventions — call it whenever you need the resolved filesystem path for either kind.

## `Ti.App.Properties` keys

Persistent storage uses `Ti.App.Properties.setObject` / `getObject`. Keys currently in use:

| Key | Holds |
|-----|-------|
| `userAccessTokenLive` | User auth token object |
| `appAccessTokenLive` | App-level OAuth token object |
| `userAccessUsername` | Logged-in email |
