exports.up = function (migrator) {
    migrator.createTable({
        columns: {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "sessionCode": "TEXT NOT NULL",
            "position": "INTEGER NOT NULL",
            "taxonId": "INTEGER"
        }
    });
};

exports.down = function (migrator) {
    migrator.dropTable();
};
