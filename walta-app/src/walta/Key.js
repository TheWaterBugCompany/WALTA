/*
 *  walta/Key
 *   
 *  Keeps track of the relationship between KeyNodes, Questions and Taxons and initialises the model 
 *  from the supplied key URL. 
 *  
 *  Key, KeyNode, Question and Taxon constitute the model in the MVC pattern.
 */
define( [ "dojo/_base/declare", "dojo/request/xhr", "dojo/_base/lang", "dojo/_base/array", "walta/XmlDocument", "walta/KeyNode", "walta/Taxon", "walta/Question"  ], 
		function( declare, xhr, lang, array, XmlDocument, KeyNode, Taxon, Question ) {
	return declare( null, {
		
		//
		// public
		//
		url: null,	 		      // URL to load the key package from
		name: null,  		      // name of the current key

		currentDecision: null, // Either a KeyNode or a Taxon
		
		choose: function( i ) {
			this.currentDecision = this.currentDecision.questions[i].outcome;
			return this.currentDecision;
		},
		
		back: function() {
			
			if ( this.currentDecision.parentLink ) {
				this.currentDecision = this.currentDecision.parentLink;
				return true;
			} else {
				return false;
			}
		},
		
		reset: function() {
			this.currentDecision = this._rootNode;
		},
		
		lookupNode: function( refId ) {
	
			var decision = this._lookUpNodeByRef( refId );
			this.currentDecision = decision;
			return decision;
		},
		
		constructor: function(args) {	
			// Mix in the arguments
			declare.safeMixin(this,args);
		},
		
		
		
		// Load the key and initialise it to the start node
		// constructs the entire KeyNode tree and then abandons the XML.
		load: function() {
			
			// Load the XML
			this._xml = new XmlDocument( { 
				url: this.url + "/key.xml", 
				namespaceMap: { 'tax' : 'http://thewaterbug.net/taxonomy' }
			});
			
			
			// Load the key definition XML file
			return this._xml.load().then( 
					lang.hitch( this, function() {
						
						// Deserialise the decision tree creating parent links
						try {
							this.name = this._xml.getString( null, "/tax:key/@name" );
							this._parseKeyXML( this.url, this._xml );
				    		this.currentDecision = this._rootNode;
						} catch( e ) {
							console.error( "Failed to load key: " + e );
						}
					})
				);	
		},
		
		//
		// private
		//
		_mapFromIdToNode: {},     // A way to jump around the tree by ID
		_rootNode: null,          // The root of the KeyNode tree
		
		
		/*
		 * When the referenced id hasn't been seen yet in the parsing we need to
		 * store a Question node here which needs to have it's outcome set
		 * when the appropriate keyNode (or taxon) id is seen.
		 */
		_forwardLinks: [],        // Any unresolved links are placed here for a second pass   

		_lookUpNodeByRef: function ( refId ) {
			return this._mapFromIdToNode[refId];
		},
		
		_parseKeyXML: function( baseUri, doc ) {
			
			// Firstly parse the taxons
			this._parseTaxonFromXML( baseUri, doc, this._xml.getNode( null, "/tax:key" ) );
			
			// Then parse the Key Nodes
			var nodes = this._xml.getNodeArray( null, "/tax:key/tax:keyNode");
			while( nodes.length > 0 ) {
				var kn = this._parseKeyNodeFromXML( baseUri, doc, nodes.shift() );
				if ( this._rootNode == null )
					this._rootNode = kn;
			}
			
		},
		
		_parseKeyNodeFromXML: function( baseUri, doc, node  ) {

			
			var res = new KeyNode();
			for( var num = 1; num <=2; num++ ) {
				try {
					res.questions.push( this._parseQuestionFromXML( baseUri, doc, doc.getNode( node, "tax:question[@num=" + num + "]"), res ) );
				} catch( e ) {
					console.error( "Parsing failed for question " + num + ": " + e);
				}
			}

    		// Link in the parent links
    		array.forEach( res.questions, function( q ) { 
    				if ( q.outcome )  {
    					q.outcome.parentLink = res;
    				}
    			} );
    		
			// Look for any unresolved forward links that match the parsed node
			var id = doc.getString(node, "@id");
			if ( id !== "") {
				if ( id in this._forwardLinks ) {
					var fw = this._forwardLinks[id];
					fw.qNode.outcome = res;
					res.parentLink = fw.pLink;
					delete this._forwardLinks[id];
				}
				// Store this node for future reference regardless
				this._mapFromIdToNode[id] = res;
			}
			
			// Note any unnamed nodes (except for the first) will be discarded
			
			return res;
			
		},
		
		_parseQuestionFromXML: function( baseUri, doc, node, parentLink ) {
			
			var qn = new Question();
			
			// Read media URLs
			qn.text = doc.getString( node, "tax:text");
			qn.mediaUrls = this._parseMediaUrls( baseUri, doc, node );
			
			var num = doc.getNumber( node, "@num" );
			if ( isNaN(num) ) {
				var txt = doc.getString( node, "@num" );
				if ( txt === "" ) {
					throw "Missing num attribute on question node.";
				} else {
					throw "Unable to interpret @num as an integer: @num = '" +  + "'";
				}
			}
			
			// Parse the outcome if we can
			var outNode = doc.getNode( node, "../tax:outcome[@for=" + num + "]/*");
			var outcome = null;
			var ref = null;
			
			if ( outNode === null ) {
				throw "Can't find outcome: " + num;
			}
			
			if ( outNode.tagName === "taxonLink" || outNode.tagName === "keyNodeLink" ) {
				ref = doc.getString( outNode, "@ref" );
				var oc = this._lookUpNodeByRef( ref );
				qn.outcome = oc; 
			} else if ( outNode.tagName === "keyNode" ) {
				// Recursive descent for nested keyNodes
				qn.outcome =  this._parseKeyNodeFromXML( baseUri, doc, outNode );
			} 

			// Register a forward link if we couldn't look up linked node earlier
			if ( ref !== "" && qn.outcome == null ) {
				this._forwardLinks[ref] = { qNode: qn, pLink: parentLink };
			}
			
			return qn;	
		},
		
		_parseMediaUrls: function( baseUri, doc, node ) {
			var mediaUrls = [];
			array.forEach(
				doc.getStringArray( node, "child::tax:mediaRef/@url" ),
						function( ref ) { mediaUrls.push( baseUri + "/media/" + ref ); } );
			return mediaUrls;
		},
		
		_parseTaxonFromXML: function( baseUri, doc, node ) {
			// Note the initial parent can be tax:key hence the check below
			if ( node.tagName === "taxon") {
				var tx = new Taxon( {
						id: doc.getString( node, "@id" ),
						name: doc.getString( node, "@name" ),
						commonName: doc.getString( node, "@commonName" ),
						size: doc.getNumber( node, "@size" ),
						signalScore: doc.getNumber( node, "@signalScore" ),
						habitat: doc.getString( node, "tax:habitat"),
						movement: doc.getString( node, "tax:movement"),
						confusedWith: doc.getString( node, "tax:confusedWith"),
						mediaUrls: this._parseMediaUrls( baseUri, doc, node )
				});
				
				if ( tx.id !== "")
					this._mapFromIdToNode[tx.id] = tx;
			}
			
			// Look for immediate child nodes
			var nodes = this._xml.getNodeArray( node, "tax:taxon");
			while( nodes.length > 0 ) {
				nd = nodes.shift();
				this._parseTaxonFromXML( baseUri, doc, nd );
			}

		}

	});
});