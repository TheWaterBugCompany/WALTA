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

			saveCurrentSample: function() {
				var taxa = Alloy.Collections.taxa;
				taxa.forEach( (t) => {
					t.set("sampleId", this.get("sampleId"));
					t.save();
				});
				this.set("dateCompleted", moment().format() );
				this.save();
			},

			loadCurrent() {
				this.fetch({ query: "SELECT * FROM sample WHERE dateCompleted IS NULL"});
			},

			toCerdiApiJson: function() {
				var taxa = Alloy.createCollection("taxa");
				taxa.load( this.get("sampleId") );
				Ti.API.info(`surveyType = ${this.get("surveyType")}, waterbodyType = ${this.get("waterbodyType")} `)
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
				return attrs;
			},
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			createNewSample: function() {
				var sample = Alloy.createModel("sample");
				var taxa = Alloy.Collections.taxa;
				this.add(sample);
				sample.save();
				taxa.reset();
			},

			startNewSurveyIfComplete: function(type) {
				if (    Alloy.Models.sample.get("dateCompleted") 
					 || !Alloy.Models.sample.get("sampleId")
				     || Alloy.Collections.sample.length == 0  )  {
					 this.createNewSample();
					 Alloy.Models.sample.set({"surveyType": type} );
				}
			},

			load: function() {
				this.fetch();
				Alloy.Models.instance("sample").loadCurrent();
				Alloy.Collections.instance("taxa").loadCurrent();
			},

			loadUploadQueue: function() {
				this.fetch( { query: "SELECT * FROM sample WHERE dateCompleted IS NOT NULL AND serverSampleId IS NULL"});
			}
		});

		return Collection;
	}
};
