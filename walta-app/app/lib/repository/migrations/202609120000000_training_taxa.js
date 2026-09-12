exports.up = function (migrator) {
    migrator.db.execute("ALTER TABLE training_taxa ADD COLUMN route TEXT");
};

exports.down = function (migrator) {
    migrator.db.execute("ALTER TABLE training_taxa DROP COLUMN route");
};
