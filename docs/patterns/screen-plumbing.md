# Screen plumbing

How a tap on one screen turns into another screen opening: the wiring between Topics, Navigation, View, and the per-controller lifecycle. Read this before adding a new screen, a new cross-screen event, or wondering where some state lives.

## End-to-end flow

A user tap → controller fires a Topic → `Main.js` routes it → `Navigation.openController()` is called → `Navigation` dedupes against the history stack → `View.openView()` constructs the Alloy controller and opens its window → the controller renders, subscribes to its own Topics, and waits for its own teardown signal.

The four pieces in detail:

- **`controllers/Main.js`** — boot/router. Subscribes to every navigation Topic and maps it to a `Navigation.openController(name, data)` call. Also bootstraps the first screen (`Menu`).
- **`lib/ui/Topics.js`** — pub/sub event bus over Ti's global event system. The only way controllers talk to each other.
- **`lib/logic/Navigation.js`** — history stack. Decides whether to push, replace, or truncate; handles the unsaved-changes prompt.
- **`lib/logic/View.js`** — the actual `Alloy.createController()` + `controller.open()` call, plus the unsaved-changes alert dialog.

## The bootstrap (`Main.js`)

`Main.js` receives its services via `$.args`:

```js
var { System, Key, Survey, Navigation } = $.args;
```

`startApp(options)` then subscribes a topic-to-screen handler for every navigation event the app uses:

```js
routePromise(Topics.HOME,        (data) => Navigation.openController("Menu", data));
routePromise(Topics.LOGIN,       (data) => Navigation.openController("LogIn", data));
routePromise(Topics.SAMPLETRAY,  (data) => Navigation.openController("SampleTray", data));
routePromise(Topics.HISTORY,     (data) => Navigation.openController("SampleHistory", data));
// …
```

Plus a few specialised handlers (the survey-start topics — `MAYFLY`, `ORDER`, `DETAILED` — kick off `Survey.startSurvey(...)` first, then route to `SITEDETAILS`).

`startApp` ends by opening the first screen:

```js
await Navigation.openController("Menu", {});
```

To wire a new screen into the navigation graph, add a `Topics.<NEW_TOPIC>` constant in `lib/ui/Topics.js` and a `routePromise(...)` line in `Main.js`. Don't open controllers from the screen that triggers the navigation — fire a Topic.

## Topics — cross-controller communication

Controllers communicate via `Topics`, a pub/sub bus over Ti's global event system. See `lib/ui/Topics.js`.

```js
Topics.fireTopicEvent(Topics.SOME_EVENT, payload);   // publish
Topics.subscribe(Topics.SOME_EVENT, handler);        // listen
```

**Direct function calls within a controller; Topics across controllers.** A button on `Menu` doesn't `Alloy.createController("LogIn")` itself — it fires `Topics.LOGIN`, and `Main.js` decides what that means.

This indirection is what lets `Navigation.js` decide between push / replace / truncate without each caller knowing.

## Navigation — the history stack

`Navigation.openController(name, args)` is the single entry point for opening a screen. It maintains a history stack of `{ ctl, args }` entries and runs `garbageCollectControllers()` first:

- If the target screen is **already** in history (matched by controller name + node id), everything above that point is truncated and a `PAGES_UNLOADED` Topic is fired. This prevents the user building up navigation loops.
- If a `SiteDetails` screen is in the truncated range and has unsaved changes, the user is prompted to discard or submit before navigation proceeds (via `View.askDiscardEdits()`).

`Navigation.goBack()` re-opens the second-to-last entry — *not* a native back gesture; the whole screen is re-rendered.

## View — the actual screen opener

`lib/logic/View.js` builds the Alloy controller, attaches its Titanium-free
screen controller (if one is registered), and opens the window — returning a
Promise that resolves on the controller's `window-opened` event:

```js
View.prototype.openView = function (ctl, args) {
  return new Promise((resolve) => {
    currentController = Alloy.createController(ctl, args);
    this.attachScreenController(ctl, currentController);   // registered? build + dispose-on-close
    currentController.on("window-opened", resolve);
    currentController.open();
  });
};
```

`attachScreenController` looks `ctl` up in `lib/mvvm/controllers/registry.js` and,
if present, instantiates its screen controller to drive the binding, disposing it
on the window's `close` event. This is the same registry `openModal` uses — see
[screen-controllers.md](screen-controllers.md). A screen with no registered
controller just opens as a plain Alloy window.

`View` also exposes `askDiscardEdits()`, the unsaved-changes alert dialog used by
Navigation when truncating past a `SiteDetails` with unsaved state.

`Navigation` calls `View.openView(...)`; nothing else should.

## Per-controller lifecycle

Each screen controller follows the same shape:

1. **Receive injected dependencies via `$.args`.** Never reach for module-level globals (see "Pass shared state via `$.args`" below).
2. **Subscribe to any Topics it needs to listen for** at top-level.
3. **Implement `cleanUp()`** that:
   - unsubscribes Topics listeners, and
   - destroys child views and child controllers.

`cleanUp()` is called by Navigation when the screen is unloaded (truncated from history, or replaced by `goBack`). Forgetting it leaves listeners registered after teardown — which causes test pollution between specs **and** intermittent UI reactions in production (a stale subscriber reacts to a topic from the next session).

## Pass shared state via `$.args`, never `Alloy.Globals`

Don't read or write `Alloy.Globals.*` for shared state. It's a deprecated anti-pattern that makes data flow invisible and tests brittle.

Pass shared objects (e.g. the loaded `key` from `walta-taxonomy`) explicitly via `$.args` from parent controllers to children, including sub-controllers created with `Alloy.createController(name, { key, ... })`. The key is threaded from the topmost controller that loads it down through every screen and sub-widget that needs it.

This is the same mechanism `Main.js` uses to receive `System / Key / Survey / Navigation` — services flow down through `$.args`, not through globals.

## Persistent state — `Ti.App.Properties`

For state that has to survive an app restart (auth tokens, the logged-in user's email), use `Ti.App.Properties.setObject` / `getObject`. Keys currently in use:

| Key | Holds |
|-----|-------|
| `userAccessTokenLive` | User auth token object |
| `appAccessTokenLive` | App-level OAuth token object |
| `userAccessUsername` | Logged-in email |

When you add a new persistent-state key, add the row above so the registry stays accurate.

## OS-level capabilities — `System.js`

`lib/logic/System.js` is a small wrapper for OS-level capabilities — the things that aren't really "the app" but "the platform underneath it":

- `requestPermission(permissions)` — Android runtime permissions, returns a Promise (no-op `Promise.resolve({ success: true })` on iOS).
- `closeApp()` — calls into `PlatformSpecific.appShutdown()`.

`System` is one of the services threaded into `Main.js` via `$.args` and into anything below that needs to ask for permissions or shut down.
