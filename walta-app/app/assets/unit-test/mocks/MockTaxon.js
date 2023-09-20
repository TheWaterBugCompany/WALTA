
function createMockTaxon( taxon, saved = true ) {
    // if ( saved ) {
    //     taxon.updatedAt = 1000000;
    // }
    let model = Alloy.createModel("taxa", taxon);
    model.setPhoto = function(path) {
        this.set("taxonPhotoPath", path)
    }
    model.getPhoto = function() {
        return this.get("taxonPhotoPath");
    };
    model.getSilhouette = function() {
        return "/unit-test/resources/simpleKey1/media/speedbug/amphipoda_b.png";
    }
    model.save();
    return model;
}
exports.createMockTaxon = createMockTaxon;