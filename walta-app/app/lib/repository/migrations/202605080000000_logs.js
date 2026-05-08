exports.up = function (migrator) {
    migrator.createTable({
        columns: {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "ts": "INTEGER NOT NULL",
            "level": "TEXT NOT NULL",
            "facility": "TEXT",
            "message": "TEXT"
        }
    });
};

exports.down = function (migrator) {
    migrator.dropTable();
};
