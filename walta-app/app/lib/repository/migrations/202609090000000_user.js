exports.up = function (migrator) {
    migrator.createTable({
        columns: {
            "userId": "TEXT PRIMARY KEY NOT NULL",
            "beltLevel": "INTEGER"
        }
    });
};

exports.down = function (migrator) {
    migrator.dropTable();
};
