define(["doh", "dojo/aspect", "walta/Key", "walta/KeyNode", "walta/Taxon" ], function(doh, aspect, Key, KeyNode, Taxon ){
	var loadKeyAndTest = function( test ) {
		var deferred = new doh.Deferred();
		var key = new Key( { url: "../../../../walta-app/src/walta/tests/resources/simpleKey1" } );
   	    key.load().then(
			 deferred.getTestCallback( function() { 
				 test(key);
	    		} ) 
    	 );
   	    return deferred;
	};
	
	doh.register( "Key", [
     function loadKey() {
    	 return loadKeyAndTest( function(key) { 
    		 doh.assertEqual( "SIMPLE1", key.name );
	    	});
     },
     
     // Loads the simple key and selects the first outcome,
     // checking that the resulting KeyNode is the correct one.
     function testKeyNodeOutcome() {
    	 return loadKeyAndTest( function(key) { 
    		 
    		 	var nd = key.currentDecision;
    		 	
    		 	// Firstly check that the decision is the correct type
    		 	doh.assertTrue( nd instanceof KeyNode );
    		 	
    		 	// Now that there are exactly 2 questions
    		 	doh.assertEqual( 2, nd.questions.length );
    		 	
    		 	// Check the questions
    		 	doh.assertEqual( "Animals strongly flattened from the sides (like dogs and cats); often lying on their side or moving with their side flat against the substrate.", nd.questions[0].text );
    		 	doh.assertEqual( [ "../../../../walta-app/src/walta/tests/resources/simpleKey1/media/couplet5p1.jpg" ], nd.questions[0].mediaUrls );
    		 	
    		 	doh.assertEqual( "Animals not flattened or flattened 'front to back' (like humans or cockroaches).", nd.questions[1].text );
    		 	doh.assertEqual( [ "../../../../walta-app/src/walta/tests/resources/simpleKey1/media/couplet5p2.jpg" ], nd.questions[1].mediaUrls );
    		 	
    		 	// Check the KeyNode outcome
    		 	var outcome1 = key.choose( 0 );
    		 	doh.assertTrue( outcome1 instanceof KeyNode );
    		 	doh.assertEqual( "Animal rests on its side, swims in swift bursts (below left).", outcome1.questions[0].text );
	
	    	});
     },
     
     // Test the returning of a taxonLink outcome
     function testTaxonOutcome() {
    	 return loadKeyAndTest( function(key) { 
 		 	// Check the Taxon outcome
 		 	var outcome1 = key.choose( 1 );
 		 	doh.assertTrue( outcome1 instanceof Taxon );
 		 	
 		 	doh.assertEqual( "parastacidae", outcome1.id  );
 		 	doh.assertEqual( "Parastacidae", outcome1.name  );
 		 	doh.assertEqual( "freshwater crayfish or yabbies", outcome1.commonName  );
 		 	doh.assertEqual( 300, outcome1.size );
 		 	doh.assertEqual( 4, outcome1.signalScore );
 		 	
 		 	doh.assertEqual( "Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).", outcome1.habitat );
 		 	doh.assertEqual( "walking, with sudden flips when disturbed.", outcome1.movement );
 		 	doh.assertEqual( "Nothing, very distinctive.  We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to separate when young.", outcome1.confusedWith );
 		 	
 		 	doh.assertEqual( [ "../../../../walta-app/src/walta/tests/resources/simpleKey1/media/parastacide_01.jpg", "../../../../walta-app/src/walta/tests/resources/simpleKey1/media/parastacide_02.jpg" ], outcome1.mediaUrls );
		 	
 	
	
    	 });
     }
    	 
     
                        
  ] );
});