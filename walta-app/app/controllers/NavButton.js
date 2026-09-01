// Presenter shell only — the Titanium-free lib/mvvm/controllers/NavButton binds
// the button's colours, caption and tap to a NavButtonViewModel that owns them.
// What is left here is the glue bindView cannot express: an icon view that does
// not exist until a screen asks for one, and the setter API the GoBack/GoForward/
// Assess buttons inherit through Alloy's baseController.
// See docs/patterns/screen-controllers.md.
var NavButtonViewModel = require('mvvm/viewmodels/NavButton');
var createNavButton = require('mvvm/controllers/NavButton');
var { makeBinder } = require('util/bindView');

var bindView = makeBinder(undefined, Alloy.CFG.colors);
var viewModel = new NavButtonViewModel({
    label: "",
    onSelect: () => $.trigger("click", $.args)
});
var bound = createNavButton({ view: $, args: { rowVm: viewModel }, bindView });
var unbindIcon = null;

// Titanium's bubbling isn't something bindView models, and a nav tap must not
// also reach the anchor bar behind it.
function stopBubbling(e) { e.cancelBubble = true; }
$.NavButton.addEventListener( 'click', stopBubbling );

var topic = null;

function setLabel( s ) {
    viewModel.label = s;
}

// The icon is created on demand, so it is bound when it appears rather than in
// the component's own bindings map. Height follows the image so the arrow keeps
// the proportions it was drawn in; pinning both dimensions stretches the
// arrowhead to the button's height.
function addIcon( img, edge ) {
    $.icon = Ti.UI.createImageView( Object.assign( { image: img, id: "icon", width: "26%", height: Ti.UI.SIZE }, edge ) );
    unbindIcon = bindView( { icon: $.icon }, viewModel, { icon: { tintColor: "iconTint" } } );
    return $.icon;
}

// The label takes the space the icon leaves and centres its text in it, so the
// gap either side of the word stays even whatever the word is.
var ICON_SPAN = "32%";
function fillBesideIcon( iconSide ) {
    $.label.width = Ti.UI.FILL;
    $.label[ iconSide ] = ICON_SPAN;
}
function setIconLeft( img ) {
    fillBesideIcon( "left" );
    $.button.insertAt( { view: addIcon( img, { left: "6dp" } ), position: 0 } );
}

function setIconRight( img ) {
    fillBesideIcon( "right" );
    $.button.add( addIcon( img, { right: "6dp" } ) );
}

function setTopic( t ) {
    topic = t;
}

function enable() {
    viewModel.disabled = false;
}

function disable() {
    viewModel.disabled = true;
}

function isEnabled() {
    return !viewModel.disabled;
}

function cleanUp() {
    bound.dispose();
    if ( unbindIcon ) unbindIcon();
    $.NavButton.removeEventListener( 'click', stopBubbling );
    $.destroy();
    $.off();
}

exports.isEnabled = isEnabled;
exports.cleanUp = cleanUp;
exports.enable = enable;
exports.disable = disable;
exports.setTopic = setTopic;
exports.setLabel = setLabel;
exports.setIconLeft = setIconLeft;
exports.setIconRight = setIconRight;
