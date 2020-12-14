const BaseScreen = require('./base-screen');
class EditTaxonScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Species Name");
    }
    async goMagnify() {
      await this.click("Magnify");
      await this.world.gallery.waitFor();
    }
    async openCamera() {
      await this.click("Take Photo");
      await this.world.camera.waitFor();
    }
    async setAbundance(amount) {
      let value = 0;
      switch(amount) {
        case "1-2":
          value = 5;
          break;
        case "3-5":
          value = 20;
          break;
        case "6-10":
          value = 37;
          break;
        case "11-20":
          value = 71;
          break;
        case "> 20":
          value = 90;
          break;
        default:
          throw new Error (`Unknown amount ${amount}`)
      }
      let selector =  (this.isIos()? "XCUIElementTypeSlider":this.selector("Abundance"));
      await this.setSliderPercent( selector, value );
      await this.waitForText( amount );
    }
    async save() {
      await this.click("Save");
      await this.world.sample.waitFor();
    }
    async close() {
      await this.click("Close");
      await this.world.sample.waitFor();
    }
    async saveTaxonPhoto(filePath) {
      let taxonPhoto = await this.getElement("Photo");
      await taxonPhoto.saveScreenshot(filePath);
  }

} 
module.exports = EditTaxonScreen
