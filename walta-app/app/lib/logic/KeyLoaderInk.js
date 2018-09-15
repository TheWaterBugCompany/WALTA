/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var _ = require('underscore');
var fs = require('fs');
var Key = require('./Key');
var Taxon = require('./Taxon');
var Question = require('./Question');
var SpeedbugIndex = require('./SpeedbugIndex');

/*
	Since XML keys can be a pain to develop - this is an experimental key loader that reads
	compiled inkle ink scripts; see https://github.com/inkle/inky and https://github.com/inkle/ink

	This enables a very simplified subset of ink script to be used to develop a key - we get a GUI editor tool for free !!

	Ink JSON compiled format is dcoumented here: https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md
*/

function container( { root, parent, node } ) {
	var obj = {
		makeChildContainer( n ) {
			return container( { root: obj.root, parent: obj, node: n });
		},

		parent: parent,

		// recurse dictionary attributes (which are always the last item in the array), wrapping
		// them with container objects when needed.
		attrs: (node ? node.slice(-1)[0] : null ),

		// list of sequential items to evaluate, also wrapping them
		evals: (node ? node.slice(0,-1) : null ),

		lookUpPathRel( parts ) {
			//console.debug( "lookUpPathRel()", parts );
			//console.debug("context", this );
			var cnt = null;
			if ( parts.length === 0 ) {
				//console.debug( "returning", this );
				return this;
			}

			var head = parts.shift();
			var index = parseInt( head );

			// Look up via index
			if ( ! _.isNaN( index ) ) {
				cnt = this.makeChildContainer( this.evals[index] );
			}
			// Look up via parent
			else if ( head === "^" ) {
				cnt = this.parent;
			}
			// Look up via named container
			else if ( _.isNull( this.attrs )
						|| _.isUndefined( this.attrs )
						|| _.isUndefined( this.attrs[head] ) )
			{
				//console.log(`looking up named node ${head}`);
				//console.debug( this );
				var nodeIndex = this.namedNodeToIndex[head];
				if ( _.isUndefined(nodeIndex) )
					throw Error(`Unable to find named node ${head}`);
				//console.log(`found named node ${head}`);
				//console.debug( this.evals[nodeIndex] );
				cnt = this.makeChildContainer( this.evals[nodeIndex] );
			}
			// Look up via named attribute
			else {
					cnt = this.makeChildContainer( this.attrs[head] );
			}

			if ( _.isNull( cnt ) || _.isUndefined( cnt ) ) {
				throw Error(`Unable to find attribute: "${head}"`);
			}

			return  cnt.lookUpPathRel( parts );
		},

		lookUpPath( path ) {
			var parts = path.split(".");
			if ( parts.length > 1 && parts[0].length === 0 ) {
				return this.lookUpPathRel( parts.slice(1) );
			} else {
				return this.root.lookUpPathRel( parts );
			}
		},

		lookUpIndexInParent() {
			if ( _.isUndefined( this.parent ) ) {
				return;
			}
			var index = _.findIndex( this.parent.evals, ev => ev === node );
			//console.log(`looking up "${this.name}" parent index = ${index}`);
			if ( index === -1 )
				return;
			return index;
		}
	}

	// Propagate a reference to the root node in every object
	obj.root = ( _.isUndefined( root ) ? obj : root );

	// Find the names of any named containers that are immediately
	// subordinate to this container.
	obj.name = ( obj.attrs ? obj.attrs["#n"] : null );
	obj.namedNodeToIndex = {};
	if ( obj.evals ) {
		_.each(obj.evals, (cnt,i) => {
			if ( _.isArray(cnt) ) {
				var attrs = cnt.slice(-1)[0];
				if ( !_.isNull(attrs) && attrs["#n"] ) {
					obj.namedNodeToIndex[ attrs["#n"] ] = i;
				}
			}
		});
	}
	return obj;
}

