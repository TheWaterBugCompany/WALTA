# Anchor bar insets

Why the anchor bar grows on Android, and why the safe area alone is not enough
to keep its buttons tappable.

## The pattern

`TopLevelWindow`'s `updateSafeArea` asks for the clearance the bar's controls
need at the bottom, and grows the bar by it rather than moving the bar up:

```js
let clearance = bottomClearance( padding, PlatformSpecific.convertDipToSystem );
anchorBar.getView().height = $.TopLevelWindow.rect.height * BAR_FRACTION + clearance;
anchorBar.leftTools.bottom = clearance;
anchorBar.rightTools.bottom = clearance;
anchorBar.title.bottom = clearance;
```

The bar keeps its place against the screen edge, so its background still reaches
the bottom and nothing looks different — only the touch targets move.

## Why

Under gesture navigation, Android reserves a strip along the bottom of the screen
for the home gesture and consumes touches there **before the app sees them**. A
control drawn in it is dead: no `touchstart`, no `click`, nothing to log. It
presents as a button that needs several attempts, which reads as bad finger
placement rather than a defect.

The safe area does not cover that strip, and that is not a Titanium bug.
`safeAreaPadding` is computed from `systemBars() | displayCutout()` — the region
the bars *occlude*. The gesture strip is a different inset type, about gesture
*conflict*, which Titanium does not expose at all. Measured on two devices at
different densities, both report the same values:

| | navigation bar | gesture strip |
|---|---|---|
| 560dpi phone | 84px = 24dp | 112px = 32dp |
| 420dpi emulator | 63px = 24dp | 84px = 32dp |

So the strip is 8dp deeper than the safe area reports, and `bottomClearance`
takes the larger of the two.

**Only when there is a bottom inset at all.** Three-button navigation has no
bottom gesture strip — in landscape the navigation bar moves to the right edge
and the window reports no bottom source — so clearance is zero and the bar keeps
its original height. Reserving space unconditionally would be dead bar.

## Caveat

32dp is Android's platform constant, not a value read from the device, because
Titanium exposes no way to query `mandatorySystemGestures`. It matched on both
devices tested. An OEM that overlays a *larger* strip than its navigation bar
inset would under-clear; reading the real inset would need a native module.

## See also

- `test/anchorBarClearance_spec.js` — the clearance rule, including the
  no-bottom-inset case
- `walta-app/app/controllers/TopLevelWindow.js` — where the clearance is applied,
  alongside the left/right safe-area padding iOS needs in landscape
- [window-orientation.md](window-orientation.md) — the other place a platform detail
  forces the window layer's hand
