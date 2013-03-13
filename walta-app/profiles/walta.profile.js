var profile = {
	basePath: '../src/',
	action: 'release',
	cssOptimize: 'comments',
	mini: true,
	optimize: 'closure',
	layerOptimize: 'closure',
	stripConsole: 'all',
	selectorEngine: 'acme',
    webkitMobile : true,
    localeList: 'en-us',
    
    packages: [ 'dojo', 'dijit', 'dojox', 'walta' ],

	layers: {
		'dojo/dojo': {
			include: [	'dojo/dojo', 'dojo/i18n', 'dojo/domReady' ],
			customBase: true,
			boot:true
		}
	},

	staticHasFeatures: {
        'dom-addeventlistener': true,
        'dom-qsa': true,
        'json-stringify': true,
        'json-parse': true,
        'bug-for-in-skips-shadowed': false,
        'dom-matches-selector': true,
        'native-xhr': true,
        'array-extensible': true,
        'ie': undefined,
        'quirks': false,
        'webkit': true,
		'dojo-trace-api': false,
		'dojo-log-api': false,
		'dojo-publish-privates': false,
		'dojo-sync-loader': false,
		'dojo-xhr-factory': false,
		'dojo-test-sniff': false,
		'config-tlmSiblingOfDojo': true
	}
};
