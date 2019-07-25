const BaseScreen = require('./base-screen');
class HabitatScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "toolbar_habitat";
    }

    async setLeafPacks( p ) {
      await this.enter("habitat_leaf_packs",p);
    }

    async setAquaticPlants( p ) {
      await this.enter("habitat_aquatic_plants",p);
    }

    async setWood( p ) {
      await this.enter("habitat_wood",p);
    }

    async setEdgePlants( p ) {
      await this.enter("habitat_edge_plants",p);
    }

    async setBoulders( p ) {
      await this.enter("habitat_boulders",p);
    }

    async setGravel( p ) {
      await this.enter("habitat_gravel",p);
    }

    async setSandOrSilt( p ) {
      await this.enter("habitat_sand_or_silt",p);
    }

    async setOpenWater( p ) {
      await this.enter("habitat_open_water",p);
    }

    async goNext() {
      await this.click("habitat_next");
      await this.world.sample.waitFor();
    }
} 
module.exports = HabitatScreen;
