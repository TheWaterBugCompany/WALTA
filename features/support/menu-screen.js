'use strict';
const BaseScreen = require('./base-screen');
class MenuScreen extends BaseScreen {
    constructor( world ) {
        super( world );
    }
     async login( email, password ) {
        await this.click('menu_login_button');
        return this.world.login.login( email, password );
    }
} 
module.exports = MenuScreen
/*class MenuScreen extends Screen {
     def trait
      "* marked:'Waterbug\nSurvey'"
    end

    def loggedIn?
      query( "* marked:'You are Logged in'").any?
    end

    def select_survey
      select("Waterbug\nSurvey")
      page(SiteDetailsScreen).await
    end

    def log_in( email, password )
      select("Log In")
      page = page(LoginScreen).await
      return page.log_in(email,password)
    end

    def log_out
      select("You are Logged in")
      wait_for_text("Log In")
    end */
