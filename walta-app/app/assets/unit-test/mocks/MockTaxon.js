
function createMockTaxon( taxon ) {
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
    return model;
}
exports.createMockTaxon = createMockTaxon;