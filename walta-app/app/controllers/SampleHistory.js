var Topics = require('ui/Topics');
var SampleHistoryViewModel = require('viewmodels/SampleHistory');

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

var rowControllers = new Map();

function buildAndBindRow(rowVm) {
    var ctl = Alloy.createController("SampleHistoryRow");
    var unbind = ctl.bind(rowVm);
    // Per-row click by stable sampleId — Android drops table-level dispatch on reused/reordered row proxies.
    var onClick = function() { openSampleMenu(rowVm.sampleId); };
    ctl.getView().addEventListener("click", onClick);
    rowControllers.set(rowVm.sampleId, { ctl: ctl, unbind: unbind, onClick: onClick });
    return ctl.getView();
}

function disposeRow(sampleId) {
    var r = rowControllers.get(sampleId);
    if (!r) return;
    r.unbind();
    r.ctl.getView().removeEventListener("click", r.onClick);
    if (r.ctl && typeof r.ctl.destroy === "function") r.ctl.destroy();
    rowControllers.delete(sampleId);
}

function renderRows() {
    $.sampleTable.setData($.vm.rows.map(function(rowVm) {
        if (rowControllers.has(rowVm.sampleId)) {
            return rowControllers.get(rowVm.sampleId).ctl.getView();
        }
        return buildAndBindRow(rowVm);
    }));
}

renderRows();

$.vm.addListener(function () {
    var newIds = new Set($.vm.rows.map(function(r) { return r.sampleId; }));
    Array.from(rowControllers.keys()).forEach(function(id) {
        if (!newIds.has(id)) disposeRow(id);
    });
    renderRows();
});

var acb = $.getAnchorBar();
$.syncButton = Alloy.createController("NavButton");
$.syncButton.setLabel("Sync");
$.syncButton.on("click", syncNowClicked);
acb.addTool($.syncButton.getView());

$.TopLevelWindow.addEventListener('close', function cleanUp() {
    Array.from(rowControllers.keys()).forEach(disposeRow);
    $.vm.dispose();
    if ($.sampleMenu) $.sampleMenu.cleanUp();
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
