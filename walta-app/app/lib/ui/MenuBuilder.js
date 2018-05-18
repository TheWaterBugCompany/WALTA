function menuEntry( container, icon, title, topic, description, small, fill = false ) {
  var button = Alloy.createController("MenuButton", {
      topic: topic,
      icon: icon,
      title: title,
      description: description,
      small: small,
      fill: fill
    });
  container.add( button.getView() );
  return button;
}

exports.menuEntry = menuEntry;
