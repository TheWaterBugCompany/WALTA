var Topics = require('ui/Topics');

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

function onClick(e) {
  if ( $.args.topic ) {
    Topics.fireTopicEvent( $.args.topic, null );
  }
  $.trigger('click');
  e.cancelBubble = true;
}

$.button.addEventListener( 'click', onClick );
function cleanUp() {
  $.button.removeEventListner("click", onClick);
  $.destroy();
  $.off();
}

exports.cleanUp = cleanUp;