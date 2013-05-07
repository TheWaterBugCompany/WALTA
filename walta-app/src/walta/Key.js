/*
 *  walta/Key
 *   
 *  Keeps track of the relationship between KeyNodes, Questions and Taxons and initialises the model 
 *  from the supplied key URL. 
 *  
 *  Key, KeyNode, Question and Taxon constitute the model in the MVC pattern.
 */
define( [ "dojo/_base/declare", "dojo/request/xhr", "dojo/_base/lang", "walta/XmlDocument", "walta/KeyNode", "walta/Taxon"  ], 
		function( declare, xhr, lang, XmlDocument, KeyNode, Taxon ) {
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
		_startNode: null,
		
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
			    		this.currentDecision = new KeyNode( this.url, this._xml, this._xml.getNode( null, "/tax:key/tax:keyNode") );
			    		this._startNode = this.currentDecision;
					})
				);	
		},
		
		choose: function( i ) {
			this.currentDecision = this.currentDecision.questions[i].outcome();
			return this.currentDecision;
		},
		
		back: function() {
			var parent = this.currentDecision.back();
			if ( parent != null ) {
				this.currentDecision = parent;
			}
			return parent;
		},
		
		reset: function() {
			this.currentDecision = this._startNode;
		},
		
		lookupNode: function( refId ) {
			var node = this._xml.getNode( null, 
					"/tax:key//tax:taxon[@id='" + refId +"'] | /tax:key//tax:keyNode[@id='" + refId + "']"
			);
			var decision = null;
			
			if ( node.tagName === "taxon"  ) {
				var parent = this._xml.getNode( node, ".." );
				decision = new Taxon( KeyNode, this.url, this._xml, parent, node );
			} else if ( node.tagName === "keyNode" ) {
				decision = new KeyNode( this.url, this._xml, node );
			} else {
				throw "Error: not a taxon or keyNode element!";
			}
			
			this.currentDecision = decision;
			return decision;
		},
		
		constructor: function(args) {	
			// Mix in the arguments
			declare.safeMixin(this,args);
		}
		
		
		
	});
});