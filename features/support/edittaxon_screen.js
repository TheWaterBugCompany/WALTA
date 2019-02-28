const Screen = require('./screenobject');

class EditTaxonScreen extends Screen {
/*     def trait
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
}
