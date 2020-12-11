const BaseScreen = require('./base-screen');
class HabitatScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Habitat");
    }

    async getLeafPacksElement() {
      return this.getElement("Leaf Packs");
    }

    async getLeafPacks() {
      let el = await this.getLeafPacksElement();
      return this.getTextFromEditField(el);
    }

    async getBouldersElement() {
      return this.getElement("Boulders");
    }

    async getBoulders() {
      let el = await this.getBouldersElement();
      return this.getTextFromEditField(el);
    }

    async getAquaticPlantsElement() {
      return this.getElement("Aquatic Plants");
    }

    async getAquaticPlants() {
      let el = await this.getAquaticPlantsElement();
      return this.getTextFromEditField(el);
    }

    async getGravelElement() {
      return this.getElement("Gravel");
    }

    async getGravel() {
      let el = await this.getGravelElement();
      return this.getTextFromEditField(el);
    }

    async getWoodElement() {
      return this.getElement("Wood");
    }

    async getWood() {
      let el = await this.getWoodElement();
      return this.getTextFromEditField(el);
    }

    async getSandOrSiltElement() {
      return this.getElement("Sand Or Silt");
    }

    async getSandOrSilt() {
      let el = await this.getSandOrSiltElement();
      return this.getTextFromEditField(el);
    }

    async getEdgePlantsElement() {
      return this.getElement("Edge Plants");
    }

    async getEdgePlants() {
      let el = await this.getEdgePlantsElement();
      return this.getTextFromEditField(el);
    }

    async getOpenWaterElement() {
      return this.getElement("Open Water");
    }

    async getOpenWater() {
      let el = await this.getOpenWaterElement();
      return this.getTextFromEditField(el);
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

    async goBack() {
      await this.click("Back");
      await this.world.siteDetails.waitFor();
    }
} 
module.exports = HabitatScreen;
