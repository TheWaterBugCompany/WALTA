define(["doh", "dojo/aspect", "walta/Key"], function(doh, aspect, Key){
  doh.register( "Key", [
     function loadKey() {
    	 var key = new Key( { url: "../../../../walta-data/taxonomies/test" } );
    	 var deferred = new doh.Deferred();
    	 aspect.after( key, "onKeyLoaded", function() {
				// Check that the basic key has been loaded
				doh.assertEqual( key.name, "WALTA" );
				deferred.callback(true);
		 });	
		 key.load();
		 
		return deferred;
     }
                        
  ] );
});