# No `Alloy.Globals`

Don't read or write `Alloy.Globals.*` for shared state — it's a deprecated anti-pattern that makes data flow invisible and tests brittle.

Pass shared objects (e.g. the loaded `key` from `walta-taxonomy`) explicitly via `$.args` from parent controllers to children, including sub-controllers created with `Alloy.createController(name, { key, ... })`. The key is threaded from the topmost controller that loads it down through every screen and sub-widget that needs it.