function processContainer( container, key ) {
	console.log(`container: ${container}`);
	// Initial state
	state = {
		localVars: {},
		outputStream: [],
		evalStack: [],
		strStack: [],
		rootNode: null,
		isTaxon: false,
		lastDivertPath: null,
		currentNode: null,
		currentQuestion: null,
		choicesToFollow: [],
		choicesStack: [],
		mode: "out"
	 };

    // The next three functions allow a non-recursive search of the container graph
	// which does keep a stack - instead it proceeds via parent links.
	function setNextToExecute( container, index ) {
		state.nextContainer = container;
		state.nextEvalIndex = index;
		findExecutionPoint();
	}

	function findExecutionPoint() {
		if ( _.isUndefined( state.nextContainer.evals )
		  || _.isNull( state.nextContainer.evals )
			|| _.isUndefined( state.nextEvalIndex )
			|| state.nextEvalIndex >= state.nextContainer.evals.length ) {

				if ( ! _.isUndefined( state.nextContainer.parent) ) {
					// If we're not ok... look for a parent to continue
					state.nextEvalIndex = state.nextContainer.lookUpIndexInParent();
					state.nextContainer = state.nextContainer.parent;
					// if we haven't found a suitable place then recurse until we do
					// or we have no parents left
					if ( _.isUndefined( state.nextEvalIndex ) ) {
							findExecutionPoint();
					} else {
						state.nextEvalIndex++;
					}
				} else {
					// we are done....
					delete state.nextEvalIndex;
					delete state.nextContainer;
				}

		}
	}

	function nextStepValid() {
		return !(_.isUndefined( state.nextEvalIndex )
			|| _.isUndefined( state.nextContainer )
			|| state.nextEvalIndex >= state.nextContainer.evals.length);
	}

	function getNextToExecute() {
		if ( ! nextStepValid() ) {
			delete state.currentStep;
			delete state.currentContainer;
			return;
		}
		state.currentStep = state.nextContainer.evals[ state.nextEvalIndex ];
		state.currentContainer = state.nextContainer;

		state.nextEvalIndex ++;
		findExecutionPoint();

		return state.currentStep;
	}

	// Need to create a null container so that the correct number of
	// parent paths works out correctly (accounts for the enclsing {})
	function lookUpCurrentPath( path ) {
		return state.currentContainer
			.makeChildContainer()
			.lookUpPath( path );
	}

	function jumpToRef( refObj ) {
		console.log(`jumpToRef: ${refObj}`);
		setNextToExecute( refObj, 0 );
	}

	function jumpToPath( path ) {
		console.log(`jumpToPath: ${path}`);
		if ( !path.includes(".") )
			state.currentNode.id = path;
		setNextToExecute( lookUpCurrentPath( path ), 0 );
	}

	function addToStack( val ) {
		if ( state.mode === "out" ) {
			state.outputStream.push(val);
		} else if ( state.mode === "eval" ) {
			state.evalStack.push(val);
		} else if ( state.mode === "str" ) {
			state.strStack.push(val);
		}
	}

	function processObject( step ) {
		// Process a divert
		if ( step["->"] ) {
			var ref = step["->"];
			var isVar = step["var"];
			if (isVar) {
				jumpToPath( state.localVars[ref] );
			} else {
				jumpToPath( ref );
			}
		}
		// Process a ChoicePoint
		else if ( step["*"] ) {
			state.choicesToFollow.push( { text: state.evalStack.pop(), refObj: lookUpCurrentPath( step["*"] ) } );
		}
		// Push target path as divert evaluate
		else if ( step["^->"] ) {
			var path = step["^->"];
			addToStack( path );
		}
		// Pop eval stack and store as local variable
		else if ( step["temp="] ) {
			var name = step["temp="];
			var val = state.evalStack.pop();
			state.localVars[name] = val;
		}
		// Process tags
		else if ( step["#"] ) {
			var parts = step['#'].split(":");
			collectAttribute( parts[0], parts.slice(1).join(":") );
		}
		// Other
		else
		{
			console.log(`found unknown object: ${_.keys(step)}`);
		}
	}

	function processPrimitive( step ) {
		if ( step.startsWith("^") ) {
			addToStack( step.slice(1) );
		}
		else if ( step === "\n" )
		{
			addToStack( step );
		}
		else if ( step === "ev" ) {
			state.mode = "eval";
		}
		else if ( step === "str" ) {
			if ( state.mode !== "eval" ) {
				throw Error("Tried to switch into string mode but I'm not in eval mode!");
			}
			state.mode = "str";
		}
		else if ( step === "/str" ) {
			if ( state.mode !== "str" ) {
				throw Error("Tried to end string mode but I'm not in string mode!");
			}
			state.mode = "eval";
			var str = state.strStack.join('\n');
			state.strStack = [];
			addToStack( str);
		}
		else if ( step === "/ev" ) {
			if ( state.mode !== "eval" ) {
				throw Error("Tried to end eval mode but I'm not in eval mode!");
			}
			state.mode = "out";
		} else if ( step === "done" ) {
			// would end but we want to iterate the entire graph so continue out of 
			// the while loop to allow the next possible choice to be followed.
		}
		else {
			console.log( `unknown step: "${step}"` );
		}
	}

	function startNode( ) {
		state.currentNode = Key.createKeyNode( { 
			// only give it a name if the last path was an absolute path
			//id: ( state.lastDivertPath && state.lastDivertPath.includes(".") ? null : state.lastDivertPath ),
			parentLink: state.currentNode
		} );
		if ( state.currentQuestion ) {
			state.currentQuestion.outcome = state.currentNode;
		}
		state.isTaxon = false;
		console.log(`starting node: ${state.currentNode.id}`);

	}

	function addQuestion( text ) {
		console.log(`adding question ${text}`);
		state.currentQuestion = { text: text };
		state.currentNode.questions.push( state.currentQuestion );
	}

	function collectAttribute( name, value ) {
		try {
			if ( name === "taxonId" ) {
				console.log(`starting taxon ${value}`);
				state.isTaxon = true;
				state.currentNode = {
					id: state.currentNode.id,
					parentLink: state.currentNode.parentLink
				}
			}
			if ( state.isTaxon ) {
				console.log(`adding attribute to taxon [${name}] = ${value}`);
				state.currentNode[name] = JSON.parse(value);
			} else if ( state.currentQuestion ) {
				console.log(`adding attribute to question [${name}] = ${value}`);
				state.currentQuestion[name] = JSON.parse(value);
			}
		} catch( e ) {
			console.log(`failed JSON: ${value}`);
		}
	}

	function endNode() {
		if ( state.isTaxon ) {
			
			if ( ! key.findTaxonById( state.currentNode.id ) ) {
				console.log(`creating new taxon`);
				var taxon = Taxon.createTaxon( state.currentNode);
				state.currentQuestion.outcome = taxon;
				key.attachTaxon( taxon );
			}
			console.log(`ending taxon`);
		} else {
			console.log(`ending key node`);
			key.attachNode( state.currentNode );
		}
		state.currentNode = null;
		state.currentQuestion = null;
		state.isTaxon = false;
	}

	function popChoicesStack() {
		if ( state.choicesStack.length > 0  ) {
			var { node, question, choices } = state.choicesStack.pop();
			state.currentNode = node;
			state.currentQuestion = question;
			state.choicesToFollow = choices;
		}
	}

	function pushChoicesStack() {
		state.choicesStack.push( {
			node: state.currentNode,
			question: state.currentQuestion,
			choices: state.choicesToFollow
		} );
		state.choicesToFollow = [];
	}

	var step;
	setNextToExecute( container, 0 );
	startNode();
	state.rootNode = state.currentNode;
	key.setRootNode( state.rootNode );

	state.choicesStack = [];

	do {
		do {
			step = getNextToExecute();
			if ( _.isArray( step ) ) {
				setNextToExecute( state.currentContainer.makeChildContainer( step ), 0 );
			} else if ( _.isObject( step ) ) {
				processObject( step );
			}	else {
				if ( ! _.isUndefined( step ) ) {
					processPrimitive( step );
				}
			}
		} while( nextStepValid() );

		// If we run out of choices to follow, pop the choicesStack
		// and continue.
		if ( state.choicesToFollow.length === 0 ) {
			endNode();
			popChoicesStack();
		}
		// Repeat until there are no choices left
		else if ( state.choicesToFollow.length > 0 ) {
			var choice = state.choicesToFollow.shift();
			addQuestion( choice.text );
			pushChoicesStack();
			startNode(); 
			jumpToRef( choice.refObj );
		}
	
	// Repeat whilst there is work to do
	} while( state.choicesToFollow.length > 0 
		|| state.choicesStack.length > 0 
		|| nextStepValid() );

}

