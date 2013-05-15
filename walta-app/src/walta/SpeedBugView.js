/*
 * walta/SpeedBugView
 *
 * Creates a SpeedBug index selector
 *  
 */

// NB dojox/mobile/parser is needed for StoreCarousel to work properly
define( [ "dojo/_base/declare", "dojo/_base/array", "dojo/_base/lang", "dojo/dom-construct", "dojox/mobile/parser", "dojo/store/Memory", "dojox/mobile/View", 
          "dojox/mobile/StoreCarousel", "walta/AnchorBar", "dijit/Viewport" ], 
	function( declare, array, lang, domConstruct, parser, Memory, View, StoreCarousel, AnchorBar, Viewport ) {
		return declare( "walta.SpeedBugView", [View], {
			
			speedBug: null,
			
			"class": "waltaSpeedBug", 
			
			postMixInProperties: function() {
				this.inherited(arguments);
				
				// Create store from speed bug data
				this._speedBugData = [];
				array.forEach( this.speedBug.bugsList, this._renderGroupOrBug, this );
				
				this._store = new Memory( { data: this._speedBugData });
			},
			
			postCreate: function() {
				var ab = new AnchorBar( { title: "SpeedBug" } );
				this.addChild(ab);
				var cs = new StoreCarousel( { navButton: false, height: "inherit", pageIndicator: false, numVisible: 2, store: this._store } );
				this.addChild(cs);
				
				//Viewport.on( "resize", lang.hitch( this, function() { cs.resize(); } ) );
			},
			
			_renderGroupOrBug: function( itm ) {
				if ( itm.groupRef ) {
					array.forEach( itm.bugs, this._renderBug, this );
				} else {
					this._renderBug(itm);
				}
			},
			
			_renderBug: function( itm ) {
				this._speedBugData.push(  { "type": "walta/SpeedBugTile", "props": 'image:"' + itm.image + '",ref:"' + itm.ref + '"' });
			}
		
			
		});
});