exports.up = function (migrator) {
    migrator.db.execute("ALTER TABLE user ADD COLUMN syncedBeltLevel INTEGER");
};

exports.down = function (migrator) {
    migrator.db.execute("ALTER TABLE user DROP COLUMN syncedBeltLevel");
};
