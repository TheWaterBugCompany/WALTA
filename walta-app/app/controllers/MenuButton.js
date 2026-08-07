var Topics = require('ui/Topics');

if ( $.args.icon) {
  $.icon.image = $.args.icon;
} else {
  $.icon.width = "12%";
}

$.title.text = $.args.title;
$.description.text = $.args.description;
if ( $.args.small ) {
  $.resetClass( $.button, ["small"] );
}
if ( $.args.fill ) {
  $.resetClass( $.button, ["fill"] );
  $.resetClass( $.text, ["margin"] );
}

if ( $.args.size ) {
  $.button.height = $.args.size;
  
}

// Fall back to description when title is null (e.g. SampleEditMenu's
// View/Edit buttons). Without this, iOS Titanium treats the button as
// a nameless a11y element and hides its children too — invisible to
// Appium / XCUITest, even though the text renders visually.
$.button.accessibilityLabel = $.args.title || $.args.description;

// Bindable greyed-out state (MethodSelect greys the non-key options in
// training mode). Behaviour — whether a tap does anything — stays with the
// caller's view-model; this only controls appearance.
var ENABLED_BACKGROUND = "#cfdbf3";
var DISABLED_BACKGROUND = "#e6e6e6";
var greyed = false;

Object.defineProperty($, "disabled", {
  configurable: true,
  get: function () { return greyed; },
  set: function (value) {
    greyed = Boolean(value);
    $.button.backgroundColor = greyed ? DISABLED_BACKGROUND : ENABLED_BACKGROUND;
    $.button.opacity = greyed ? 0.5 : 1;
  },
});

function onClick(e) {
  if ( $.args.topic ) {
    Topics.fireTopicEvent( $.args.topic, null );
  }
  $.trigger('click');
  e.cancelBubble = true;
}

$.button.addEventListener( 'click', onClick );
function cleanUp() {
  $.button.removeEventListener("click", onClick);
  $.destroy();
  $.off();
}

exports.cleanUp = cleanUp;