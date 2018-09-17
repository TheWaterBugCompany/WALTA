var moment = require('lib/moment');
exports.definition = {
	config: {
		columns: {
			"serverSampleId": "INTEGER",
		    "sampleId": "INTEGER PRIMARY KEY AUTOINCREMENT",
			"dateCompleted": "INTEGER",
			"uploaded": "INTEGER",
			"lat": "DECIMAL(3,5)",
			"lng": "DECIMAL(3,5)",
			"surveyType": "INTEGER",
			"waterbodyType": "INTEGER",
			"waterbodyName": "VARCHAR(255)",
			"nearbyFeature": "VARCHAR(255)",
			"boulder": "INTEGER",
			"gravel": "INTEGER",
			"sandOrSilt": "INTEGER",
			"leafPacks": "INTEGER",
			"wood": "INTEGER",
			"aquaticPlants": "INTEGER",
			"openWater": "INTEGER",
			"edgePlants": "INTEGER"
		},
		adapter: {
			type: "sql",
			collection_name: "sample",
			db_name: "samples",
			idAttribute: "sampleId"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			clearSample: function() {
				var sampleId = this.get("sampleId");
				this.clear();
				this.set({ "sampleId": sampleId});
			}
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			createNewSample: function() {
				var sample = Alloy.Models.instance("sample");
				var taxa = Alloy.Collections.instance("taxa");
				sample.clear();
				sample.save();
				taxa.reset();
				taxa.set("sampleId", sample.get("sampleId"));
				taxa.save();
				this.load();
			},

			saveCurrentSample: function() {
				var sample = Alloy.Models.instance("sample");
				var taxa = Alloy.Collections.instance("taxa");
				taxa.save();
				sample.set("dateCompleted", moment().format() );
				sample.save();
				this.save();
			},

			load: function() {
				this.fetch();
				Alloy.Models.instance("sample")
					.fetch({ query: "SELECT * FROM sample WHERE dateCompleted IS NULL"});
				Alloy.Collections.instance("taxa")
					.fetch({ query: "SELECT * FROM taxa WHERE sampleId = (SELECT sampleId FROM sample WHERE dateCompleted IS NULL)"} );
			}
		});

		return Collection;
	}
};
