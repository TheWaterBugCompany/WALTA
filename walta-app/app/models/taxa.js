exports.definition = {
	config: {
		columns: {
		    "abundance": "VARCHAR(6)",
				"sampleId": "INTEGER", // Foreign key to sample database
				"taxonId": "INTEGER PRIMARY KEY"
		},
		adapter: {
			type: "sql",
			collection_name: "taxa",
			db_name: "samples",
			idAttribute: "taxonId"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			
		});

		return Collection;
	}
};
