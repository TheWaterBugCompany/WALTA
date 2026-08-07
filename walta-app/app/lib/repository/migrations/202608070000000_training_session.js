exports.up = function (migrator) {
    migrator.createTable({
        columns: {
            "sessionCode": "TEXT PRIMARY KEY"
        }
    });
};

exports.down = function (migrator) {
    migrator.dropTable();
};
