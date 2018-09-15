require_relative '../android/base_page_object'

class EditTaxonScreen < BasePageObject
    def trait
      "How many did you see?"
    end

    def taxon_name
      query("* marked:'Taxon Name.'", :text).first
    end

    def save
      select("Save")
      return page(SampleTrayScreen).await
    end  

    def delete
      select("Delete")
      return page(SampleTrayScreen).await
    end 

    def close
      select("Close.")
      return page(SampleTrayScreen).await
    end 
end
