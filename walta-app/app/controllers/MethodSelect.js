var { menuEntry } = require('ui/MenuBuilder');
$.keysearch = menuEntry( $.content, "/images/key-icon.png", "Key", null,
  "Questions to help identify your waterbug.", false, true );

$.speedbug = menuEntry( $.content, "/images/icon-speedbug.png", "Speedbug", null,
  "Look at silhouettes of waterbugs to choose the best match.", false, true );

$.browselist = menuEntry( $.content, "/images/browse-icon.png", "Browse", null,
  "If you know the name or scientific name of your waterbug.", false, true );


$.keysearch.on("click", () => $.trigger("keysearch") );

$.speedbug.on("click", () => $.trigger("speedbug") );

$.browselist.on("click", () => $.trigger("browselist") );

function closeEvent() {
  $.trigger("close");
}
