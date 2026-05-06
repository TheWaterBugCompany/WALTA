# Controller communication

Controllers communicate via `Topics` — a pub/sub event bus over Ti's global event system, see `lib/ui/Topics.js`. Use `Topics.fireTopicEvent(Topics.SOME_EVENT, payload)` to publish and `Topics.subscribe(Topics.SOME_EVENT, handler)` to listen.

Direct function calls are used **within** a controller. Topics are used **across** controllers.
