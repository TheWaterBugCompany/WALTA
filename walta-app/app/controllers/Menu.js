var Topics = require('ui/Topics');

function menuEntry( icon, title, topic, description ) {
  var button = Alloy.createController("MenuButton", {
      topic: topic,
      icon: icon,
      title: title,
      description: description
    });
  $.content.add( button.getView() );
  return button;
}

$.speedbug = menuEntry( "/images/icon-speedbug.png", "Speedbug", Topics.SPEEDBUG,
  "Look at silhouettes of bugs to choose the best match." );

$.keysearch = menuEntry( "/images/icon-alt-key.png", "ALT key", Topics.KEYSEARCH,
  "Questions to help identify your waterbug." );

$.browse = menuEntry( "/images/icon-browse.png", "Browse list", Topics.BROWSE,
  "If you know the name of your bug." );

$.help = menuEntry( "/images/icon-help.png", "Help", Topics.HELP,
  "Info to get you started." );

$.gallery = menuEntry( "/images/icon-gallery.png", "Gallery", Topics.GALLERY,
  "Browse photos & videos." );

$.about = menuEntry( "/images/icon-about.png", "About", Topics.ABOUT,
  "About the app." );
