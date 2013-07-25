/*
 * walta/SpeedBugView
 *
 * Creates a SpeedBug index selector
 *  
 */

// NB dojox/mobile/parser is needed for StoreCarousel to work properly
define( [ "dojo/_base/declare", "dojo/_base/array", "dojo/_base/lang", "dojo/dom-construct", "dojox/mobile/parser", "dojo/store/Memory", "dojox/mobile/View", 
          "dojox/mobile/StoreCarousel", "dojox/mobile/Carousel", "walta/AnchorBar" ], 
	function( declare, array, lang, domConstruct, parser, Memory, View, StoreCarousel, Carousel, AnchorBar ) {
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
				this._storeCarousel = new StoreCarousel( { navButton: false, height: "inherit", pageIndicator: false, numVisible: 2 });
				this.addChild(this._storeCarousel);
			},
			
			startup: function() {
				this._storeCarousel.setStore( this._store );
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
