var Topics = require('ui/Topics');

$.icon.image = $.args.icon;
$.title.text = $.args.title;
$.description.text = $.args.description;

$.button.addEventListener( 'click', function(e) {
  Topics.fireTopicEvent( $.args.topic, null );
  e.cancelBubble = true;
});
