var Topics = require("ui/Topics");
var { DialogCancelled } = require("logic/View");
const Logger = require('util/Logger');
const log = (m, tag = "navigation") => Logger.log(m, tag);

function Navigation(services) {
    this.history = [];
    this.controller = null;
    this.services = services;
    this.currentSample = null;
    this.currentTaxa = null;
    // Seed currentSample from the survey root that announces it on the bus.
    services.topics.subscribe(services.topics.SURVEY_STARTED,
        (data) => this.setCurrentSample(data.sample, data.taxa));
}

Navigation.prototype.getHistory = function () {
    return this.history;
}

// The roots that establish a survey's sample (new survey, or view/edit from
// history) set it here; onOpenView then threads it into every screen's args, so
// components receive the model by injection rather than reading a global.
Navigation.prototype.setCurrentSample = function(sample, taxa) {
    this.currentSample = sample;
    this.currentTaxa = taxa;
}

// Thread the active survey's sample/taxa into every screen's args.
Navigation.prototype.onOpenView = function(ctl,args) {
    Object.assign(args, {
        key: this.services.Key,
        Survey: this.services.Survey,
        sample: this.currentSample,
        taxa: this.currentTaxa,
    });
    return this.services.View.openView(ctl,args);
}

Navigation.prototype.onCloseApp = function() {
    this.services.System.closeApp();
}

// Modals are overlaid on the current window rather than pushed onto the window
// stack, so they live outside the history. View owns the Titanium glue (building
// the overlay controller, handing it to an optional lib/mvvm/controllers/<name>, and
// teardown); Navigation just names the concept.
// async so the Main.js route's checkForErrors receives a promise, like openController.
Navigation.prototype.openModal = async function (name, args) {
    return this.services.View.openModal(name, args || {}, this.services);
}

Navigation.prototype.closeModal = async function () {
    return this.services.View.closeModal();
}

// implement me to open user dialogue
Navigation.prototype.onDiscardEdits = async function () {
    // will reject if the user cancels
    let result = await this.services.View.askDiscardEdits( this.currentSample );
    if ( result == "submit")
        this.services.Survey.submitSurvey( this.currentSample );
    else if ( result == "discard")
        this.services.Survey.discardSurvey( this.currentSample );
}

/*
 * garbageCollectControllers — loop detection and history truncation.
 *
 * The user navigates the dichotomous key by opening screens, and can also
 * navigate backwards. Without truncation, tapping the same key node twice
 * would append a duplicate entry and create an ever-growing history loop.
 *
 * Algorithm:
 *   1. Check if the target page is already in history (same controller + same node id).
 *   2. If found at index N, slice history to [0..N), discarding everything after it.
 *   3. Fire PAGES_UNLOADED so discarded controllers can clean up (e.g. close windows).
 *   4. Special case: if a SiteDetails screen is being discarded AND has unsaved changes,
 *      prompt the user to submit or discard before proceeding. This is the only place
 *      where navigation is async-blocked waiting for user input.
 *
 * Example: history = [Home, QuestionA, SiteDetails, QuestionA']
 *   Opening QuestionA again → index=1, unloading=[SiteDetails, QuestionA']
 *   SiteDetails check fires → user prompted if unsaved edits exist.
 */
Navigation.prototype.garbageCollectControllers = async function (page) {
    // Two screens are "equivalent" if they show the same controller for the same key node.
    // Controllers without a node (e.g. Home) match purely on controller name.
    function isPageEquivalent(a, b) {
         if (a.ctl === b.ctl) {
            if (a.args.node && b.args.node) {
                return (a.args.node.id && b.args.node.id && (a.args.node.id === b.args.node.id));
            } else {
                return true;
            }
        }
        return false;
    }

    var index = _(this.history).findIndex((h) => isPageEquivalent(h, page));
    if (index >= 0) {
        let unloadingPages = this.history.slice(index+1);
        if (_.contains(_.pluck(unloadingPages,"ctl"), "SiteDetails")) {
            let hasUnsavedChanges =  await this.services.Survey.hasUnsavedChanges( this.currentSample );
            if (hasUnsavedChanges) {
                await this.onDiscardEdits();
            }
        }
        this.history = this.history.slice(0, index);
        Topics.fireTopicEvent(Topics.PAGES_UNLOADED, { pages: unloadingPages });
    }

}

Navigation.prototype.openController = async function (ctl, args) {
        if (!args) args = {};
        if (!args.slide) args.slide = "none";
        let page = { ctl: ctl, args: args };
        try {
            await this.garbageCollectControllers(page);

            this.history.push(page);
            log(`opening controller ="${ctl}" with args.slide="${args.slide}"`);
            await this.onOpenView(ctl, args);
        } catch( err ) {
            // do nothing if dialog is aborted
            if ( ! (err instanceof DialogCancelled) )
                throw err;
        }
}

Navigation.prototype.goBack = async function (args) {
    if (!args) args = {};
    var currentArgs = this.history[this.history.length-1].args;
    if (this.history.length === 1) {
        this.onCloseApp();
    } else {
        var cargs = this.history[this.history.length - 2];
        var ctl = cargs.ctl;
        var newargs = cargs.args;
        if (args.slide) {
            newargs.slide = args.slide
        } else {
            if (currentArgs.slide === "none") {
                newargs.slide = "none";
            } else {
                newargs.slide = "left";
            }
        }
        await this.openController(ctl, newargs);

    }
}
exports.Navigation = Navigation;


