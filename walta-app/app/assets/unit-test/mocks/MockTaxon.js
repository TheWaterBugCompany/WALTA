var { createModel } = require('unit-test/lib/mocx');
function createMockTaxon( taxon ) {
    let model = createModel( "taxa", taxon);
    model.setPhoto = function(path) {
        this.set("taxonPhotoPath", path)
    }
    model.getPhoto = function() {
        return this.get("taxonPhotoPath");
    };
    model.getAbundance = function (){
        var abundance = this.get("abundance");
        if ( abundance.startsWith(">")) return 30;
        let [ min, max ] = abundance.split("-").map((a) => parseInt(a) );
        return Math.round((min+max)/2);
    };
    model.getSilhouette = function() {
        return "unit-test/resources/simpleKey1/media/speedbug/amphipoda_b.png";
    }
    return model;
}
exports.createMockTaxon = createMockTaxon;