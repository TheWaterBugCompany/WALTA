var speedBugResource = "specs/resources/simpleKey1/media/speedbug/";
var speedBugIndexMock = {
  speedbugIndex: {
    "group1": {
      refId: "group1",
      bugs: [
        {
          refId: "aeshnidae_telephleb",
          imgUrl: speedBugResource + "aeshnidae_telephleb_b.png"
        },
        {
          refId: "amphipoda",
          imgUrl: speedBugResource + "amphipoda_b.png"
        }
      ]
    },
    "group2": {
      bugs: [
        {
          refId: "anostraca",
          imgUrl: speedBugResource + "anostraca_b.png"
        }
      ]
    },
    "group3": {
      bugs: [
        {
          refId: "anisops",
          imgUrl: speedBugResource + "anisops_b.png"
        },
        {
          refId: "atalophlebia",
          imgUrl: speedBugResource + "atalophlebia_b.png"
        }
      ]
    }
  },
  setKey: function() {

  },
  getSpeedbugIndex: function() {
    return this.speedbugIndex;
  },

  getSpeedbugFromTaxonId: function( id ) {
    switch(id) {
      case "1":
        return speedBugResource + "aeshnidae_telephleb_b.png";

      case "2":
        return speedBugResource + "amphipoda_b.png";

      case "3":
        return speedBugResource + "anisops_b.png";

      case "4":
        return  speedBugResource + "anostraca_b.png";

      case "5":
        return speedBugResource + "atalophlebia_b.png";

    }
  }
}
exports.speedBugIndexMock = speedBugIndexMock;
