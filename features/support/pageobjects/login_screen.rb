require_relative '../android/base_page_object'

class LoginScreen < BasePageObject
    def trait
      "* marked:'Log in with your existing account:'"
    end

    def log_in( email, password )
      wait_for_elements_exist( [email_field,password_field] )
     
      enter_text(email_field, email)
      hide_keyboard_and_wait
      enter_text(password_field, password)
      hide_keyboard_and_wait
      select('Log In')
      return page(MenuScreen).await
    end

    def email_field
      field("Email.")
    end

    def password_field
      field("Password.")
    end

end
