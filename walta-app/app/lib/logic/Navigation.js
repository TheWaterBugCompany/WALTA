var Topics = require("ui/Topics");
var { DialogCancelled } = require("logic/View");
const Logger = require('util/Logger');

function questionToString(args) {
    if (!args || !args.node || !args.node.questions)
        return "";
    return `[0]= ${args.node.questions[0].text} [1]= ${args.node.questions[1].text}`;
}

function dumpHistory(history) {
    Ti.API.info("\ndump history:\n");
    history.forEach((obj, i) => {
        Ti.API.info(`${i}: ${obj.ctl} ${obj.args.slide} ${(obj.args.node && obj.args.node.id) ? obj.args.node.id : "(no id)"} ${questionToString(obj.args)}`)
    });
}

function Navigation(services) {
    this.history = [];
    this.controller = null;
    this.services = services;
}

Navigation.prototype.getHistory = function () {
    return this.history;
}

Navigation.prototype.onOpenView = function(ctl,args) {
    _.extend(args, {key: this.services.Key, Survey: this.services.Survey});
    return this.services.View.openView(ctl,args);
}

Navigation.prototype.onCloseApp = function() {
    this.services.System.closeApp();
}

// implement me to open user dialogue
Navigation.prototype.onDiscardEdits = async function () {
    // will reject if the user cancels
    let result = await this.services.View.askDiscardEdits();
    if ( result == "submit")
        this.services.Survey.submitSurvey();
    else if ( result == "discard")
        this.services.Survey.discardSurvey();
}

Navigation.prototype.garbageCollectControllers = async function (page) {
    // search for a version of this page 
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

    // find the previous instance of an equivalent screen and truncate
    // the history to avoid the ability to create long loops as this
    // is annoying to the user.

    // this now is used to detect when an in progress edit should be
    // discarded and alert the user.
    
    var index = _(this.history).findIndex((h) => isPageEquivalent(h, page));
    if (index >= 0) {
        let unloadingPages = this.history.slice(index+1);
        if (_.contains(_.pluck(unloadingPages,"ctl"), "SiteDetails")) {
            let hasUnsavedChanges =  await this.services.Survey.hasUnsavedChanges();
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
            dumpHistory(this.history);
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
        Logger.log(`opening controller (on back) ="${ctl}" with args.slide="${newargs.slide}"`);
        await this.openController(ctl, newargs);

    }
}
exports.Navigation = Navigation;


