var Key = require('logic/Key');
var Taxon = require('logic/Taxon');
var Question = require('logic/Question');

var keyMock = Key.createKey( {
    url: 'https://example.com',
    name: 'WALTA'
});
var speedBugResource = "/unit-test/resources/simpleKey1/media/speedbug/";
var mediaResource = "/unit-test/resources/simpleKey1/media/";
var taxons = [
    Taxon.createTaxon({ taxonId: 1, name: "Aeshnidae Telephleb", commonName: "Aeshnidae Telephleb", bluebug: [ speedBugResource + "aeshnidae_telephleb_b.png" ]  }),
    Taxon.createTaxon({ taxonId: 2, name: "Amphipoda", bluebug: [ speedBugResource + "amphipoda_b.png" ] }),
    Taxon.createTaxon({ taxonId: 3, name: "Anisops", commonName: "Anisops", bluebug: [ speedBugResource + "anisops_b.png" ] }),
    Taxon.createTaxon({ taxonId: 4, name: "Anostraca", commonName: "Anostraca", bluebug: [ speedBugResource + "anostraca_b.png" ] }),
    Taxon.createTaxon({ taxonId: 5, name: "Atalophlebia", commonName: "Atalophlebia", bluebug: [ speedBugResource + "atalophlebia_b.png" ] }),

    Taxon.createTaxon({ taxonId: 6, name: "Aeshnidae Telephleb", commonName: "Aeshnidae Telephleb", bluebug: [ speedBugResource + "aeshnidae_telephleb_b.png" ]  }),
    Taxon.createTaxon({ taxonId: 7, name: "Amphipoda", bluebug: [ speedBugResource + "amphipoda_b.png" ] }),
    Taxon.createTaxon({ taxonId: 8, name: "Anisops", commonName: "Anisops", bluebug: [ speedBugResource + "anisops_b.png" ] }),
    Taxon.createTaxon({ taxonId: 9, name: "Anostraca", commonName: "Anostraca", bluebug: [ speedBugResource + "anostraca_b.png" ] }),
    Taxon.createTaxon({ taxonId: 10, name: "Atalophlebia", commonName: "Atalophlebia", bluebug: [ speedBugResource + "atalophlebia_b.png" ] }),

    Taxon.createTaxon({ taxonId: 11, name: "Aeshnidae Telephleb", commonName: "Aeshnidae Telephleb", bluebug: [ speedBugResource + "aeshnidae_telephleb_b.png" ]  }),
    Taxon.createTaxon({ taxonId: 12, name: "Amphipoda", bluebug: [ speedBugResource + "amphipoda_b.png" ] }),
    Taxon.createTaxon({ taxonId: 13, name: "Anisops", commonName: "Anisops", bluebug: [ speedBugResource + "anisops_b.png" ] }),
    Taxon.createTaxon({ taxonId: 14, name: "Anostraca", commonName: "Anostraca", bluebug: [ speedBugResource + "anostraca_b.png" ] }),
    Taxon.createTaxon({ taxonId: 15, name: "Atalophlebia", commonName: "Atalophlebia", bluebug: [ speedBugResource + "atalophlebia_b.png" ] }),
     
    Taxon.createTaxon({ taxonId: 16, name: "Aeshnidae Telephleb", commonName: "Aeshnidae Telephleb", bluebug: [ speedBugResource + "aeshnidae_telephleb_b.png" ]  }),
    Taxon.createTaxon({ taxonId: 17, name: "Amphipoda", bluebug: [ speedBugResource + "amphipoda_b.png" ] }),
    Taxon.createTaxon({ taxonId: 18, name: "Anisops", commonName: "Anisops", bluebug: [ speedBugResource + "anisops_b.png" ] }),
    Taxon.createTaxon({ taxonId: 19, name: "Anostraca", commonName: "Anostraca", bluebug: [ speedBugResource + "anostraca_b.png" ] }),
    Taxon.createTaxon({ taxonId: 20, name: "Atalophlebia", commonName: "Atalophlebia", bluebug: [ speedBugResource + "atalophlebia_b.png" ] }),

    Taxon.createTaxon({ taxonId: 21, name: "Aeshnidae Telephleb", commonName: "Aeshnidae Telephleb", bluebug: [ speedBugResource + "aeshnidae_telephleb_b.png" ]  }),
    Taxon.createTaxon({ taxonId: 22, name: "Amphipoda", bluebug: [ speedBugResource + "amphipoda_b.png" ] }),
    Taxon.createTaxon({ taxonId: 23, name: "Anisops", commonName: "Anisops", bluebug: [ speedBugResource + "anisops_b.png" ] }),
    Taxon.createTaxon({ taxonId: 24, name: "Anostraca", commonName: "Anostraca", bluebug: [ speedBugResource + "anostraca_b.png" ] }),
    Taxon.createTaxon({ taxonId: 25, name: "Atalophlebia", commonName: "Atalophlebia", bluebug: [ speedBugResource + "atalophlebia_b.png" ] }),
    
    Taxon.createTaxon({ taxonId: 26, name: "Aeshnidae Telephleb", commonName: "Aeshnidae Telephleb", bluebug: [ speedBugResource + "aeshnidae_telephleb_b.png" ]  }),
    Taxon.createTaxon({ taxonId: 27, name: "Amphipoda", bluebug: [ speedBugResource + "amphipoda_b.png" ] }),
   ];

_(taxons).each( function(t) { keyMock.attachTaxon( t ); } );

var nodes = [
    Key.createKeyNode( {
        id: 'n1',
        questions: [
            Question.createQuestion( { text: ' Question 1' }),
            Question.createQuestion( { text: ' Question 2' })
        ]
    }),
    Key.createKeyNode( {
        id: 'n2',
        questions: [
            Question.createQuestion( { text: ' Question 3' }),
            Question.createQuestion( { text: ' Question 4' })
        ]
    })
];

_(nodes).each( function(n) { keyMock.attachNode( n ); });
exports.keyMock = keyMock;