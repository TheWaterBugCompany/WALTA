/*
 * walta/XmlDocument
 * 
 * A simple wrapper that handles the loading of an XML url and
 * contains simplified wrapper functions for querying.
 * 
 */

define( "walta/XmlDocument", [ "dojo/_base/declare", "dojo/_base/lang", "dojo/request/xhr" ], function( declare, lang, xhr ) {
	return declare( null, {
	
		// public
		namespaceMap: null,
		url: null,
		
		// private
		_xml: null,
		_xmlNSResolver: null,
		
		// methods
		constructor: function(args) {
			declare.safeMixin(this,args);

		},
		
		// Loads the xml document and configures it for querying
		load: function() {
			// Construct a namespace resolver from the passed map
			this._xmlNSResolver = lang.hitch( this, function( prefix ) { return this.namespaceMap[prefix] || null; } );
			
			// Load the xml
			return xhr( this.url, { handleAs: "xml" } )
				.then( lang.hitch( this, function( data ) {
				    		this._xml = data;
						})
				);	
		},
	
		// Evaluates the passed xpath (from context node) and casts the result to a string
		getString: function( node, xpath ) {
			var res = this._xml.evaluate( xpath, (node === null ? this._xml.documentElement : node ),  this._xmlNSResolver, XPathResult.STRING_TYPE, null );
			return res.stringValue;
		},
		
		// Evaluates the passed xpath (from context node) and casts the result to a string
		getNumber: function( node, xpath ) {
			var res = this._xml.evaluate( xpath, (node === null ? this._xml.documentElement : node ),  this._xmlNSResolver, XPathResult.NUMBER_TYPE, null );
			return res.numberValue;
		},
		
		// Evaluates the passed xpath (from context node) and casts the result to a node iterator
		getStringArray: function( node, xpath ) {
			var res = this._xml.evaluate( xpath, (node === null ? this._xml.documentElement : node ),  this._xmlNSResolver, XPathResult.ANY_TYPE, null );
			var arr = [];
			var nd;
			
			// extract into an array
			while( nd = res.iterateNext() ) {
				arr.push( nd.value );
			}
			
			return arr;
		},
		
		// Evaluates the passed xpath (from context node) and casts the result to a node
		getNode: function( node, xpath ) {
			var res = this._xml.evaluate( xpath, (node === null ? this._xml.documentElement : node ),  this._xmlNSResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
			return res.singleNodeValue;
		}
	});
});
		