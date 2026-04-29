# Toolbar (Anchor Bar) Buttons

Screens that extend `TopLevelWindow` get an **anchor bar** at the top — a header strip with a title and slots for left/right tools. This is the standard place for nav and screen-level action buttons (Back, Next, Done, Sync). Don't put action buttons in the screen body if they belong on the toolbar.

## Adding a button

The base `TopLevelWindow` controller exposes `getAnchorBar()`. From a screen controller:

```js
var acb = $.getAnchorBar();
$.syncButton = Alloy.createController("NavButton");
$.syncButton.setLabel("Sync");
$.syncButton.on("click", syncNowClicked);
acb.addTool( $.syncButton.getView() );
```

Then in the window's `cleanUp` listener, call `$.syncButton.cleanUp();` so the inner click listener is removed.

`addTool(view)` appends to the right tool slot by default. Pass `addTool(view, true)` to put it on the left.

## Built-in button controllers

- **`NavButton`** — generic right-side button. `setLabel(text)`, `enable()`, `disable()`, `setIconLeft(img)`, `setIconRight(img)`. Fires `"click"` on its `$` controller.
- **`GoBackButton`** — back button that fires a Topic when clicked. Constructed with `{ topic, slide, readonly }`.
- **`GoForwardButton`** — forward equivalent.

Examples in [walta-app/app/controllers/Summary.js:16-27](../walta-app/app/controllers/Summary.js#L16-L27), [walta-app/app/controllers/Habitat.js](../walta-app/app/controllers/Habitat.js), [walta-app/app/controllers/SiteDetails.js](../walta-app/app/controllers/SiteDetails.js).

## Label vs accessibilityLabel

`NavButton.setLabel(s)` does two things:

- Sets visible text to `s.toUpperCase()` ("Sync" → "SYNC")
- Sets `accessibilityLabel` to `s` unchanged ("Sync")

Acceptance/spec tests select by accessibility identifier, so they match the original-case string. Don't write `this.click("SYNC")` — write `this.click("Sync")`.

## Selector convention (Appium)

The acceptance-test base screen wraps selectors as `~<label>.` — Titanium appends a period to its accessibility identifiers, which discriminates explicitly-set `accessibilityLabel` values from iOS auto-derived labels (e.g. a `<Label text="Sync"/>` body label without `accessibilityLabel` won't match `~Sync.`). See [features/support/base-screen.js:53-56](../features/support/base-screen.js#L53-L56).
