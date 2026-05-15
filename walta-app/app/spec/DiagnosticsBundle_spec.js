require("spec/lib/ti-mocha");
const { expect } = require("spec/lib/chai");
const { isManualTests } = require("spec/util/TestUtils");
const Topics = require("ui/Topics");
const DiagnosticsBundle = require("util/DiagnosticsBundle");

describe("DiagnosticsBundle subscriber", function () {
    let createdDialog;
    let createdAlert;
    let writtenFiles;
    let unsubscribe;

    const fakePlatform = {
        appVersion: "9.9.9",
        osname: "ios",
        osVersion: "17.4",
        model: "iPhone-test",
        locale: "en-AU",
        freeBytes: 1_073_741_824, // 1.0 GB
    };

    const fakeLogs = [
        { ts: 0, level: "info", facility: "sync", message: "Sync finished successfully" },
    ];
    const fakeDb = {
        sample: [{ sampleId: 1, waterbodyName: "Yarra River" }],
        taxa: [],
        migrations: [{ latest: "202504280000000", model: "sample" }],
    };
    const fakePhotos = [
        { name: "sitePhoto_42_123.jpg", sizeBytes: 12345 },
        { name: "taxon_42_Bug_456.png", sizeBytes: 23456 },
    ];

    function setup({ isSupported }) {
        createdDialog = null;
        createdAlert = null;
        writtenFiles = [];
        unsubscribe = DiagnosticsBundle.subscribe({
            platform: fakePlatform,
            readLogs: () => fakeLogs,
            readDbTables: () => fakeDb,
            readPhotoManifest: () => fakePhotos,
            writeAttachment: (name, content) => {
                const file = { name, content };
                writtenFiles.push(file);
                return file;
            },
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

    it("opens the email dialog with body + log + DB attachments when Mail is supported", function () {
        setup({ isSupported: true });
        Topics.fireTopicEvent(Topics.DIAGNOSTICS);

        expect(createdDialog).to.not.be.null;
        expect(createdDialog.cfg.toRecipients).to.deep.equal(["waterbug-diagnostics@thecodesharman.com.au"]);
        expect(createdDialog.cfg.subject).to.contain("Waterbug diagnostics");
        expect(createdDialog.cfg.messageBody).to.contain("App version:");
        expect(createdDialog.attachments).to.have.lengthOf(5);
        expect(createdDialog.attachments[0].name).to.equal("waterbug-log.txt");
        expect(createdDialog.attachments[0].content).to.contain("Sync finished successfully");
        expect(createdDialog.attachments[1].name).to.equal("sample.csv");
        expect(createdDialog.attachments[1].content).to.contain("waterbodyName");
        expect(createdDialog.attachments[1].content).to.contain("Yarra River");
        expect(createdDialog.attachments[2].name).to.equal("taxa.csv");
        expect(createdDialog.attachments[3].name).to.equal("migrations.csv");
        expect(createdDialog.attachments[3].content).to.contain("latest,model");
        expect(createdDialog.attachments[4].name).to.equal("photos.csv");
        expect(createdDialog.attachments[4].content).to.contain("name,sizeBytes");
        expect(createdDialog.attachments[4].content).to.contain("sitePhoto_42_123.jpg");
        expect(createdDialog.attachments[4].content).to.contain("12345");
        expect(createdDialog.opened).to.be.true;
        expect(createdAlert).to.be.null;
    });

    it("shows an alert and does not open the dialog when Mail is not supported", function () {
        setup({ isSupported: false });
        Topics.fireTopicEvent(Topics.DIAGNOSTICS);

        expect(createdDialog).to.not.be.null;
        expect(createdDialog.opened).to.be.false;
        expect(createdDialog.attachments).to.have.lengthOf(0);
        expect(writtenFiles).to.have.lengthOf(0);
        expect(createdAlert).to.not.be.null;
        expect(createdAlert.cfg.title).to.equal("Email not set up");
        expect(createdAlert.shown).to.be.true;
    });

    it("[manual] opens the real Ti.UI.EmailDialog for visual inspection", function () {
        if (!isManualTests()) { this.skip(); return; }
        DiagnosticsBundle.openDiagnosticsEmail();
    });
});
