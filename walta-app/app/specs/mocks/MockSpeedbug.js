var speedBugResource = "specs/resources/simpleKey1/media/speedbug/";
var SpeedbugIndex = require('logic/SpeedbugIndex');
var speedBugIndexMock = SpeedbugIndex.createSpeedbugIndex("test", null );
speedBugIndexMock.addSpeedbugGroup( "group1" );
speedBugIndexMock.addSpeedbugIndex( speedBugResource + "aeshnidae_telephleb_b.png", "group1", "aeshnidae_telephleb" );
speedBugIndexMock.addSpeedbugIndex( speedBugResource + "amphipoda_b.png", "group1", "amphipoda" );
speedBugIndexMock.addSpeedbugGroup( "group2" );
speedBugIndexMock.addSpeedbugIndex( speedBugResource + "anostraca_b.png", "group2", "anostraca" );
speedBugIndexMock.addSpeedbugGroup( "group3" );
speedBugIndexMock.addSpeedbugIndex( speedBugResource + "anisops_b.png", "group3", "anisops" );
speedBugIndexMock.addSpeedbugIndex( speedBugResource + "atalophlebia_b.png", "group3", "atalophlebia" );

exports.speedBugIndexMock = speedBugIndexMock;
