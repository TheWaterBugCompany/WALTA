# Controller lifecycle

Controllers receive injected dependencies via `$.args`. Always implement a `cleanUp()` function that:

- unsubscribes Topics listeners, and
- destroys child views.

`cleanUp()` is called by the navigation system when the screen is unloaded. Forgetting it leaves listeners registered after teardown, which causes test pollution between specs and intermittent UI reactions in production.
