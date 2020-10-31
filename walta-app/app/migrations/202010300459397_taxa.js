migration.up = function(migrator) {
    migrator.db.execute('ALTER TABLE ' + migrator.table + ' ADD COLUMN serverCreaturePhotoId INTEGER;');

};
migration.down = function(migrator) {
    throw new Error("Migration down() not supported");
};
