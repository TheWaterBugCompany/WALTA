require_relative '../android/base_page_object'

class MenuScreen < BasePageObject
    def trait
      "* marked:'Waterbug\nSurvey'"
    end

    def loggedIn?
      query( "* marked:'You are Logged in'").any?
    end

    def log_in( email, password )
      select("Log In")
      page = page(LoginScreen).await
      page.log_in(email,password)
    end

    def log_out
      select("You are Logged in")
      wait_for_text("Log In")
    end
end
