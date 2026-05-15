const RECIPIENT = "waterbug-diagnostics@thecodesharman.com.au";
const SUBJECT_PREFIX = "Waterbug diagnostics";
const ATTACHMENT_FILENAME = "waterbug-diagnostics.txt";

function buildBody(platform) {
    const gb = (platform.freeBytes / (1024 ** 3)).toFixed(1);
    const rows = [
        ["App version:", platform.appVersion],
        ["OS:", `${platform.osname} ${platform.osVersion}`],
        ["Phone model:", platform.model],
        ["Locale:", platform.locale],
        ["Free disk:", `${gb} GB`],
    ];
    return rows.map(([label, value]) => label.padEnd(14) + value).join("\n");
}

function readPlatform() {
    return {
        appVersion: Ti.App.version,
        osname: Ti.Platform.osname,
        osVersion: Ti.Platform.version,
        model: Ti.Platform.model,
        locale: Ti.Platform.locale,
        freeBytes: Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory).spaceAvailable,
    };
}

function writeStubAttachment(body) {
    const file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, ATTACHMENT_FILENAME);
    file.write(body);
    return file;
}

function openDiagnosticsEmail(deps) {
    deps = deps || {};
    const createEmailDialog = deps.createEmailDialog || ((cfg) => Ti.UI.createEmailDialog(cfg));
    const createAlertDialog = deps.createAlertDialog || ((cfg) => Ti.UI.createAlertDialog(cfg));
    const setClipboardText  = deps.setClipboardText  || ((text) => Ti.UI.Clipboard.setText(text));
    const platform          = deps.platform          || readPlatform();
    const writeAttachment   = deps.writeAttachment   || writeStubAttachment;

    const body    = buildBody(platform);
    const subject = `${SUBJECT_PREFIX} — ${platform.appVersion} on ${platform.model}`;
    const dialog  = createEmailDialog({
        toRecipients: [RECIPIENT],
        subject,
        messageBody: body,
    });

    if (!dialog.isSupported()) {
        // iOS Ti.UI.EmailDialog wraps MFMailComposeViewController, which insists on Apple Mail
        // even when other email apps are installed; many users will never see the composer.
        // Falling back to clipboard means everyone can still send diagnostics manually.
        setClipboardText(body);
        createAlertDialog({
            title: "Diagnostics copied",
            message: "Diagnostics have been copied to the clipboard.",
        }).show();
        return;
    }

    const file = writeAttachment(body);
    dialog.addAttachment(file);
    dialog.open();
}

function subscribe(deps) {
    // lazy-require so the Node unit test for buildBody doesn't pull in Ti.* via Topics
    const Topics = require("ui/Topics");
    const handler = () => openDiagnosticsEmail(deps);
    Topics.subscribe(Topics.DIAGNOSTICS, handler);
    return () => Topics.unsubscribe(Topics.DIAGNOSTICS, handler);
}

exports.buildBody = buildBody;
exports.openDiagnosticsEmail = openDiagnosticsEmail;
exports.subscribe = subscribe;
