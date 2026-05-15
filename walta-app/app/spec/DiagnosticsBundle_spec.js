require("spec/lib/ti-mocha");
const { expect } = require("spec/lib/chai");
const { isManualTests } = require("spec/util/TestUtils");
const Topics = require("ui/Topics");
const DiagnosticsBundle = require("util/DiagnosticsBundle");

describe("DiagnosticsBundle subscriber", function () {
    let createdDialog;
    let createdAlert;
    let clipboardText;
    let unsubscribe;

    const fakePlatform = {
        appVersion: "9.9.9",
        osname: "ios",
        osVersion: "17.4",
        model: "iPhone-test",
        locale: "en-AU",
        freeBytes: 1_073_741_824, // 1.0 GB
    };

    function setup({ isSupported }) {
        createdDialog = null;
        createdAlert = null;
        clipboardText = null;
        unsubscribe = DiagnosticsBundle.subscribe({
            platform: fakePlatform,
            writeAttachment: (body) => ({ name: "waterbug-diagnostics.txt", body }),
            setClipboardText: (text) => { clipboardText = text; },
            createEmailDialog: (cfg) => {
                createdDialog = {
                    cfg,
                    attachments: [],
                    opened: false,
                    isSupported: function () { return isSupported; },
                    addAttachment: function (file) { this.attachments.push(file); },
                    addEventListener: function () {},
                    open: function () { this.opened = true; },
                };
                return createdDialog;
            },
            createAlertDialog: (cfg) => {
                createdAlert = {
                    cfg,
                    shown: false,
                    show: function () { this.shown = true; },
                };
                return createdAlert;
            },
        });
    }

    afterEach(function () {
        if (unsubscribe) unsubscribe();
        unsubscribe = null;
    });

    it("opens the email dialog with body, subject, recipient and attachment when Mail is supported", function () {
        setup({ isSupported: true });
        Topics.fireTopicEvent(Topics.DIAGNOSTICS);

        expect(createdDialog).to.not.be.null;
        expect(createdDialog.cfg.toRecipients).to.deep.equal(["waterbug-diagnostics@thecodesharman.com.au"]);
        expect(createdDialog.cfg.subject).to.contain("Waterbug diagnostics");
        expect(createdDialog.cfg.messageBody).to.contain("App version:");
        expect(createdDialog.attachments).to.have.lengthOf(1);
        expect(createdDialog.attachments[0].name).to.equal("waterbug-diagnostics.txt");
        expect(createdDialog.opened).to.be.true;
        expect(createdAlert).to.be.null;
    });

    it("copies the body to the clipboard and shows a copied alert when Mail is not supported", function () {
        setup({ isSupported: false });
        Topics.fireTopicEvent(Topics.DIAGNOSTICS);

        expect(createdDialog).to.not.be.null;
        expect(createdDialog.opened).to.be.false;
        expect(createdDialog.attachments).to.have.lengthOf(0);
        expect(clipboardText).to.contain("App version:");
        expect(clipboardText).to.contain("Free disk:");
        expect(createdAlert).to.not.be.null;
        expect(createdAlert.cfg.title).to.equal("Diagnostics copied");
        expect(createdAlert.cfg.message).to.equal("Diagnostics have been copied to the clipboard.");
        expect(createdAlert.shown).to.be.true;
    });

    it("[manual] opens the real Ti.UI.EmailDialog for visual inspection", function () {
        if (!isManualTests()) { this.skip(); return; }
        DiagnosticsBundle.openDiagnosticsEmail();
    });
});
