require_relative '../android/base_page_object'

class MenuScreen < BasePageObject
    def trait
      "* marked:'Waterbug\nSurvey'"
    end

    def loggedIn?
      query( "* marked:'You are Logged in'").any?
    end
end
