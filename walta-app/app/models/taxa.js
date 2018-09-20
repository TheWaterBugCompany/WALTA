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
			toCerdiApiJson() {
				return {
					"count": parseInt(this.get("abundance").split("-")[0]),
					"creature_id": this.get("taxonId"),
					"photos_count": 0
				};
			}
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			toCerdiApiJson() {
				return this.map( (taxon) => taxon.toCerdiApiJson() );
			},
			loadCurrent() {
				this.fetch({ query: "SELECT * FROM taxa WHERE sampleId = (SELECT sampleId FROM sample WHERE dateCompleted IS NULL)"} );
			},
			load( sampleId ) {
				this.fetch({ query: `SELECT * FROM taxa WHERE sampleId = ${sampleId}`} );
			}
		});

		return Collection;
	}
};
