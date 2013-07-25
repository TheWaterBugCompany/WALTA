/*
 * walta/VideoView
 *
 * A very rudimentry video player.
 *  
 */
define( [ "dojo/_base/declare", "dojo/_base/array", "dojo/on", "dojo/aspect", "dojo/dom-construct", "dojo/dom-class", "dojo/dom-style", "dojo/_base/lang", "dojox/mobile/ContentPane", "dojox/mobile/SwapView", "dojox/mobile/Carousel" ], 
	function( declare, array, on, aspect, domConstruct, domClass, domStyle, lang, ContentPane, Carousel ) {
		return declare( "walta.VideoView", [ContentPane], {
			
			videoUrl: null,
			
			_videoNode: null, // Internal node that is HTML5 video
			_playing: false,
			
			"class": "waltaVideoView", 
			
			buildRendering: function() {
				this.inherited(arguments);	
				this._videoNode = domConstruct.create("video", { src: this.videoUrl, preload: "auto" }, this.containerNode );
				this._playBtnNode = domConstruct.create("div", { "class": "waltaVideoPlayButton waltaVideoPaused" }, this.containerNode );
				this._closeBtnNode = domConstruct.create("div", { "class": "waltaCloseButton" }, this.containerNode );
				
				// Wire up the events to provide a simple play button overlaid on the video
				on( this._playBtnNode, "click", lang.hitch( this, function(e) { 
						if ( this._playing ) {
							this._videoNode.pause();
						} else {
							this._videoNode.play();
						}
					} ) );
				
				on( this._videoNode, "play", lang.hitch( this, function(e) { 
					domClass.remove( this._playBtnNode, "waltaVideoPaused" );
					this._playing = true;
				}));
				
				on( this._videoNode, "pause", lang.hitch( this, function(e) { 
					domClass.add( this._playBtnNode, "waltaVideoPaused" );
					this._playing = false;
				}));
				
				on( this._closeBtnNode, "click", lang.hitch( this, this.hide));
				
				domStyle.set( this.containerNode, "display", "none" );
			},
			
			show: function() {
				domStyle.set( this.containerNode, "display", "block" );
			},
			
			hide: function() {
				this._videoNode.pause();
				this._videoNode.currentTime = 0.0;
				this._playing = false;
				domStyle.set( this.containerNode, "display", "none" );
			}
			
		});
});