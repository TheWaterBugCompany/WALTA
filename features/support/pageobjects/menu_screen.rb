require_relative '../android/base_page_object'

class MenuScreen < BasePageObject
    def trait
      "* marked:'The Waterbug App'"
    end

    def select_alt_key
      tap_mark("ALT key")
    end

end
