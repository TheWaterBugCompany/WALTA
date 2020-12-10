'use strict';
const BaseScreen = require('./base-screen');
class MenuScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Waterbug Survey");
    }
    async login( email, password ) {
        await this.click('Log In');
        return this.world.login.login( email, password );
    }
    async selectAbout() {
      await this.click('About')
      await this.world.about.waitFor();
    }
    async selectHelp() {
      await this.click('Help and Info')
      await this.world.help.waitFor();
    }
    async selectIdentify() {
      await this.click('Identify');
      await this.world.methodSelect.waitFor();
    }
    async selectWaterbugSurvey() {
        await this.click("Waterbug Survey");
        await this.world.siteDetails.waitFor();
    }
    async selectArchive() {
        await this.click("Archive");
        await this.world.archive.waitFor();
    }
    async selectGallery() {
      await this.click("Photo Gallery");
      await this.world.gallery.waitFor();
    }
    /*async selectMayflyMuster() {
      await this.click("menu_waterbug_survey_button");
      await this.world.siteDetails.waitFor();
    }*/
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
