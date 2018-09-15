require_relative '../android/base_page_object'

class TaxonScreen < BasePageObject
    def trait
      "ALT Key"
    end
    def add_to_sample
      select("Add To Sample")
      return page(EditTaxon).await
    end  
end
