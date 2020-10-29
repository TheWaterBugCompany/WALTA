migration.up = function(migrator) {
    migrator.db.execute('ALTER TABLE ' + migrator.table + ' ADD COLUMN serverSitePhotoId INTEGER;');
};

migration.down = function(migrator) {
    
};
