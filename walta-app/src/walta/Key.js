/*
 * walta/Key
 * 
 * Loads a key and allows the navigation of key by following the encoding inside the
 * key packages xml.
 * 
 */
define( [ "dojo/_base/declare", "dojo/request/xhr", "dojo/_base/lang", "walta/XmlDocument", "walta/KeyNode"  ], function( declare, xhr, lang, XmlDocument, KeyNode ) {
	return declare( null, {
		
		//
		// public
		//
		url: null,	 		// URL to load the key package from
		name: null,  		// name of the current key
		
		currentDecision: null, // Either a KeyNode or a Taxon
		
		//
		// private
		//
		_xml: null, 		// XmlDocument
		
		_taxonomy: null,
		
		_topKeyNode: null,
		
		_currentKeyNode: null,
		
		//
		// methods
		//
		
		// Load the key and initialise it to the start node
		load: function() {
			
			this._xml = new XmlDocument( { 
				url: this.url + "/key.xml", 
				namespaceMap: { 'tax' : 'http://thewaterbug.net/taxonomy' }
			});
			
			
			// Load the key definition XML file
			return this._xml.load().then( 
					lang.hitch( this, function() {
						// Initialise the decision tree
						this.name = this._xml.getString( null, "/tax:key/@name" );
			    		this._taxonomy = this._xml.getNode( null, "/tax:key/tax:taxon" );
			    		this._topKeyNode = this._xml.getNode( null, "/tax:key/tax:keyNode");
			    		this._currentKeyNode = this._topKeyNode;
			    		this.currentDecision = new KeyNode( this.url, this._xml, this._currentKeyNode );
			    		
					})
				);	
		},
		
		choose: function( i ) {
			return this.currentDecision.questions[i].outcome();
		},
		
		constructor: function(args) {	
			// Mix in the arguments
			declare.safeMixin(this,args);
		},
		
		
		
	});
});