exports.up = function (migrator) {
    migrator.createTable({
        columns: {
            "sessionCode": "TEXT PRIMARY KEY",
            "startedAt": "INTEGER"
        }
    });
};

exports.down = function (migrator) {
    migrator.dropTable();
};
