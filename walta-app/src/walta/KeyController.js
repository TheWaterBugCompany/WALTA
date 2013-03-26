/*
 * walta/KeyController 
 *
 * The Controller in the MVC pattern.
 * 
 * Responsibilities:
 *   - loading and creation of a Key object
 *   - which view to display KeyNodeView or TaxonView
 *   - navigation of the key via events on KeyNodeView 
 * 
 */
define( [ "dojo/_base/declare", "dojo/_base/lang", "dojo/dom-construct", "dojo/aspect", "walta/Key", "walta/KeyNode", "walta/Taxon", "walta/KeyNodeView", "walta/TaxonView"], 
	function( declare, lang, domConstruct, aspect, Key, KeyNode, Taxon, KeyNodeView, TaxonView ) {
		return declare( null, {
			
			// public
			keyUrl: "",
			divNode: null,
			
			// privates
			_key: null,
			_view: null,
			
			
			constructor: function( args ) {
				declare.safeMixin(this,args);
				this._key = new Key( { url: this.keyUrl });
			},
			
			_questionChosen: function( id ) {
				this._key.choose( id );
				this._initView();
			},
			
			_initView: function() {
				if ( this._view ) {
					this._view.destroyRecursive(false);
				} 
				
				this._domNode = domConstruct.create("div", null, this.divNode );
				
				if ( this._key.currentDecision instanceof KeyNode ) {
					this._view = new KeyNodeView( { keyNode: this._key.currentDecision }, this._domNode );
					
					aspect.after( this._view, "onChoose", lang.hitch( this, this._questionChosen ), true );
					
				} else if ( this._key.currentDecision instanceof Taxon ) {
					this._view = new TaxonView( { taxon: this._key.currentDecision }, this._domNode );
					
				}
				
				this._view.startup();
				
			},
			
			startIdentification: function() {
				this._key.load().then( lang.hitch( this, this._initView) );
			}
			
			
		});
});