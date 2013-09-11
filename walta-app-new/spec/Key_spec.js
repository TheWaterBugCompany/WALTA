var _ = require('lib/underscore')._;

var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');

describe('Key', function() {
	
	// Create a new key and add some taxons and nodes
	var testKey = Key.createKey( {
		url: 'https://example.com',
		name: 'WALTA'
	});
	
	it( 'should be able to construct a key', function() {
		var taxons = [
		 Taxon.createTaxon({ id: "t1", name: "Taxon 1" }),
		 Taxon.createTaxon({ id: "t2", name: "Taxon 2" }),
		 Taxon.createTaxon({ id: "t3", name: "Taxon 3" })
		];
		
		_(taxons).each( function(t) { testKey.attachTaxon( t ); } );
		
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
		
		_(nodes).each( function(n) { testKey.attachNode( n ); });
		
		
	});
	
	it('should lookup up KeyNodes by id', function() {
			expect( testKey.isNode( testKey.findNode( 'n1' ) ) ).toEqual( true );
			expect( testKey.findNode( 'n1' ).id ).toEqual( 'n1');
		});
		
	it('should lookup up Taxons by id', function() {
		expect( testKey.isTaxon( testKey.findTaxon( 't1' ) ) ).toEqual( true );
		expect( testKey.findTaxon( 't1' ).id ).toEqual( 't1');
	});
	
	it('should not lookup up KeyNodes via findTaxon()', function() {
		expect( testKey.findTaxon( 'n1' ) ).toEqual( undefined );
	});
	
	it('should not lookup up Taxons via findNode()', function() {
		expect( testKey.findNode( 't1' ) ).toEqual( undefined );
	});
	
	it('should be able to link nodes to their parents', function() {
		// Link the nodes and taxons using the Key API
		testKey.linkNodeToParent( testKey.findNode( 'n1' ), 0, testKey.findNode('n2') );
		testKey.linkTaxonToParent( testKey.findNode( 'n1' ), 1, testKey.findTaxon('t1') );
		testKey.linkTaxonToParent( testKey.findNode( 'n2' ), 0, testKey.findTaxon('t2') );
		testKey.linkTaxonToParent( testKey.findNode( 'n2' ), 1, testKey.findTaxon('t3') );	
	});
	
	it('should set the root node to n1', function() {
		testKey.setRootNode( testKey.findNode( 'n1' ) );
		expect( testKey.getRootNode().id ).toEqual( 'n1' );
	});
	
	it('should set the current node to the new root n1', function() {
		expect( testKey.getCurrentNode().id ).toEqual( 'n1' );
	});
	
	// Test the choose()/back()/reset() functions
	it('should set the current node to the correct outcome on choose()', function() {
		testKey.choose(0);
		expect( testKey.getCurrentNode().id ).toEqual( 'n2' );
	});
	
	it('should set the current node to the the parent on back()', function() {
		testKey.back();
		expect( testKey.getCurrentNode().id ).toEqual( 'n1' );
	});
	
	it('should stay on the root node if back() is called from the root', function() {
		testKey.back();
		expect( testKey.getCurrentNode().id ).toEqual( 'n1' );
	});
	
	it('should return a taxon on a leaf node', function() {
		testKey.choose(0);
		testKey.choose(0);
		expect( testKey.getCurrentNode().id ).toEqual( 't2' );
	});
	
	it('should return to the node if back() is called on a taxon)', function() {
		testKey.back();
		expect( testKey.getCurrentNode().id ).toEqual( 'n2' );
	});
	
	it('should return the the root on reset()', function() {
		testKey.reset();
		expect( testKey.getCurrentNode().id ).toEqual( 'n1' );
	});
});