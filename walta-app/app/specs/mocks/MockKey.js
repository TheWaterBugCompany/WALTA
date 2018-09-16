var Key = require('logic/Key');
var Taxon = require('logic/Taxon');
var Question = require('logic/Question');

var keyMock = Key.createKey( {
    url: 'https://example.com',
    name: 'WALTA'
});

var taxons = [
    Taxon.createTaxon({ taxonId: 1, name: "Aeshnidae Telephleb", commonName: "Aeshnidae Telephleb" }),
    Taxon.createTaxon({ taxonId: 2, name: "Amphipoda", commonName: "Amphipoda" }),
    Taxon.createTaxon({ taxonId: 3, name: "Anisops", commonName: "Anisops" }),
    Taxon.createTaxon({ taxonId: 4, name: "Anostraca", commonName: "Anostraca" }),
    Taxon.createTaxon({ taxonId: 5, name: "Atalophlebia", commonName: "Atalophlebia" })
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