define( "walta/KeyNode", [ "dojo/_base/declare", "walta/Question" ], function( declare, Question ) {
	var KeyNode = declare( null, {
		constructor: function() {
			this.questions = [];
			this.parentLink = null;
		}
	});
	return KeyNode;
});