// The catalogue of modals that have a Titanium-free lib/controllers/<name>
// screen controller. View.openModal looks a modal up here by name; a modal
// absent from this map still opens as a plain Alloy overlay (the incremental
// migration path — legacy modals keep working until they gain a lib controller).
module.exports = {
  Academy: require("./Academy"),
};
