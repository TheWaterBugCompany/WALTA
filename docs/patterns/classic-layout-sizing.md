# Classic layout sizing

Titanium's Classic layout resolves percentages against a parent it has already measured. Give it a parent it *hasn't*, and the answer depends on when you ask — which is how the same screen renders at two different sizes with no source change.

## Never size a parent from a child the child sizes itself against

```js
// styles/Screen.tss — a circle: the group's height comes from the field,
// the field's margins come from the group.
".shrinkWrap": { width: Ti.UI.SIZE, height: Ti.UI.SIZE }   // the group
".textField":  { top: "2%", bottom: "2%", height: Ti.UI.SIZE }  // the child
```

There is no fixed point here, so Ti Classic settles it against whatever measurement context it is in and caches the result. Re-parent the view, close a window over the screen, or force a relayout, and it settles somewhere else. The symptom is a control that renders at one of two stable sizes, apparently at random — and a screenshot test that flaps.

The fix is to make one end definite, at the site that has the circle:

```js
".fieldGroup": { width: Ti.UI.FILL, height: Ti.UI.SIZE }  // width from the column
".textField":  { top: "2dp", bottom: "2dp", height: "40dp" }  // height from nothing
```

Percentages are fine — *against a definite ancestor*. `Register.tss` sizes its fields `height: "14%"` of a panel that is itself a percentage of the window, and that is stable. It is the `Ti.UI.SIZE` parent that breaks it.

## Do not combine `width` with `left`/`right` on the same child

Ti Classic expands the parent to satisfy both, so the content ends up wider than the viewport. Inside a ScrollView that shows up as a phantom horizontal pan — and `scrollType: "vertical"` will not stop it, because the overflow is real. Fix the overflow, not the scrolling. See the note in [SiteDetails.tss](../../walta-app/app/styles/SiteDetails.tss).

## On iOS, `content` is measured twice

`applyKeyboardTweaks` ([lib/ui/Layout.js](../../walta-app/app/lib/ui/Layout.js)) re-parents a screen's `content` into a ScrollView so a focused field can scroll clear of the keyboard. That happens on iOS only, and one turn of the event loop *after* the screen is first laid out — so every percentage- or `SIZE`-sized view under `content` is measured once in the window and again in the ScrollView.

Anything with a definite size is unaffected. Anything circular resolves differently in the two contexts, and which one a user (or a screenshot) sees is a race. When a screen using this helper renders inconsistently, measure a widget's `rect` either side of the re-parent before looking anywhere else:

```js
await controllerOpenTest( ctl );
var before = ctl.someField.rect.height;      // ctl.content is a Ti.UI.View
await waitFor( () => ctl.content.apiName === "Ti.UI.ScrollView" );
expect( ctl.someField.rect.height ).to.equal( before );
```

That comparison is also the regression test — assert the sample was taken before the wrap, or a mistimed run passes without testing anything.

## Reading sizes

`view.rect` is not JSON-serialisable — `JSON.stringify(view.rect)` gives `{}`. Read `x`/`y`/`width`/`height` explicitly, or a spec comparing sizes will compare `undefined` to `undefined` and pass.

## See also

- [visual-regression.md](visual-regression.md) — the screenshot suite that catches these when a spec doesn't
- [window-orientation.md](window-orientation.md) — the other place Titanium measures a screen twice
