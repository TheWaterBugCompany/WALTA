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

} 
module.exports = EditTaxonScreen


/*class EditTaxonScreen extends Screen {
     def trait
      "* marked:'How many did you see?'"
    end

    def abundance_slider
      field( "Abundance Slider." )
    end

    def set_abundance( binValue )
      meanVal = binValue.split("-").map(&:to_f).sum/2
      sliderWidthPer = query(abundance_slider, :width).first / 50
      height = query(abundance_slider, :height).first  / 2
      pan(abundance_slider, :right, from: {x:0, y:height}, to: {x:(sliderWidthPer*meanVal).round, y:height} )
    end

    def taxon_name
      query("* marked:'Taxon Name.'", :text).first
    end

    def save
      select("Save")
      wait_for_element_does_not_exist(trait)
      return page(SampleTrayScreen).await
    end  

    def delete
      select("Delete")
      wait_for_element_does_not_exist(trait)
      return page(SampleTrayScreen).await
    end 

    def close
      select("Close.")
      wait_for_element_does_not_exist(trait)
      return page(SampleTrayScreen).await
    end  */
