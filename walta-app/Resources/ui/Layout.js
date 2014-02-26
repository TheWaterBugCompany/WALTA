/*
 * Module: Layout
 * 
 * Holds common constants for laying out user interface.
 * 
 */

// Defaults should be visible on even the smallest devices
exports.TOOLBAR_HEIGHT = '42dip';
exports.TOOLBAR_BUTTON_SIZE =  '32dip';

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

exports.FULLSCREEN_CLOSE_BUTTON_SIZE = '12dip';
exports.FULLSCREEN_CLOSE_BUTTON_BUFFER = '48dip';

exports.PAGER_HEIGHT = '16dip';
exports.PAGER_DOT_SIZE = '12dip';

exports.THUMBNAIL_WIDTH = '200dip';

exports.MENU_ITEM_HEIGHT = '23.5%';
exports.MENU_ITEM_WIDTH = '96%';
exports.MENU_ITEM_WIDTH_2 = '48%';
exports.MENU_GAP = '1.2%';
exports.MENU_LOGO_WIDTH = '58dip';
exports.MENU_LOGO_HEIGHT = '48dip';
exports.MENU_LOGO_LEFT = '30%';
exports.MENU_LOGO_TOP = '8%';
exports.MENU_ICON_WIDTH = '72dip';
exports.MENU_ICON_HEIGHT = '72dip';
exports.MENU_LARGE_BUTTON_HEADING_FONT_SIZE = '23dip';
exports.MENU_LARGE_BUTTON_TEXT_FONT_SIZE = '11dip';



exports.MENU_TITLE_FONT_SIZE = '36dip';
exports.MENU_LOGO_FONT_SIZE = '8dip';

exports.GOBACK_BUTTON_TEXT_WIDTH = '80dip';
exports.TOOLBAR_BUTTON_TEXT = '14dip';

exports.BORDER_RADIUS = 25;
exports.BORDER_RADIUS_MENU_BIG = 15;
exports.BORDER_RADIUS_MENU_SMALL = 4;
exports.BORDER_RADIUS_BUTTON = 2;

// Make screen size or platform specific tweaks here
if ( Ti.Platform.osname === 'android' ) {
	exports.BORDER_RADIUS = 45;
	exports.BORDER_RADIUS_MENU_BIG = 25;
	exports.BORDER_RADIUS_MENU_SMALL = 15;
	exports.BORDER_RADIUS_BUTTON = 7;
} 

