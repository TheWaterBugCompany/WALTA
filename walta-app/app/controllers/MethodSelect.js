var { menuEntry } = require('ui/MenuBuilder');
$.keysearch = menuEntry( $.content, "/images/icon-alt-key.png", "Key", null,
  "Look at silhouettes of bugs to choose the best match.", false, true );

$.speedbug = menuEntry( $.content, "/images/icon-speedbug.png", "Speedbug", null,
  "Questions to help identify your waterbug.", false, true );

$.browselist = menuEntry( $.content, "/images/icon-browse.png", "Browse", null,
  "Questions to help identify your waterbug.", false, true );


$.keysearch.on("click", () => $.trigger("keysearch") );

$.speedbug.on("click", () => $.trigger("speedbug") );

$.browselist.on("click", () => $.trigger("browselist") );

$.close_button.on("click", () => $.trigger("close") );
