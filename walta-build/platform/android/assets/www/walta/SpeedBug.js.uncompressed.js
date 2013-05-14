define( "walta/SpeedBug", [ "dojo/_base/declare", "dojo/_base/array" ], function( declare, array ) {
	return declare( null, {
		bugsList: [], // An array of questions
		
		_baseUri: "",
		
		// Recursive descent parser for the speed bug xml
		_parseSpeedBugGroup: function( nd ) {
			var grp =  { groupRef: nd.getAttribute("ref") };
			grp.bugs = array.map( this._removeTextNodes( nd.childNodes ), this._parseSpeedBugLinkOrGroup, this );
			return grp;
		},
		
		_parseSpeedBugLink: function( nd ) {
			return { image: this._baseUri + "/media/" + nd.getAttribute("image"), ref: nd.getAttribute("ref") };
		},
		
		_parseSpeedBugLinkOrGroup: function( nd ) {
			if ( nd.tagName === "speedBugGroup" ) {
				return this._parseSpeedBugGroup( nd );
			} else if ( nd.tagName === "speedBugLink" ) {
				return this._parseSpeedBugLink( nd );
			} else {
				throw "Expecting element speedBugGroup or speedBugLink";
			}
		},
		
		_removeTextNodes: function( nds ) {
			return array.filter( nds, function(nd) { return nd.tagName; } );
		},
		
		constructor: function( baseUri, doc ) {
			this._baseUri = baseUri;
			var speedBugIndex = doc.getNode( null, "tax:speedBugIndex" );
			if ( speedBugIndex )
				this.bugsList = array.map( this._removeTextNodes( speedBugIndex.childNodes ), this._parseSpeedBugLinkOrGroup, this);
			else
				throw "Unable to find tax:speedBugIndex in taxonomy description!";
		}
	});
});