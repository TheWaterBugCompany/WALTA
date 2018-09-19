var moment = require('lib/moment');
exports.definition = {
	config: {
		columns: {
			"serverSampleId": "INTEGER",
		    "sampleId": "INTEGER PRIMARY KEY AUTOINCREMENT",
			"dateCompleted": "INTEGER",
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
				var taxa = Alloy.Collections.taxa;
				taxa.reset();
				taxa.set("sampleId", sample.get("sampleId"));
				taxa.save();
				this.clear();
				this.set({ "sampleId": sampleId});
				this.save();
			},

			toCerdiApiJson: function() {
				var taxa = Alloy.Collections.taxa;
				var attrs = {
					"sample_date": this.get("dateCompleted"),
					"lat": this.get("lat"),
					"lng": this.get("lng"),
					"scoring_method": "alt",
					"survey_type": [ "mayfly", "quick", "detailed" ][this.get("surveyType")],
					"waterbody_type": [ "river", "wetland", "lake" ][this.get("waterbodyType")],
					"waterbody_name": this.get("waterbodyName"),
					"nearby_feature": this.get("nearbyFeature"),
					"sampled_creatures": taxa.toCerdiApiJson(),
					"habitat": {
						"boulder": this.get("boulder"),
						"gravel": this.get("gravel"),
						"sandOrSilt": this.get("sandOrSilt"),
						"leafPacks": this.get("leafPacks"),
						"wood": this.get("wood"),
						"aquaticPlants": this.get("aquaticPlants"),
						"openWater": this.get("openWater"),
						"edgePlants": this.get("edgePlants")
					 } 
				};
				if (this.get("serverSampleId") ) {
					attrs["sampleId"] = this.get("serverSampleId");
				}
			},
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			createNewSample: function() {
				var sample = Alloy.Models.sample;
				var taxa = Alloy.Collections.taxa;
				sample.clear();
				sample.save();
				taxa.reset();
				taxa.set("sampleId", sample.get("sampleId"));
				taxa.save();
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
