/*
 * walta/AppController 
 *
 * The Controller in the MVC pattern.
 * 
 * Responsibilities:
 *   - loading and creation of a Key object
 *   - which view to display KeyNodeView or TaxonView
 *   - navigation of the key via events on KeyNodeView 
 * 
 */
define( [ "dojo/_base/declare", "dojo/_base/lang", "dojo/dom-construct", "dojo/aspect", 
          "walta/Key", "walta/KeyNode", "walta/Taxon", "walta/KeyNodeView", "walta/TaxonView", "walta/HomeView"], 
	function( declare, lang, domConstruct, aspect, Key, KeyNode, Taxon, KeyNodeView, TaxonView, HomeView ) {
		return declare( null, {
			
			// public
			keyUrl: "",
			divNode: null,
			
			// privates
			_key: null,
			_currentView: null,
			
			_views: {},
			_decisionCounter: 0,
			_decisionViews: [],
			
			
			constructor: function( args ) {
				declare.safeMixin(this,args);
				this._key = new Key( { url: this.keyUrl });
			},
			
			_startAltKey: function() {
				console.log( "Alt key activated");
				this._doTransition( this._createDecisionView(), 1 );
			},
			
			_questionChosen: function( id ) {			
				this._key.choose( id );
				this._doTransition( this._createDecisionView(), 1 );
			},
			
			_goBack: function() {
				if ( this._key.back() ) {
					this._doTransition( this._createDecisionView(), -1 );
				} else {
					this._doTransition( this._views["home"], -1 ); 
				}
			},
			
			_doTransition: function( view, dir ) {
				console.log("view: " + view.get("id"));
				console.log("current view: " + this._currentView.get("id"));
				this._currentView.performTransition( view.get("id"), dir, "slide" );
				this._currentView = view;
			},
			
			// Creata an wire up a new decision view
			_createDecisionView: function() {
				
				console.log("createdecisionview");
				
				var decisionView = null;
				var decisionViewNode =  domConstruct.create("div", { id: "waltaDecisionView" + this._decisionCounter++ }, this.divNode );
				
				if ( this._key.currentDecision instanceof KeyNode ) {
					decisionView = new KeyNodeView( { keyNode: this._key.currentDecision }, decisionViewNode );
					
					aspect.after( decisionView, "onChoose", lang.hitch( this, this._questionChosen ), true );
					aspect.after( decisionView, "onBack", lang.hitch( this, this._goBack ), true );
					
				} else if ( this._key.currentDecision instanceof Taxon ) {
					decisionView = new TaxonView( { taxon: this._key.currentDecision }, decisionViewNode );
					aspect.after( decisionView, "onBack", lang.hitch( this, this._goBack ), true );
					
				}
				decisionView.startup();
				
				// keep track of views created
				this._decisionViews.unshift( decisionView );
				
				if ( this._decisionViews.length > 2 ) {
					var oldDecision = this._decisionViews.pop();
					oldDecision.destroyRecursive(); // Clean up our junk
					this._decisionCounter = this._decisionCounter % 3;
				}
				
				console.log("return " + decisionView);
				return decisionView;
				
			},
			
			_createHomeView: function() {
				var home = new HomeView( {selected: true}, domConstruct.create("div", { id: "waltaHomeView" }, this.divNode ));
				aspect.after( home, "onAltKey", lang.hitch( this, this._startAltKey ) );
				this._views["home"] = home;
				home.startup(); 
				this._currentView = home;
			},
			
			startApp: function() {
				this._key.load().then( lang.hitch( this, this._createHomeView ) );
			}
			
			
		});
});