
/*
 * A global list of all PubSub topics this applciation uses
 * PubSub events provide a loosely coupled interface to
 * navigation logic with the app.
 */

function createEventBus() {
	let subs = {};
	return {
		on(evt, cb) { (subs[evt] = subs[evt] || []).push(cb); },
		off(evt, cb) { if (subs[evt]) subs[evt] = subs[evt].filter(c => c !== cb); },
		trigger(evt, data) { (subs[evt] || []).slice().forEach(cb => cb(data)); },
		clear() { subs = {}; }
	};
}

const bus = createEventBus();

var topics = {

	LOGGEDIN: 'loggedin',

	LOGGEDOUT: 'loggedout',

	// The session token was rejected mid-sync (e.g. password changed): drop to login.
	SESSION_EXPIRED: 'session_expired',

	HOME: 'home',
	SETTINGS: 'settings',
	INFO: 'info',

	// Open the video player
	VIDEO: 'video', // the filename is passed as parameter

	// Backwards on the decision tree
	BACK: 'back',

	// Go up in the decision tree
	UP: 'up',

	// Forwards on the decision tree passing choice as parameter
	FORWARD: 'forward', // the choice number is passed as parameter

	// Jumps to a position in the key
	JUMPTO: 'jumpto',

	// Start the decision process from the beginning
	KEYSEARCH: 'keysearch',

	// Open the identification-method chooser (the MethodSelect modal)
	SELECT_METHOD: 'selectmethod',

	IDENTIFY: 'identify',

	ORDER: 'order',

	DETAILED: 'detailed',

	SAMPLETRAY: 'sampletray',

	SPEEDBUG: 'speedbug',

	SITEDETAILS: 'sitedetails',

	HABITAT: 'habitat',

	COMPLETE: 'complete',

	HISTORY: 'history',

	// Open the edit menu for a sample from the history list
	EDIT_SAMPLE: 'editsample',

	HELP: 'help',

	BROWSE: 'browse',

	GALLERY: 'gallery',

	ABOUT: 'about',

	ACADEMY: 'academy',

	DIAGNOSTICS: 'diagnostics',

	LOGIN: 'login',

	GPSLOCK: 'gpslock',

	FORCE_UPLOAD: 'forceupload',

	UPLOAD_PROGRESS: 'uploadprogress',

	// user intent: open the SyncFeedback modal and kick off a sync
	START_SYNC: 'startsync',

	SYNC_STARTED: 'syncstarted',

	SYNC_FINISHED: 'syncfinished', // payload: { success: boolean, error?: Error }

	// A survey session's current sample is now established (new survey, resume, or
	// history view/edit). Payload: { sample, taxa }. Navigation seeds the sample it
	// threads into every screen's args from this.
	SURVEY_STARTED: 'surveystarted',

	// Grade the current training tray (fired by the tray's Assess button; the tray
	// VM listens and runs its assessor).
	ASSESS: 'assess',

	// The training tray graded every taxon correct. Payload: { correctCount }.
	// Opens the TrainingSuccess modal.
	TRAINING_SUCCESS: 'trainingsuccess',

	NOTES: 'notes',

	// used to trap when a page is opened
	PAGE_OPENED: 'page_opened',

	// used to trap when pages are unloaded from the history
	PAGES_UNLOADED: 'page_unloaded',

	DISCARD_OR_SAVE: 'discard_or_save',

	unsubscribe: function( topic, callback ) {
		bus.off( 'waterbug:' + topic, callback );
	},

	subscribe: function( topic, callback ) {
		bus.on( 'waterbug:' + topic, callback );
	},

	fireTopicEvent: function( topic, data ) {
		if ( topic ) {
			bus.trigger( 'waterbug:' + topic, data );
		} else {
			throw new Error("undefined topic");
		}
	},

	init: function() {
		if ( typeof Ti === "undefined" ) return;
		Ti.App.addEventListener("waterbug", function(e) {
			bus.trigger(`waterbug:${e.event}`, e);
		})
	},

	reset: function() {
		bus.clear();
	}

};

module.exports = topics;
