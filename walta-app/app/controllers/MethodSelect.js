var { menuEntry } = require('ui/MenuBuilder');

var size = "30.67%";
if ( $.args.unknownBug ) {
   size = "25%"
}

$.keysearch = menuEntry( $.content, "/images/key-icon.png", "Key", null,
  "Questions to help identify your waterbug.", false, true, size );
$.keysearch.on("click", () => $.trigger("keysearch") );

$.speedbug = menuEntry( $.content, "/images/icon-speedbug.png", "Speedbug", null,
  "Look at silhouettes of waterbugs to choose the best match.", false, true, size );
$.speedbug.on("click", () => $.trigger("speedbug") );

$.browselist = menuEntry( $.content, "/images/browse-icon.png", "Browse", null,
  "If you know the name or scientific name of your waterbug.", false, true, size );
$.browselist.on("click", () => $.trigger("browselist") );

if ( $.args.unknownBug ) {
  $.unknownbug = menuEntry( $.content, "/images/unknown-bug-icon.png", "Unknown bug", null,
  "If you can't identify the bug.", false, true, "16%" );
  $.unknownbug.on("click", () => $.trigger("unknownbug") );
}

function closeEvent() {
  $.trigger("close");
}

function cleanUp() {
  $.destroy();
  $.off();
  $.keysearch.cleanUp();
  $.browselist.cleanUp();
  $.speedbug.cleanUp();
}
exports.cleanUp = cleanUp;
