var speedBugResource = "specs/resources/simpleKey1/media/speedbug/";
var speedBugIndexMock = {
  getSpeedbugFromTaxonId: function( id ) {
    switch(id) {
      case "WB1":
        return { imgUrl: speedBugResource + "aeshnidae_telephleb_b.png" };

      case "WB2":
        return { imgUrl: speedBugResource + "amphipoda_b.png" };

      case "WB3":
        return { imgUrl: speedBugResource + "anisops_b.png" };

      case "WB4":
        return { imgUrl: speedBugResource + "anostraca_b.png" };

      case "WB5":
        return { imgUrl: speedBugResource + "atalophlebia_b.png" };

    }
  }
}
exports.speedBugIndexMock = speedBugIndexMock;
