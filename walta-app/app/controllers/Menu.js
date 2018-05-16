var Topics = require('ui/Topics');
var { menuEntry } = require('ui/MenuBuilder');

$.mayfly = menuEntry( $.content, "", "May Flies", Topics.MAYFLY,
  "Look at silhouettes of bugs to choose the best match.", true );

$.order = menuEntry( $.content, "", "Order Level", Topics.ORDER,
  "Questions to help identify your waterbug.", true );

$.detailed = menuEntry( $.content, "", "Detailed", Topics.DETAILED,
  "Questions to help identify your waterbug.", true );

$.browse = menuEntry( $.content, "/images/icon-browse.png", "Browse list", Topics.BROWSE,
  "If you know the name of your bug." );

$.gallery = menuEntry( $.content, "/images/icon-gallery.png", "Gallery", Topics.GALLERY,
  "Browse photos & videos." );

$.about = menuEntry( $.content, "/images/icon-about.png", "About", Topics.ABOUT,
  "About the app." );

$.help = menuEntry( $.content, "/images/icon-help.png", "Help", Topics.HELP,
  "Info to get you started." );
