var Topics = require('ui/Topics');
var SampleHistoryViewModel = require('viewmodels/SampleHistory');
var bindView = require('util/bindView');
var collection = bindView.collection;

exports.baseController = "TopLevelWindow";
$.TopLevelWindow.title = "Survey History";

var userId = Alloy.Globals.CerdiApi.retrieveUserId();
$.samples = Alloy.createCollection("sample");

function toRowData(m) {
    var json = m.transform();
    return {
        serverId: m.get("serverSampleId"),
        sampleId: m.get("sampleId"),
        dateCompleted: json.dateCompleted,
        waterbodyName: json.waterbodyName,
        uploaded: json.uploaded
    };
}

var sampleSource = {
    loadAll: function() {
        $.samples.loadSampleHistory(userId);
        return $.samples.map(toRowData);
    },
    loadOne: function(sampleId) {
        var m = Alloy.createModel("sample");
        m.loadById(sampleId);
        if (!m.get("sampleId")) return undefined;
        return toRowData(m);
    }
};

$.vm = new SampleHistoryViewModel({ sampleSource: sampleSource, topics: Topics });

// Rows are driven by the collection binding: bindView owns the keyed diff
// (create / retain / dispose by sampleId) and re-applies the whole ordered list
// to the TableView via the adapter's render (setData). The adapter injects the
// Titanium row work — create + bind the row controller, and a per-row click by
// stable sampleId (Android drops table-level dispatch on reused/reordered rows).
var rowAdapter = {
    key: function(rowVm) { return rowVm.sampleId; },
    create: function(rowVm) {
        var ctl = Alloy.createController("SampleHistoryRow");
        var unbind = ctl.bind(rowVm);
        var onClick = function() { openSampleMenu(rowVm.sampleId); };
        ctl.getView().addEventListener("click", onClick);
        return { view: ctl.getView(), ctl: ctl, unbind: unbind, onClick: onClick };
    },
    dispose: function(handle) {
        handle.unbind();
        handle.view.removeEventListener("click", handle.onClick);
        if (handle.ctl && typeof handle.ctl.destroy === "function") handle.ctl.destroy();
    },
    render: function(container, handles) {
        container.setData(handles.map(function(h) { return h.view; }));
    }
};

var unbindRows = bindView($, $.vm, {
    sampleTable: { children: collection("rows", rowAdapter) }
});

var acb = $.getAnchorBar();
$.syncButton = Alloy.createController("NavButton");
$.syncButton.setLabel("Sync");
$.syncButton.on("click", syncNowClicked);
acb.addTool($.syncButton.getView());

// Session ended (manual logout, or a rejected token mid-sync dropping to
// login): tear down any open sync feedback so it doesn't linger behind.
Topics.subscribe(Topics.LOGGEDOUT, closeSyncFeedback);

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    unbindRows();
    $.vm.dispose();
    if ($.sampleMenu) $.sampleMenu.cleanUp();
    Topics.unsubscribe(Topics.LOGGEDOUT, closeSyncFeedback);
    closeSyncFeedback();
    $.syncButton.cleanUp();
    $.destroy();
    $.off();
    $.TopLevelWindow.removeEventListener('close', cleanUp);
});

function syncNowClicked() {
    if ($.syncFeedback) return;
    $.syncFeedback = Alloy.createController("SyncFeedback");
    $.TopLevelWindow.add($.syncFeedback.getView());
    $.syncFeedback.on("close", closeSyncFeedback);
    $.syncFeedback.start();
}

function closeSyncFeedback() {
    if (!$.syncFeedback) return;
    $.TopLevelWindow.remove($.syncFeedback.getView());
    $.syncFeedback.cleanUp();
    $.syncFeedback = null;
}

function openSampleMenu(sampleId) {
    function closeSelectMethod() {
        $.TopLevelWindow.remove($.sampleMenu.getView());
        $.sampleMenu.cleanUp();
    }
    $.sampleMenu = Alloy.createController("SampleEditMenu", { sampleId: sampleId });
    $.TopLevelWindow.add($.sampleMenu.getView());
    $.sampleMenu.on("close", closeSelectMethod);
}
