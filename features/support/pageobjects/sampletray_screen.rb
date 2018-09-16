require_relative '../android/base_page_object'

class SampleTrayScreen < BasePageObject
    def trait
      "* marked:'Sample'"
    end

    def start_identification
        select("Add.")
        return page(MethodScreen).await
    end

    def abundance
        query(abundance_label,:text).first
    end

    def abundance_label
        field( "Abundance.")
    end
  
end
