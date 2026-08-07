var Topics = require('ui/Topics');

// Two ways in: a collection row-VM (bound reactively by
// lib/mvvm/controllers/MenuButton) or legacy imperative args (menuEntry callers
// like MayflyMusterSelect). The row-VM path leaves display / greying / tap to
// the binder; the legacy path wires them here.
var rowVm = $.args.rowVm;

// Layout: collection entries are full-width cards sized by the row-VM; legacy
// callers pass small / fill / size as args.
var fill = rowVm ? true : $.args.fill;
var size = rowVm ? rowVm.size : $.args.size;

if ( fill ) {
  $.resetClass( $.button, ["fill"] );
  $.resetClass( $.text, ["margin"] );
} else if ( $.args.small ) {
  $.resetClass( $.button, ["small"] );
}
if ( size ) {
  $.button.height = size;
}

var onClick;
if ( rowVm ) {
  // Display, greying and tap are bound by the binder; only the a11y label is
  // set here. Fall back to description when title is null (see legacy branch).
  $.button.accessibilityLabel = rowVm.title || rowVm.description;
} else {
  if ( $.args.icon ) {
    $.icon.image = $.args.icon;
  } else {
    $.icon.width = "12%";
  }
  $.title.text = $.args.title;
  $.description.text = $.args.description;

  // Fall back to description when title is null (e.g. SampleEditMenu's View/Edit
  // buttons). Without this, iOS Titanium treats the button as a nameless a11y
  // element and hides its children too — invisible to Appium / XCUITest.
  $.button.accessibilityLabel = $.args.title || $.args.description;

  onClick = function (e) {
    if ( $.args.topic ) {
      Topics.fireTopicEvent( $.args.topic, null );
    }
    $.trigger('click');
    e.cancelBubble = true;
  };
  $.button.addEventListener( 'click', onClick );
}

function cleanUp() {
  if ( onClick ) {
    $.button.removeEventListener("click", onClick);
  }
  $.destroy();
  $.off();
}

exports.cleanUp = cleanUp;
