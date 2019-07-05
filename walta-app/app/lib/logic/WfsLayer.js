 const BBoxCache = require('./BBoxCache');

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
        this._bboxCache = new BBoxCache();
    },
    
    requestFeaturesMaybe: function() {
        var that = this;

        // bail if outside of zoom level
        var bounds = this._map.getBounds();
        if ( ( Math.abs(bounds.getEast() - bounds.getWest()) > this.options.minZoom )
            || ( Math.abs(bounds.getNorth() - bounds.getSouth()) > this.options.minZoom ) )
                return;

        function toBBoxWGS84( bounds ) {
            return [ bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth() ];
        }

        function buildBbox( crs, bbox ) {
            var c1 = crs.project( new L.LatLng( bbox[3], bbox[0] ) ),
                c2 = crs.project( new L.LatLng( bbox[1], bbox[2] ) );
            return c1.x + "," + c2.y + "," + c2.x + "," + c1.y;
        }
        this._bboxCache.bboxsToFetch( toBBoxWGS84( bounds ) )
            .forEach( (bbox) => {
                fetch( this.options.url + '?service=WFS&version=2.0.0'
                    + '&request=GetFeature&typeName=' + this.options.typeName
                    + '&outputFormat=application/json'
                    + '&srs=EPSG/3857'
                    + '&count=500'
                    + '&bbox=' + buildBbox( this._map.options.crs, bbox ) )
                .then( resp  => resp.json() )
                .then( json => that.addData(json) );
            });
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

exports.default = WFSLayer;