migration.up = function(migrator) {
    migrator.db.execute('ALTER TABLE ' + migrator.table + ' ADD COLUMN updatedAt INTEGER;');
};

migration.down = function(migrator) {
    
};
