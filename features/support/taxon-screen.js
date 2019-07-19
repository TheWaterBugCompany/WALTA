const BaseScreen = require('./base-screen');

class TaxonScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = "taxon_heading_text";
    }
    async getHeading() {
        var el = await this.getElement("taxon_heading_text");
        return el.getText();
    }
    async goBack() {
      await this.click("go_back_button");
    }
    async goBackAndExpect(text) {
      await this.goBack();
      await this.waitForText(text);
    }
} 
module.exports = TaxonScreen;
/*class TaxonScreen extends Screen {
/*     def trait
      "* marked:'ALT Key'"
    end
    
    def add_to_sample_button
      field("Add To Sample Button.")
    end

    def add_to_sample
      wait_for_elements_exist( [add_to_sample_button] )
      touch(add_to_sample_button)
      return page(EditTaxonScreen).await
    end   */
