# Window orientation

Why every window opened on iOS is briefly held to one landscape, and where that
happens.

## The pattern

`lib/ios/logic/PlatformSpecific.js` calls `holdCurrentOrientation` on each
window before opening it:

```js
holdCurrentOrientation( win, Ti.Gesture );
```

That narrows the window's `orientationModes` to the single orientation the
interface is already in, and restores the modes declared in TSS as soon as the
device reports an orientation of its own.

## Why

Titanium's root view controller decides a window's orientation from an
instance variable it only ever sets from a device-orientation notification. A
phone held still through a cold launch sends none, so that variable is still
unset when the first window opens. Titanium then falls back to a fixed
preference — landscape-left — and force-rotates the interface to it, logging:

```
Forcing rotation to 4. Current Orientation 3. This is not good UI design. Please reconsider.
```

Hold the phone in landscape-left and the fallback happens to be right. Hold it
the other way and the app opens a half turn out, and stays that way until
something makes the device report an orientation. Declaring both landscapes
does not help: with both allowed, the fallback still picks landscape-left.

Holding the window to the orientation the interface is already in leaves
Titanium nothing to force. `win.orientation` is the orientation UIKit itself
chose, which is why it is the value to hold to — note that `Ti.Gesture.orientation`
is a different reading (the device's own), and reports unknown when the phone is
flat.

Android pins its activities to `sensorLandscape` in the manifest and is
unaffected, which is why the call site is the iOS half of `PlatformSpecific`.

## See also

- [visual-regression.md](visual-regression.md) — capture windows pin an
  orientation for the same underlying reason
- `test/WindowOrientation_spec.js` — the hold-and-restore behaviour
- `walta-app/app/spec/View_spec.js` — the guard that an opened window is held
