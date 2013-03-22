define( [ "dojo/_base/declare", "walta/Question" ], function( declare, Question ) {
	var KeyNode = declare( null, {
		questions: [], // An array of questions
	
		constructor: function( baseUri, doc, node ) {
			this.questions = [ 
			     new Question( KeyNode, baseUri, doc, doc.getNode( node, "tax:question[@num=1]") ),
			     new Question( KeyNode, baseUri, doc, doc.getNode( node, "tax:question[@num=2]") ) 
			];
		}
	});
	return KeyNode;
});