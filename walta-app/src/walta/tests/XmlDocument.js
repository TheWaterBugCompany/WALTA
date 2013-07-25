define(["doh", "walta/XmlDocument"], function(doh, XmlDocument){	
	 
	var testXml = {
			url: "../../../../walta-app/src/walta/tests/resources/XmlTestDoc.xml", 
			namespaceMap: { 'test' : 'http://thewaterbug.net/test' }
	};
	
	var loadXmlAndThen = function( test ) {
		var deferred = new doh.Deferred();
   	 	var xml = new XmlDocument( testXml );
   	 	xml.load().then( 
   		deferred.getTestCallback( function() { 
   			test( xml );
   		} ) );
		return deferred;
	};
	
	doh.register( "XmlDocument", [
	                              
     function load() {
    	 return loadXmlAndThen( function( xml ) { doh.assertTrue( xml !== null ); } );
     },
     
     function queryString() {
    	 return loadXmlAndThen( function( xml ) {
    			doh.assertEqual( xml.getString( null, "/test:node1/@attr1"), "an attribute" );
    		});
     },
     
     function queryNumber() {
    	 return loadXmlAndThen( function( xml ) {
    			doh.assertEqual( xml.getNumber( null, "/test:node1/@attr2"), 123 );
    		});
     },
     
     function queryStringElementText() {
    	 return loadXmlAndThen( function( xml ) {
    			doh.assertEqual( xml.getString( null, "//test:child"), "Hello this is a child text node." );
    		} );
     },
     
     function queryNode() {
    	 return loadXmlAndThen( function( xml ) {
    			doh.assertEqual( xml.getNode( null, "//test:child").tagName, "child" );
    		} );
     },
     
     function queryStringArray() {
    	 return loadXmlAndThen( function( xml ) {
    			doh.assertEqual( [ "one", "two", "three" ], xml.getStringArray( null, "//test:uri/@ref")  );
    		} );
     },
     
     function queryNodeArray() {
    	 return loadXmlAndThen( function( xml ) {
    		 var ndArray = xml.getNodeArray( null, "//test:uri");
    		 doh.assertEqual( 3, ndArray.length  );
    		 
    		 var cnt = 0;
    		 for( var i = 0; i < ndArray.length; i++ )
    			 if ( ndArray[i].tagName === "uri" )
    				 cnt++;
    		 doh.assertEqual( 3, cnt );
    		} );
     }  
     
     ]                    
  );
});