var profile = {
	basePath: '../src/',
	action: 'release',
	cssOptimize: 'comments',
	mini: true,
	optimize: 'closure',
	layerOptimize: 'closure',
	stripConsole: 'none',
	selectorEngine: 'lite',
    
	
	
	//webkitMobile : true,
    
	localeList: 'en-us',
    
	defaultConfig: {
		hasCache: {
			// default
			"config-selectorEngine": "lite"
		},
		async: true
	},
    
    
    packages: [ 
         { name: "dojo", location: "dojo" }, 
         { name: "dijit", location: "dijit" },
         { name: "dojox", location: "dojox" }, 
         { name: "walta", location: "walta" } ],

	layers: {
		'dojo/dojo': {
			include: [	
			   "dojo/dojo",
			   "dojo/i18n",
			   "dojo/domReady"
			   ],
			customBase: true,
			boot: true
		},
		'walta/walta': {
			include: [	
			   "dijit/_WidgetBase",
			   "dijit/_Container",
			   "dijit/_Contained",
			   "dijit/registry",
			   "dojo/selector/lite",
			   "dojox/mobile/deviceTheme",
			   "walta/Key",
			   "walta/KeyNode",
			   "walta/KeyNodeView",
			   "walta/Question",
			   "walta/QuestionView",
			   "walta/Taxon",
			   "walta/TaxonView",
			   "walta/XmlDocument",
			   "walta/AnchorBar",
			   "walta/AppController",
			   "walta/HomeView",
			   "walta/MediaView",
			   "walta/SpeedBug",
			   "walta/SpeedBugTile",
			   "walta/SpeedBugView"
			   ]
		}
	},

	staticHasFeatures: {
		// Default settings for a browser, from dojo.js; apparently these get modified in special cases
		// like when running under node, or against RequireJS, but nothing we need to worry about.
		"host-browser": true,
		"host-node": false,
		"host-rhino": false,
		"dom": true,
		"dojo-amd-factory-scan": true,
		"dojo-loader": true,
		"dojo-has-api": true,
		"dojo-inject-api": true,
		"dojo-timeout-api": true,
		"dojo-trace-api": true,
		"dojo-log-api": true,
		"dojo-dom-ready-api": true,
		"dojo-publish-privates": true,
		"dojo-config-api": true,
		"dojo-sniff": true,
		"dojo-sync-loader": true,
		"dojo-test-sniff": true,
		"config-tlmSiblingOfDojo": true,

		// Other configuration switches that are hardcoded in the source.
		// Setting some of these to false may reduce code size, but unclear what they all mean.
		"config-publishRequireResult": true,
		"dojo-config-addOnLoad": 1,		// hardcoded to 1 in the source
		"dojo-config-require": true,
		"dojo-debug-messages": true,
		"dojo-gettext-api": true,			// apparently unused
		"dojo-guarantee-console": true,
		"dojo-loader-eval-hint-url": true,
		"dojo-modulePaths": true,
		"dojo-moduleUrl": true,
		"dojo-v1x-i18n-Api": true,
		"dojo-xhr-factory": true,	// if require.getXhr() exists (true for dojo's AMD loader, false for requireJS?)
		"extend-dojo": true,		// add functions to global dojo object

		// Browser flags
		"webkit": true,	// this is actually a number like 525 but I don't think anyone is using it
		"air": false,
		"ff": undefined,
		"mozilla": undefined,
		"ie": undefined,

		// Configuration settings
		"config-selectorEngine": "lite",
		"dijit-legacy-requires": false,		// don't load unrequested modules for back-compat
		"dom-quirks": false,				// we assume/require that the app is in strict mode
		"quirks": false,					// we assume/require that the app is in strict mode

		// Flags for old IE browser bugs / non-standard behavior
		"array-extensible": true,		// false for old IE
		"bug-for-in-skips-shadowed": 0,	// false for old IE
		"dom-attributes-explicit": true,	// everyone except IE6, 7
		"dom-attributes-specified-flag": true,	//everyone except IE6-8
		"dom-addeventlistener": true,		// everyone except IE
		"native-xhr": true,			// has XMLHTTPRequest
		"ie-event-behavior": undefined,
		"dojo-force-activex-xhr": false,	// true is for IE path

		// Flags for features
		"dom-matches-selector": true,
		"dom-qsa": true,
		"dom-qsa2.1": true,
		"dom-qsa3": true,
		"json-parse": true,
		"json-stringify": true,

		// Behavior that varies by browser, but is constant across webkit mobile browsers
		"events-keypress-typed": true,		// whether printable characters generate keypress event?
		"events-mouseenter": false,		// this is set by mouse.html but never used
		"touch": true,
		"highcontrast": false,			// safari always displays background images, even when device in high-contrast mode
		"textarea-needs-help-shrinking": true,
		"css-user-select": "'WebkitUserSelect'"

		// Values which can be different across mobile devices, so intentionally not specified in this list.
		// "event-orientationchange": true,
		// "safari": true,
		// "android": true
		// "wii": true
	},
};
