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
			getTaxonId() {
				return this.get("taxonId");
			},
			getAbundance() {
				return parseInt(this.get("abundance").split("-")[0]);
			},
			toCerdiApiJson() {
				return {
					"count": this.getAbundance(),
					"creature_id": this.getTaxonId()
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
