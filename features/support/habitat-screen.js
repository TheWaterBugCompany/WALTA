const BaseScreen = require('./base-screen');
class HabitatScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Habitat");
    }

    async setLeafPacks( p ) {
      await this.enter("Leaf Packs",p);
    }

    async setAquaticPlants( p ) {
      await this.enter("Aquatic Plants",p);
    }

    async setWood( p ) {
      await this.enter("Wood",p);
    }

    async setEdgePlants( p ) {
      await this.enter("Edge Plants",p);
    }

    async setBoulders( p ) {
      await this.enter("Boulders",p);
    }

    async setGravel( p ) {
      await this.enter("Gravel",p);
    }

    async setSandOrSilt( p ) {
      await this.enter("Sand Or Silt",p);
    }

    async setOpenWater( p ) {
      await this.enter("Open Water",p);
    }

    async goNext() {
      await this.click("Next");
      await this.world.sample.waitFor();
    }
} 
module.exports = HabitatScreen;
