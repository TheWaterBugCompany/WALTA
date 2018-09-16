require_relative '../android/base_page_object'

class MethodScreen < BasePageObject
    def trait
      "* marked:'Select identification method:'"
    end

    def browse
        select("Browse")
        return page(BrowseScreen).await
    end

    def speedbug
        select("Speedbug")
        return page(SpeedbugScreen).await
    end
  
    def key
        select("Key")
        return page(QuestionScreen).await
    end

end
