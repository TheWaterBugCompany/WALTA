require 'calabash-android/abase'

class BasePageObject < Calabash::ABase
    

    def hide_keyboard_and_wait
        hide_soft_keyboard
        wait_for(timeout: 5,timeout_message: "Timed out waiting for keyboard to cloase") do
            !keyboard_visible?
        end
        sleep 0.2
    end

    def field(field_id)
      "* marked:'#{field_id}'"
    end 

    def select(option_name)
        tap_mark(option_name)
    end
end
