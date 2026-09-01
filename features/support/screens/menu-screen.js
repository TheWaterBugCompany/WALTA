'use strict';
const BaseScreen = require('./base-screen');
const waitForSettled = require('../wait-for-settled');
class MenuScreen extends BaseScreen {
    constructor( world ) {
        super( world );
        this.presenceSelector = this.selector("Waterbug Survey");
    }

    // On iOS the Menu tears down and re-opens when LOGGEDIN fires, so a click
    // issued the instant the "You are Logged in" label appears can land on the
    // outgoing instance. Wait for the view to stop changing before proceeding.
    async waitForLoginSettled() {
        await this.waitForLabel("You are Logged in");
        if ( this.isIos() ) {
            await waitForSettled( () => this.driver.getPageSource() );
        }
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
        // The menu is only waited on for *presence* (menu.waitFor), and on iOS it
        // is still sliding/re-rendering when this fires; a one-shot tap lands on a
        // moving/stale element and is silently dropped. Waiting for it to stop
        // moving was not enough — a stationary menu has swallowed the tap too, and
        // the app then sits here until SiteDetails' own waitFor fails, minutes
        // later and blaming the wrong screen. Tap until the survey actually opens.
        await this.clickUntil( this.selector("Waterbug Survey"),
            () => this.world.siteDetails.isPresent() );
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
    async selectAcademy() {
      await this.click("Academy");
      await this.world.academy.waitFor();
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
