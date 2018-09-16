var speedBugResource = "specs/resources/simpleKey1/media/speedbug/";
var speedBugIndexMock = {
  setKey: function() {

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
