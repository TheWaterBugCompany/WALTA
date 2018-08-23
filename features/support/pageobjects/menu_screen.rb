require_relative '../android/base_page_object'

class MenuScreen < BasePageObject
    def trait
      "* marked:'The Waterbug App'"
    end

    def select(option_name)
      tap_mark(option_name)
    end

end
