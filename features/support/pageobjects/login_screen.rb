require_relative '../android/base_page_object'

class LoginScreen < BasePageObject
    def trait
      "* marked:'Log in with your existing account:'"
    end

end
