define( [ "dojo/_base/declare", "walta/Question" ], function( declare, Question ) {
	var KeyNode = declare( null, {
		questions: [], // An array of questions

		back: null, // A function to go back

		constructor: function( baseUri, doc, node ) {

			this.questions = [ 
			     new Question( KeyNode, baseUri, doc, doc.getNode( node, "tax:question[@num=1]") ),
			     new Question( KeyNode, baseUri, doc, doc.getNode( node, "tax:question[@num=2]") ) 
			];
			
			this.back = function() {
				var parent = doc.getNode( node, "../.." );
				if ( parent.tagName == "keyNode" ) {
					return new KeyNode( baseUri, doc, parent );
				} else {
					return null;
				}
				
			};
		}
	});
	return KeyNode;
});