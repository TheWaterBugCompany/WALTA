require_relative '../android/base_page_object'

class SummaryScreen < BasePageObject
    def trait
      "* marked:'Summary'"
    end

    def done
      select("Done")
      page(MenuScreen).await
    end

    def register
      select("Register")
      page(LogInScreen).await
    end
  
end