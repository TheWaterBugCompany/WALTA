function menuEntry( container, icon, title, topic, description, small ) {
  var button = Alloy.createController("MenuButton", {
      topic: topic,
      icon: icon,
      title: title,
      description: description,
      small: small
    });
  container.add( button.getView() );
  return button;
}

exports.menuEntry = menuEntry;
