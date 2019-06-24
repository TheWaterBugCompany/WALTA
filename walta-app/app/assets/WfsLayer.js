 WFSLayer = L.GeoJSON.extend({
    options: {
        url: '',
        typeName: '',
        minZoom: 0,
        maxZoom: undefined 
    },

    

    initialize: function(options) {
        L.Util.setOptions(this, options); // Is this necessary or is it redundant?
        L.GeoJSON.prototype.initialize(null, options);
    },
    
    requestFeaturesMaybe: function() {
        var that = this;
        function buildBbox( crs, bounds ) {
            var c1 = bounds.getNorthWest(),
                c2 = bounds.getSouthEast();
            return crs.project( c1 ).x + "," + crs.project( c2 ).y + "," 
                 + crs.project( c2 ).x + "," + crs.project( c1 ).y;
        }
        fetch( this.options.url + '?service=WFS&version=2.0.0'
               + '&request=GetFeature&typeName=' + this.options.typeName
               + '&outputFormat=application/json'
               + '&srs=EPSG/3857'
               + '&count=500'
               + '&bbox=' + buildBbox( this._map.options.crs, this._map.getBounds() ) )
          .then(resp  => resp.json() )
          .then( json => that.addData(json) );
    },

    onAdd: function(map) {
        // request WFS features when bounds has changed'
        this._map = map;
        this.options.coordsToLatLng = (coords) => map.options.crs.unproject(L.point(coords));
        this.options.latLngToCoords = (latlng) => map.options.crs.project(latlng);
        map.on('moveend', this.requestFeaturesMaybe, this );
        this.requestFeaturesMaybe();
        L.GeoJSON.prototype.onAdd(map);
    },
    onRemove: function(map) {
        map.off('moveend', this.requestFeaturesMaybe, this);
        L.GeoJSON.prototype.onRemove(map);
    }
});