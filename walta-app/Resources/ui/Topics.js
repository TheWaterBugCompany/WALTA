/*
 * A global list of all PubSub topics this applciation uses
 * PubSub events provide a loosely coupled interface to
 * navigation logic with the app.
 */
var topics = { 
	
	HOME: 'home',
	SETTINGS: 'settings',
	INFO: 'info',
	
	// Open the video player
	VIDEO: 'video', // the filename is passed as parameter
	
	// Backwards on the decision tree
	BACK: 'back',
	
	// Forwards on the decision tree passing choice as parameter
	FORWARD: 'forward', // the choice number is passed as parameter
	
	// Jumps to a position in the key
	JUMPTO: 'jumpto',
	
	// Start the decision process from the beginning
	KEYSEARCH: 'keysearch',
	
	SPEEDBUG: 'speedbug',
	
	HELP: 'help',
	
	BROWSE: 'browse',
	
	GALLERY: 'gallery',
	
	ABOUT: 'about'
};
// Non-standard CommonJS but useful here
module.exports = topics;
