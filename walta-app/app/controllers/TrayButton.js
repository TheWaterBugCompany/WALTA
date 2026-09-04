// Presenter shell only — the Titanium-free lib/mvvm/controllers/TrayButton binds
// the icon's visibility and its tap to a TrayButtonViewModel that owns both.
// See docs/patterns/screen-controllers.md.
var Topics = require('ui/Topics');
var TrayButtonViewModel = require('mvvm/viewmodels/TrayButton');
var createTrayButton = require('mvvm/controllers/TrayButton');
var { makeBinder } = require('util/bindView');

var bindView = makeBinder(undefined, Alloy.CFG.colors);
var viewModel = new TrayButtonViewModel({
    topics: Topics,
    allowAddToSample: $.args.allowAddToSample,
    training: $.args.training,
    onSelect: (topic) => Topics.fireTopicEvent( topic, null )
});
var bound = createTrayButton({ view: $, args: { vm: viewModel }, bindView });

// Titanium's bubbling isn't something bindView models, and a tool tap must not
// also reach the anchor bar behind it.
function stopBubbling(e) { e.cancelBubble = true; }
$.icon.addEventListener( 'click', stopBubbling );

function cleanUp() {
    bound.dispose();
    $.icon.removeEventListener( 'click', stopBubbling );
    $.destroy();
    $.off();
}

exports.cleanUp = cleanUp;
