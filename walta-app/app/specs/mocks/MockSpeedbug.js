var speedBugResource = "specs/resources/simpleKey1/media/speedbug/";
var speedBugIndexMock = {
  getSpeedbugFromTaxonId: function( id ) {
    switch(id) {
      case "WB1":
        return speedBugResource + "aeshnidae_telephleb_b.png";

      case "WB2":
        return speedBugResource + "amphipoda_b.png";

      case "WB3":
        return speedBugResource + "anisops_b.png";

      case "WB4":
        return  speedBugResource + "anostraca_b.png";

      case "WB5":
        return speedBugResource + "atalophlebia_b.png";

    }
  }
}
exports.speedBugIndexMock = speedBugIndexMock;
