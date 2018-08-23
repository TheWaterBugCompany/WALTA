var Topics = require('ui/Topics');
function mayflyClick() {
  Topics.fireTopicEvent( Topics.MAYFLY, null );
}

function detailedClick() {
  Topics.fireTopicEvent( Topics.DETAILED, null );
}

function browseClick() {
  Topics.fireTopicEvent( Topics.BROWSE, null );
}

function galleryClick() {
  Topics.fireTopicEvent( Topics.GALLERY, null );
}

function aboutClick() {
  Topics.fireTopicEvent( Topics.ABOUT, null );
}

function helpClick() {
  Topics.fireTopicEvent( Topics.HELP, null );
}