function parseInk( inkJson, key ) {
	console.log("Running ink script...");
	processContainer( container( { node: inkJson["root"] } ), key );

	/* The entire key has two options in the root node, the first
	   is the "ALT Key" index. The second is the "Speedbug Index".
	   We need to separate these nodes to cosntruct the speedbug index. */
	console.log("Processing speed bug...");
	var root = key.getRootNode(); // original root node
	var altKey = root.findQuestion( "ALT Key" ).outcome;
	var speedBug = root.findQuestion( "Speedbug" ).outcome;
	key.dettachNode( root );
	key.dettachNode( altKey );
	key.dettachNode( speedBug );
	altKey.parentLink = null;
	key.setRootNode( altKey );
	var speedbugIndex = key.getSpeedbugIndex();
	console.log(`number of speed bug links = ${speedBug.questions.length}`);
	speedBug.questions.forEach( (q) =>{ 
		if ( q.text && q.outcome.questions ) {
			var notSure = q.outcome.questions.shift();
			console.log( `not sure = ${notSure.text}` );
			if ( notSure.text.trim().toLowerCase() !== "not sure" ) 
				throw new Error("The first link needs to be the Not Sure link");
			var groupId = notSure.outcome.id;
			speedbugIndex.addSpeedbugGroup( groupId );
			console.log( `${q.text} -> ${groupId}`);
			q.outcome.questions.forEach( (q2) => {
				console.log(`\t${q2.text} -> ${q2.outcome.id}` );
				speedbugIndex.addSpeedbugIndex( q2.mediaUrls, groupId, q2.outcome.id );
			});

		} else {
			console.log(`${q.text} -> ${q.outcome.id}` );
			speedbugIndex.addSpeedbugGroup( q.outcome.id );
			speedbugIndex.addSpeedbugIndex( q.mediaUrls, q.outcome.id, q.outcome.id );
		}
	});
	console.log("Finished.");
	return key;
}

function loadKey( root ) {
	var fileText = fs.readFileSync( root + "key.ink.json", { encoding: "UTF-8" }).slice(1);
	var inkJson = JSON.parse( fileText );
	console.log("Creating key...");
	var key = Key.createKey( { url: root });
	return parseInk(inkJson, key);
}

exports.loadKey = loadKey;
