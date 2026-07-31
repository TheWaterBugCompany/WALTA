// Titanium-free screen controller for the MethodSelect modal.
// Routes the shell's selection events to the navigation Topics, carrying the
// caller's payload (allowAddToSample / surveyType), then closes.
// See docs/patterns/screen-controllers.md.
module.exports = function createMethodSelectController({ view, close, services, args }) {
  const topics = services.topics;
  const { allowAddToSample = false, surveyType = null } = args || {};
  const payload = { allowAddToSample, surveyType };

  const route = (topic, data) => {
    close();
    topics.fireTopicEvent(topic, data);
  };

  view.on("keysearch",  () => route(topics.KEYSEARCH, payload));
  view.on("speedbug",   () => route(topics.SPEEDBUG,  payload));
  view.on("browselist", () => route(topics.BROWSE,    payload));
  view.on("unknownbug", () => route(topics.IDENTIFY,  { taxonId: null }));
  view.on("close",      () => close());

  return {
    dispose() { view.off(); },
  };
};
