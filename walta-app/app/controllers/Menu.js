var Topics = require('ui/Topics');

function menuEntry( icon, title, topic, description, small ) {
  var button = Alloy.createController("MenuButton", {
      topic: topic,
      icon: icon,
      title: title,
      description: description,
      small: small
    });
  $.content.add( button.getView() );
  return button;
}

$.mayfly = menuEntry( "", "May Flies", Topics.MAYFLY,
  "Look at silhouettes of bugs to choose the best match.", true );

$.order = menuEntry( "", "Order Level", Topics.ORDER,
  "Questions to help identify your waterbug.", true );

$.detailed = menuEntry( "", "Detailed", Topics.DETAILED,
  "Questions to help identify your waterbug.", true );

$.browse = menuEntry( "/images/icon-browse.png", "Browse list", Topics.BROWSE,
  "If you know the name of your bug." );

$.gallery = menuEntry( "/images/icon-gallery.png", "Gallery", Topics.GALLERY,
  "Browse photos & videos." );

$.about = menuEntry( "/images/icon-about.png", "About", Topics.ABOUT,
  "About the app." );

$.help = menuEntry( "/images/icon-help.png", "Help", Topics.HELP,
  "Info to get you started." );
