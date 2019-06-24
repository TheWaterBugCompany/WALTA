function menuEntry( container, icon, title, topic, description, small, fill = false, size = "30.67%" ) {
  var button = Alloy.createController("MenuButton", {
      topic: topic,
      icon: icon,
      title: title,
      description: description,
      small: small,
      fill: fill,
      size: size
    });
  container.add( button.getView() );
  return button;
}

exports.menuEntry = menuEntry;
