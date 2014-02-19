/*
 * Module: Layout
 * 
 * Holds common constants for laying out user interface.
 * 
 */


// TODO: maybe these should change depending on screen size
exports.TOOLBAR_HEIGHT = '48dip';
exports.TOOLBAR_BUTTON_SIZE =  '38dip';
exports.BUTTON_MARGIN = '8dip';
exports.BUTTON_FONT_SIZE = '8dip';
exports.BUTTON_SIZE = '48dip';
exports.WHITESPACE_GAP = '8dip';
exports.HEADING_SIZE = '22dip';
exports.HEADING_FONT = 'Tahoma';
exports.TEXT_FONT = 'sans-serif';
exports.DETAILS_TEXT_SIZE = '10dip';
exports.QUESTION_TEXT_SIZE = '16dip';
exports.VIDEO_OVERLAY_BUTTON_SIZE = '64dip';
exports.FULLSCREEN_CLOSE_BUTTON_SIZE = '4%';
exports.PAGER_HEIGHT = '16dip';
exports.THUMBNAIL_WIDTH = '200dip';
exports.MENU_ITEM_HEIGHT = '18%';
exports.MENU_ITEM_WIDTH = '96%';
exports.MENU_ITEM_WIDTH_2 = '30.5%';
exports.MENU_GAP = '2%';
exports.MENU_LOGO_WIDTH = '92dip';
exports.MENU_LOGO_HEIGHT = '69dip';
exports.MENU_ICON_WIDTH = '92dip';
exports.MENU_ICON_HEIGHT = '92dip';
if ( Ti.Platform.osname === 'android' ) {
	exports.BORDER_RADIUS = 45;
	exports.BORDER_RADIUS_MENU_BIG = 35;
	exports.BORDER_RADIUS_MENU_SMALL = 15;
	exports.BORDER_RADIUS_BUTTON = 7;
} else {
	exports.BORDER_RADIUS = 25;
	exports.BORDER_RADIUS_MENU_BIG = 15;
	exports.BORDER_RADIUS_MENU_SMALL = 4;
	exports.BORDER_RADIUS_BUTTON = 2;
}
