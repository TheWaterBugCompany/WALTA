var Topics = require('ui/Topics');
// Anchor-bar button shown on the training tray in place of Next: grades the tray.
// Imperative like its GoBack/GoForward siblings until the anchor bar moves onto
// the bindView collection pattern (WB-217).
exports.baseController = "NavButton";
$.setLabel( "Assess" );
$.on("click", () => Topics.fireTopicEvent( Topics.ASSESS, null ) );
