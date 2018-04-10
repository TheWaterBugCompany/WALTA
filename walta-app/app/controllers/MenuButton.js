var Topics = require('ui/Topics');

$.icon.image = $.args.icon;
$.title.text = $.args.title;
$.description.text = $.args.description;

if ( $.args.small ) {
  $.button.width = "165dp";
}

$.button.addEventListener( 'click', function(e) {
  Topics.fireTopicEvent( $.args.topic, null );
  e.cancelBubble = true;
});
