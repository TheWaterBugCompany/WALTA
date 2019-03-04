'use strict';

const BaseScreen = require('./base_screen.js');

class LoginScreen extends BaseScreen {
    constructor( world ) {
        super( world );
    }
    async login( email, password ) {
        await this.enter('login_email_textfield', email );
        await this.enter('login_password_textfield', password );
        return this.click('login_login_button');
    }
} 
module.exports = LoginScreen
/*     def trait
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
    end */
