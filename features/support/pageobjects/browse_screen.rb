require_relative '../android/base_page_object'

class BrowseScreen < BasePageObject
    def trait
      "* marked:'Browse'"
    end

    def choose_taxon( taxon )
        select(taxon)
        return page(TaxonScreen).await
    end
  
end