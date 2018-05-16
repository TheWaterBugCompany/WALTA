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
			/*var index = this.parent.namedNodeToIndex[this.name];
			console.log(`looking up "${this.name}" parent index = ${index}`);
			return index;*/
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


/*
function startTaxon( text ) {
	taxonStack.push( text );
	console.log( `begin taxon: ${text}` );
}

function endTaxon() {
	console.log( `end taxon: ${taxonStack.pop()}` );
}
*/

function processContainer( container, state ) {

	if ( _.isUndefined(state) )
		state = {
			localVars: {},
			outputStream: [],
			evalStack: [],
			strStack: [],
			currentNode: null,
			currentQuestion: null,
			choicesToFollow: [],
			mode: "out" };

  // The next three functions allow a non-recursive search of the container graph
	// which does keep a stack - instead it proceeds via parent links.
	function setNextToExecute( container, index ) {
		state.nextContainer = container;
		state.nextEvalIndex = index;
		findExecutionPoint();
	}

	function findExecutionPoint() {
		//console.log("findExecutionPoint()");
		//console.log("looking for next execution point");
		//console.log( "index = ", state.nextEvalIndex );
		//console.log( "evals = ", state.nextContainer.evals );
		if ( _.isUndefined( state.nextContainer.evals )
		  || _.isNull( state.nextContainer.evals )
			|| _.isUndefined( state.nextEvalIndex )
			|| state.nextEvalIndex >= state.nextContainer.evals.length ) {

				if ( ! _.isUndefined( state.nextContainer.parent) ) {
					// If we're not ok... look for a parent to continue
					state.nextEvalIndex = state.nextContainer.lookUpIndexInParent();
				  //console.debug( "currentEvalIndex = ", state.nextEvalIndex );
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
		//console.log(`next executing ${state.nextEvalIndex}`);
		if ( ! nextStepValid() ) {
			delete state.currentStep;
			delete state.currentContainer;
			return;
		}
		state.currentStep = state.nextContainer.evals[ state.nextEvalIndex ];
		state.currentContainer = state.nextContainer;

		state.nextEvalIndex ++;
		findExecutionPoint();

		//console.log( `next step ${_.keys(state.currentStep)}` );
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
		setNextToExecute( refObj, 0 );
	}

	function jumpToPath( path ) {
		setNextToExecute( lookUpCurrentPath( path ), 0 );
	}


	//console.debug("state = ", state );

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
				//console.log(`processing var divert "${ref}"`);
				jumpToPath( state.localVars[ref] );
			} else {
				//console.log(`processing divert "${ref}"`);
				jumpToPath( ref );
			}
		}
		// Process a ChoicePoint
		else if ( step["*"] ) {
			//console.debug("found a ChoicePoint:", step);
			//console.debug("evalStack:", state.evalStack);
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
			//console.debug(`set ${name} = `, val);
			state.localVars[name] = val;
		}
		// tags
		else if ( step["#"] ) {
			// TODO: store attributes properly
			//console.log(`# ${step["#"]}`);
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
			//console.log( `${step.slice(1)}`);
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
			// would end but we want to iterate the entire graph
			// here is a good place to process a Taxon though
			//console.log( "<--- done" );
		}
		else {
			console.log( `unknown step: "${step}"` );
		}
	}


	function startNode() {
		state.currentNode = { questions: [] };
		//console.log( `begin node` );
	}

	function addQuestion( text ) {
		//console.log( text );
		state.currentQuestion = { text: text };
		state.currentNode.questions.push( state.currentQuestion );
	}


	function collectAttribute( name, value ) {
		if ( state.currentQuestion ) {
			try {
				state.currentQuestion[name] = JSON.parse(value);
			} catch( e ) {
				console.log(`failed JSON: ${value}`);
			}
		}
	}

	function endNode() {
		console.debug( "end node:", state.currentNode );
		state.currentNode = null;
		state.currentQuestion = null;
	}


	var step;
	var loopTrap = 99999;
	setNextToExecute( container, 0 );
	startNode();
	var choicesStack = [];

	do {

			do {
				step = getNextToExecute();
				//console.debug("execute step:", step);
				if ( --loopTrap === 0 ) {
					throw Error("INFINTE LOOP");
				}
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
				if ( choicesStack.length > 0  ) {
					var { node, question, choices } = choicesStack.pop();
					state.currentNode = node;
					state.currentQuestion = question;
					state.choicesToFollow = choices;
				}
			}

			// Repeat until there are no choices left
			if ( state.choicesToFollow.length > 0 ) {
				var choice = state.choicesToFollow.shift();
				addQuestion( choice.text );
				//console.log( `following choice ${choice.name}`);

				if ( state.choicesToFollow.length > 0 ) {
					choicesStack.push( {
						node: state.currentNode,
						question: state.currentQuestion,
						choices: state.choicesToFollow
					} );
					state.choicesToFollow = [];
				} else {
					endNode();
				}
				startNode();
				jumpToRef( choice.refObj );
			}

	} while( state.choicesToFollow > 0 || nextStepValid() );

}

function parseInk( inkJson, key ) {
	processContainer( container( { node: inkJson["root"] } ) );
}

function loadKey( root ) {
	var fileText = fs.readFileSync( root + "key.ink.json", { encoding: "UTF-8" }).slice(1);
	var inkJson = JSON.parse( fileText );
	var key = Key.createKey( { url: root });
	return parseInk(inkJson, key);
}

exports.loadKey = loadKey;
