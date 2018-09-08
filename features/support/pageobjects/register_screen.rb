require_relative '../android/base_page_object'

class RegisterScreen < BasePageObject
    def trait
      "* marked:'Register'"
    end

    def register_via_email
      enter_text(email_field, "test@example.com.au")
      hide_soft_keyboard
      enter_text(name_field, "Test User")
      hide_soft_keyboard
      enter_text(password_field, "t3stPassw0rd")
      hide_soft_keyboard
      enter_text(passwordConfirm_field, "t3stPassw0rd")
      hide_soft_keyboard
      select('Register')
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
