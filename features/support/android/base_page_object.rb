require 'calabash-android/abase'

class BasePageObject < Calabash::ABase

    def field(field_id)
      "* marked:'#{field_id}'"
    end 

    def select(option_name)
        tap_mark(option_name)
    end
end
