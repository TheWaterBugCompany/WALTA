var Topics = require('ui/Topics');
var { setAccessibilityLabel } = require('ui/ViewUtils');

$.icon.image = $.args.icon;
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

setAccessibilityLabel( $.button, "submenu", $.args.title ,"button" );

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