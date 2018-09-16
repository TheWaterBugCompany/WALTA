require_relative '../android/base_page_object'

class TaxonScreen < BasePageObject
    def trait
      "* marked:'ALT Key'"
    end
    
    def add_to_sample_button
      field("Add To Sample Button.")
    end

    def add_to_sample
      wait_for_elements_exist( [add_to_sample_button] )
      touch(add_to_sample_button)
      return page(EditTaxonScreen).await
    end  
end
