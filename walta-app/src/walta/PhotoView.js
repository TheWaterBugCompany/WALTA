/*
 * walta/PhotoView
 *
 * Creates a thumbnail image with a zoom to gallery icon.
 *  
 */
define( [ "dojo/_base/declare", "dojo/_base/array", "dojo/on", "dojo/aspect", "dojo/dom-construct", "dojo/_base/lang", "dojox/mobile/ContentPane", "dojox/mobile/SwapView", "dojox/mobile/Carousel" ], 
	function( declare, array, on, aspect, domConstruct, lang, ContentPane, SwapView, Carousel ) {
		return declare( "walta.PhotoView", [ContentPane], {
			
			photoUrls: null, // An array of photo Urls
			
			"class": "waltaImageContainer", 
			
			_carousel: null,
			
			constructor: function( args ) {
				this.photoUrls = [];
				declare.safeMixin(this,args);
				
			},
			
			buildRendering: function() {
				this.inherited(arguments);
				
				if ( this.photoUrls[0] ) {
					var cn = domConstruct.create("div", { "class" : "waltaImageInner" }, this.containerNode );
					domConstruct.create("img", { src: this.photoUrls[0] }, cn );
					domConstruct.create("div", { "class" : "waltaZoom" }, cn );
					on( cn, "click", lang.hitch( this, function(e) { 
							this.show();  
							e.stopPropagation();
						} ) );
				}
				
			},
			
			show: function() {
				if ( ! this._carousel ) {
					this._carousel = new Carousel( { navButton: false, numVisible: 1, "class" : "waltaCarousel" } );
					array.forEach( this.photoUrls, 
						lang.hitch( this, function( url ) {
							this._carousel.addChild( this._buildImageView( url ) );
						})
					);
					var close = domConstruct.create("div", { "class" : "waltaCloseButton" }, this._carousel.containerNode );
					on( close, "click", lang.hitch( this, function(e) {
						this.hide();
						e.stopPropagation();
					} ) );

					this.addChild( this._carousel );
					this._carousel.startup();
				}
				
			},
			
			hide: function() {
				this._carousel.destroyRecursive(); 
				this._carousel = null; 
			},
			
			_buildImageView: function( url ) {
				var iv = new SwapView( { "class" : "waltaZoomedImage"});
				domConstruct.create("img", { src: url }, iv.containerNode );
				return iv;
			}
		
			
		});
});