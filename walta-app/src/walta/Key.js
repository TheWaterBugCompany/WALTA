/*
 * walta/Key
 * 
 * Loads a key and allows the navigation of key by following the encoding inside the
 * key packages xml.
 * 
 */
define( [ "dojo/_base/declare", "dojo/request/xhr", "dojo/_base/lang"  ], function( declare, xhr, lang ) {
	return declare( null, {
		
		// public
		url: null,	 		// URL to load the key package from
		name: null,  		// name of the current key
		
		// API
		onKeyLoaded: function(){},
		
		// private
		_xml: null, 		// XmlDocument

		_xmlNSResolver: function( prefix ) {
			return { 'tax' : 'http://thewaterbug.net/taxonomy' }[prefix] || null;
		},
		
		load: function() {
			// Load the key definition XML file
			xhr( this.url + "/key.xml", { handleAs: "xml" } )
				.then( lang.hitch( this, function( data ) {
				    		this._xml = data;
				    		this.name = data.evaluate( "/tax:key/@name", data.documentElement,  this._xmlNSResolver, XPathResult.STRING_TYPE, null ).stringValue;
				    		this.onKeyLoaded(); // signal that the load is complete
						})
				);	
		},
		
		constructor: function(args) {	
			// Mix in the arguments
			declare.safeMixin(this,args);
		}
		
	});
});