var bindView = require("util/bindView");

exports.bind = function(rowVm) {
    return bindView($, rowVm, {
        idColumn:            { text: "serverId" },
        dateCompletedColumn: { text: "dateCompleted" },
        waterbodyName:       { text: "waterbodyName" },
        boolColumn:          { text: "uploaded" }
    });
};
