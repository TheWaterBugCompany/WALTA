define(["doh", "dojo/aspect", "walta/Key", "walta/KeyNode", "walta/Taxon", "walta/SpeedBug" ], function(doh, aspect, Key, KeyNode, Taxon, SpeedBug ){
	
	var prefix = "../../../../walta-app/src/walta/tests/resources/simpleKey1/media/";
	var loadSpeedBugAndTest= function( test ) {
		var deferred = new doh.Deferred();
		var key = new Key( { url: "../../../../walta-app/src/walta/tests/resources/simpleKey1" } );
   	    key.load().then(
			 deferred.getTestCallback( function() { 
				 test( new SpeedBug( key.url, key._xml ) );
	    		} ) 
    	 );
   	    return deferred;
	};
	
	doh.register( "SpeedBug", [
     function loadSpeedBug() {
    	 return loadSpeedBugAndTest( function( speedBug ) { 
    		 doh.assertTrue( speedBug instanceof SpeedBug );
	    	});
     },
     
     function testGetBugs() {
    	 return loadSpeedBugAndTest( function( speedBug ) { 
    		 doh.assertEqual( speedBug.bugsList,
    			 [ 
    			   	{ groupRef: "maggots", 
    			   	  bugs:	[
    			   	    { image: prefix + "speedbug/athericidae.svg", ref: "athericidae"  },
    			   	    { image: prefix + "speedbug/blepheraceridae.svg", ref: "blepheraceridae"  }
    			   	  ] },
    			   	{ image: prefix + "speedbug/ranatra.svg", ref: "ranatra" },
    			   	{ groupRef: "larval", 
      			   	  bugs:	[
      			   	    { image: prefix + "speedbug/hydrobiosidae.svg", ref: "hydrobiosidae"  },
      			   	    { image: prefix + "speedbug/megaloptera.svg", ref: "corydalidae"  }
      			   	  ] }
    			  ]);
    	 });
     }
                        
  ] );
});