/*
 * walta/HomeView
 */
define( [ "dojo/_base/declare", "dojo/on", "dojo/dom-construct", "dojo/_base/lang", "dojox/mobile/View" ], 
	function( declare, on, domConstruct, lang, View ) {
		return declare( "walta.HomeView", [View], {
			"class": "waltaHomeView waltaFullscreen", 
			
			onSpeedbug: function() {},
			onAltKey: function() {},
			onBrowse: function() {},
			onHelp: function() {},
			onAbout: function() {},
			
			buildRendering: function() {
				this.inherited(arguments);

				var header = domConstruct.create("div", { "class":"waltaPanel waltaHeader"}, this.domNode );
				
				domConstruct.create("div", { "class":"waltaLogo"}, header );
				domConstruct.create("h1", { innerHTML: "WALTA"}, header );
				domConstruct.create("h3", { innerHTML: "Waterbug ALT App"}, header );
				
				var menu = this.domNode;
				
				var speedbug = domConstruct.create("div", { "class": "waltaPanel waltaMenu" }, menu);
				domConstruct.create("div", { "class":"waltaMenuIcon waltaSpeedbugLogo"}, speedbug );
				domConstruct.create("h2", { innerHTML: "Speedbug"}, speedbug );	
				domConstruct.create("p", { innerHTML: "Look at silhouettes of bugs to choose the best match."}, speedbug );	
				
				var altkey = domConstruct.create("div", { "class": "waltaPanel waltaMenu" }, menu );
				domConstruct.create("div", { "class":"waltaMenuIcon waltaAltKeyLogo"}, altkey );
				domConstruct.create("h2", { innerHTML: "ALT key"}, altkey );	
				domConstruct.create("p", { innerHTML: "Questions to help identify your waterbug."}, altkey );
				
				var browse = domConstruct.create("div", { "class": "waltaPanel waltaMenu" }, menu );
				domConstruct.create("div", { "class":"waltaMenuIcon waltaBrowseLogo"}, browse );
				domConstruct.create("h2", { innerHTML: "Browse list"}, browse );	
				domConstruct.create("p", { innerHTML: "If you know the name or scientific name of your bug."}, browse );
				
				var help = domConstruct.create("div", { "class": "waltaPanel waltaMenu waltaSecondary" }, menu);
				domConstruct.create("h2", { innerHTML: "Help"}, help );	
				domConstruct.create("p", { innerHTML: "Info to get you started."}, help );
				
				var gallery = domConstruct.create("div", { "class": "waltaPanel waltaMenu waltaSecondary" }, menu );
				domConstruct.create("h2", { innerHTML: "Gallery"}, gallery );	
				domConstruct.create("p", { innerHTML: "Browse photos & videos."}, gallery );	
				
				var about = domConstruct.create("div", { "class": "waltaPanel waltaMenu waltaSecondary" }, menu );
				domConstruct.create("h2", { innerHTML: "About"}, about );	
				domConstruct.create("p", { innerHTML: "About the app."}, about );	

				on( about, "click", lang.hitch( this, function(e) { this.onAbout(); } ) );
				on( help, "click", lang.hitch( this, function(e) { this.onHelp(); } ) );
				on( browse, "click", lang.hitch( this, function(e) { this.onBrowse(); } ) );
				on( altkey, "click", lang.hitch( this, function(e) { this.onAltKey(); } ) );
				on( speedbug, "click", lang.hitch( this, function(e) { this.onSpeedbug(); } ) );
				
			}
		});
});