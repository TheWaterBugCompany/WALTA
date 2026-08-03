// Titanium-free lib controller for the SyncFeedback modal. View.openModal builds
// it after adding the overlay to the window, so it starts the sync on open; it
// also owns closing itself when the session ends (manual logout, or a rejected
// token mid-sync dropping to login) — logic that used to live in the
// SampleHistory window shell. The Ti view + its bindView stay in the Alloy shell
// (controllers/SyncFeedback.js), which exposes start()/cleanUp().
module.exports = function createSyncFeedback({ view, close, services }) {
  const topics = services.topics;
  view.start();

  // The Alloy shell fires "close" when either close button is tapped
  // (vm.close → $.trigger("close")); route it to the modal seam.
  const onClose = () => close();
  view.on("close", onClose);

  const onLoggedOut = () => close();
  topics.subscribe(topics.LOGGEDOUT, onLoggedOut);

  return {
    dispose() {
      view.off("close", onClose);
      topics.unsubscribe(topics.LOGGEDOUT, onLoggedOut);
    },
  };
};
