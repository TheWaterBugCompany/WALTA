const RECIPIENT = "waterbug-diagnostics@thecodesharman.com.au";
const SUBJECT_PREFIX = "Waterbug diagnostics";
const LOG_LIMIT = 5000;
const LOG_FILENAME = "waterbug-log.txt";
// Diagnostics is incident-triage focused; drop UI/key/media chatter, keep
// the network + sync narrative that explains why a sample didn't upload.
const LOG_FACILITIES = ["sync", "network"];
const DB_TABLES = ["sample", "taxa", "migrations"];

function buildBody(platform) {
    // Ti.Filesystem.spaceAvailable has been observed returning non-finite values on iOS;
    // fall back to "unknown" rather than emitting "NaN GB" in the body.
    const freeDisk = Number.isFinite(platform.freeBytes)
        ? (platform.freeBytes / (1024 ** 3)).toFixed(1) + " GB"
        : "unknown";
    const orNotLoggedIn = (v) => (v === null || v === undefined ? "(not logged in)" : v);
    const rows = [
        ["User email:", orNotLoggedIn(platform.userEmail)],
        ["User ID:", orNotLoggedIn(platform.userId)],
        ["App version:", platform.appVersion],
        ["OS:", `${platform.osname} ${platform.osVersion}`],
        ["Phone model:", platform.model],
        ["Locale:", platform.locale],
        ["Free disk:", freeDisk],
    ];
    return rows.map(([label, value]) => label.padEnd(14) + value).join("\n");
}

function formatLogEntries(entries) {
    return entries.map((e) =>
        new Date(e.ts).toISOString()
            + " " + String(e.level).padEnd(5)
            + " " + String(e.facility).padEnd(10)
            + " " + e.message
    ).join("\n");
}

function filterLogsByFacility(entries, facilities) {
    return entries.filter((e) => facilities.indexOf(e.facility) !== -1);
}

function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function formatCsv(rows) {
    // Android Intent.ACTION_SEND_MULTIPLE / TiFileProvider silently drops 0-byte
    // attachments; emit a sentinel so empty tables still arrive in the email.
    if (rows.length === 0) return "(no rows)";
    const columns = Object.keys(rows[0]);
    const header = columns.join(",");
    const values = rows.map((row) => columns.map((c) => csvEscape(row[c])).join(","));
    return [header, ...values].join("\n");
}

function readPlatform() {
    const cerdiApi = Alloy.Globals.CerdiApi;
    return {
        userEmail: (cerdiApi && cerdiApi.retrieveUsername && cerdiApi.retrieveUsername()) || null,
        userId: (cerdiApi && cerdiApi.retrieveUserId && cerdiApi.retrieveUserId()) || null,
        appVersion: Ti.App.version,
        osname: Ti.Platform.osname,
        osVersion: Ti.Platform.version,
        model: Ti.Platform.model,
        locale: Ti.Platform.locale,
        // Ti.Filesystem.File.spaceAvailable is a method in Titanium 13.x (not the documented
        // Number property) — reading as a property returns the function reference, which
        // produces NaN when divided. The isFinite guard in buildBody is a belt-and-braces.
        freeBytes: Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory).spaceAvailable(),
    };
}

function readLogsFromRepository() {
    const LogRepository = require("repository/LogRepository");
    const repo = LogRepository.open("waterbug_data");
    // query() returns newest-first; filter to relevant facilities then reverse
    // for chronological reading order.
    return filterLogsByFacility(
        repo.query({ limit: LOG_LIMIT }),
        LOG_FACILITIES
    ).reverse();
}

function selectAll(db, table) {
    const rs = db.execute(`SELECT * FROM ${table}`);
    const rows = [];
    while (rs.isValidRow()) {
        const row = {};
        for (let i = 0; i < rs.fieldCount; i++) {
            row[rs.fieldName(i)] = rs.field(i);
        }
        rows.push(row);
        rs.next();
    }
    rs.close();
    return rows;
}

function readDbTablesFromTiDatabase() {
    const db = Ti.Database.open("samples");
    try {
        return {
            sample: selectAll(db, "sample"),
            taxa: selectAll(db, "taxa"),
            migrations: selectAll(db, "migrations"),
        };
    } finally {
        db.close();
    }
}

function readPhotoManifestFromFilesystem() {
    const dir = Ti.Filesystem.applicationDataDirectory;
    const listing = (Ti.Filesystem.getFile(dir).getDirectoryListing() || []);
    return listing
        .filter((name) => /\.(jpe?g|png)$/i.test(name))
        .map((name) => ({ name, sizeBytes: Ti.Filesystem.getFile(dir, name).size }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

function writeFileAttachment(name, content) {
    const file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, name);
    file.write(content);
    return file;
}

function openDiagnosticsEmail(deps) {
    deps = deps || {};
    const createEmailDialog = deps.createEmailDialog || ((cfg) => Ti.UI.createEmailDialog(cfg));
    const createAlertDialog = deps.createAlertDialog || ((cfg) => Ti.UI.createAlertDialog(cfg));
    const platform          = deps.platform          || readPlatform();
    const readLogs          = deps.readLogs          || readLogsFromRepository;
    const readDbTables      = deps.readDbTables      || readDbTablesFromTiDatabase;
    const readPhotoManifest = deps.readPhotoManifest || readPhotoManifestFromFilesystem;
    const writeAttachment   = deps.writeAttachment   || writeFileAttachment;

    const body    = buildBody(platform);
    const subject = `${SUBJECT_PREFIX} — ${platform.appVersion} on ${platform.model}`;
    const dialog  = createEmailDialog({
        toRecipients: [RECIPIENT],
        subject,
        messageBody: body,
    });

    if (!dialog.isSupported()) {
        createAlertDialog({
            title: "Email not set up",
            message: "Please configure Apple Mail in Settings, then try again.",
        }).show();
        return;
    }

    const logFile = writeAttachment(LOG_FILENAME, formatLogEntries(readLogs(LOG_LIMIT)));
    dialog.addAttachment(logFile);

    const tables = readDbTables();
    for (const name of DB_TABLES) {
        const csv = formatCsv(tables[name] || []);
        const file = writeAttachment(`${name}.csv`, csv);
        dialog.addAttachment(file);
    }

    const photosFile = writeAttachment("photos.csv", formatCsv(readPhotoManifest()));
    dialog.addAttachment(photosFile);

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
exports.formatLogEntries = formatLogEntries;
exports.filterLogsByFacility = filterLogsByFacility;
exports.formatCsv = formatCsv;
exports.openDiagnosticsEmail = openDiagnosticsEmail;
exports.subscribe = subscribe;
