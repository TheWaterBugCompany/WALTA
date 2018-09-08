require_relative '../android/base_page_object'

class RegisterScreen < BasePageObject
    def trait
      "* marked:'Register'"
    end

    def register_via_email( emailAddress, name, password )
      wait_for_elements_exist( [email_field,name_field,password_field,passwordConfirm_field] )
      
      enter_text(email_field, emailAddress)

      hide_soft_keyboard
      enter_text(name_field, name)
     
      hide_soft_keyboard
      enter_text(password_field, password)
     
      hide_soft_keyboard
      enter_text(passwordConfirm_field, password)
     
      hide_soft_keyboard
      select('Submit')
      return page(MenuScreen).await
    end

    def email_field
      field("Email.")
    end

    def name_field
      field("Name.")
    end

    def password_field
      field("Password.")
    end

    def passwordConfirm_field
      field("Password Confirmation.")
    end

end
