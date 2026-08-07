var { menuEntry } = require('ui/MenuBuilder');

// Residual-Titanium presenter: builds the menu entries and exposes them. The
// screen controller (lib/mvvm/controllers/MethodSelect) binds clicks + the
// training-mode greying via bindView — no decision logic lives here.
var size = "30.67%";
if ( $.args.unknownBug ) {
   size = "25%"
}

$.keysearch = menuEntry( $.content, "/images/key-icon.png", "Key", null,
  "Questions to help identify your waterbug.", false, true, size );

$.speedbug = menuEntry( $.content, "/images/icon-speedbug.png", "Speedbug", null,
  "Look at silhouettes of waterbugs to choose the best match.", false, true, size );

$.browselist = menuEntry( $.content, "/images/browse-icon.png", "Browse", null,
  "If you know the name or scientific name of your waterbug.", false, true, size );

if ( $.args.unknownBug ) {
  $.unknownbug = menuEntry( $.content, "/images/unknown-bug-icon.png", "Unknown bug", null,
  "If you can't identify the bug.", false, true, "16%" );
}

function cleanUp() {
  $.destroy();
  $.off();
  $.keysearch.cleanUp();
  $.browselist.cleanUp();
  $.speedbug.cleanUp();
  if ( $.unknownbug ) $.unknownbug.cleanUp();
}
exports.cleanUp = cleanUp;
