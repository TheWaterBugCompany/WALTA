/*
 * Module: Layout
 * 
 * Holds common constants for laying out user interface.
 * 
 */


// TODO: maybe these should change depending on screen size
exports.TOOLBAR_HEIGHT = '26dip';
exports.TOOLBAR_BUTTON_SIZE =  '22dip';
exports.BUTTON_MARGIN = '2dip';
exports.BUTTON_FONT_SIZE = '8dip';
exports.BUTTON_SIZE = '48dip';
exports.WHITESPACE_GAP = '8dip';
exports.HEADING_SIZE = '16dip';
exports.HEADING_FONT = 'Tahoma';
exports.TEXT_FONT = 'sans-serif';
exports.DETAILS_TEXT_SIZE = '10dip';
exports.QUESTION_TEXT_SIZE = '16dip';
exports.VIDEO_OVERLAY_BUTTON_SIZE = '64dip';
exports.FULLSCREEN_CLOSE_BUTTON_SIZE = '14dip';
exports.PAGER_HEIGHT = '16dip';
exports.THUMBNAIL_WIDTH = '200dip';
exports.MENU_ITEM_HEIGHT = '84dip';
exports.MENU_ITEM_WIDTH = '288dip';
if ( Ti.Platform.osname === 'android' ) {
	exports.BORDER_RADIUS = 45;
	exports.BORDER_RADIUS_MENU_BIG = 35;
	exports.BORDER_RADIUS_MENU_SMALL = 15;
} else {
	exports.BORDER_RADIUS = 25;
	exports.BORDER_RADIUS_MENU_BIG = 15;
	exports.BORDER_RADIUS_MENU_SMALL = 4;
}
