// Shared ice-cube tray view fragment (the ScrollView#content > View#tray
// scaffold), required by both SampleTray and TrainingTray so the Titanium
// markup itself isn't duplicated between the two screens. A plain Alloy
// controller, not a screen/mvvm one — its only job is re-exporting its named
// views so the requiring screen can bind against them (Alloy's <Require>
// doesn't flatten a required controller's ids into the parent's `$`
// namespace, with or without type="view" — see PhotoSelect for the same
// shape). See docs/patterns/screen-controllers.md.
exports.content = $.content;
exports.tray = $.tray;
