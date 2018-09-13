var Key = require('logic/Key');
var Taxon = require('logic/Taxon');
var Question = require('logic/Question');

var keyMock = Key.createKey( {
    url: 'https://example.com',
    name: 'WALTA'
});

var taxons = [
    Taxon.createTaxon({ taxonId: "WB1", name: "Aeshnidae Telephleb" }),
    Taxon.createTaxon({ taxonId: "WB2", name: "Amphipoda" }),
    Taxon.createTaxon({ taxonId: "WB3", name: "Anisops" }),
    Taxon.createTaxon({ taxonId: "WB4", name: "Anostraca" }),
    Taxon.createTaxon({ taxonId: "WB5", name: "Atalophlebia" })
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