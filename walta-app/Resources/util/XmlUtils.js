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

/*
 * XmlUtils
 * 
 * Some convenience functions to facilitate XML DOM parsing.
 */

var _ = require('lib/underscore')._;

Ti.XML.applyProperties({
	namespaceAware: true
});

function loadXml( path ) {
	var file = Ti.Filesystem.getFile( path );
	if ( ! file.exists() ) 
		Ti.API.error( 'Unable to find file: ' + path );
	return Ti.XML.parseString( file.read().text );
}

function isXmlElement( node ) {
	return node.nodeType === node.ELEMENT_NODE;
}

function isXmlNode( node, ns, tagName ) {
	return ( node.tagName === tagName && node.namespaceURI === ns );
}

// Searches for the first Element child of node
function getFirstChildElement( node ) {
	if ( ! node.hasChildNodes() ) return null;
	var cs = node.getChildNodes();
	var rn = null;
	var i = 0;
	while( _.isNull(rn) && i < cs.length ) {
		var c = cs.item(i++);
		if ( c.nodeType === node.ELEMENT_NODE ) {
			rn = c;
		}
	}
	return rn;
}

function childElements( node, func ) {
	iterateXmlNodeList( node.getChildNodes(), function(nd) {
		if ( isXmlElement( nd ) ) {
			func( nd );
		}
	});
}

function childElementsByTag( node, ns, tagName, func ) {
	iterateXmlNodeList( node.getChildNodes(), function(nd) {
		if ( isXmlNode( nd, ns, tagName ) ) {
			func( nd );
		}
	});
}

function iterateXmlNodeList( nodeList, func ) {
	for( var i = 0; i < nodeList.length; i++ ) {
		func( nodeList.item( i ) );
	}
}

function getAttr( node, attrName ) {
	if ( node.hasAttribute( attrName ) ) {
		return node.getAttribute( attrName );
	} else {
		return undefined;
	}
}

exports.loadXml = loadXml;
exports.isXmlNode = isXmlNode;
exports.getFirstChildElement = getFirstChildElement;
exports.childElements = childElements;
exports.childElementsByTag = childElementsByTag;
exports.iterateXmlNodeList = iterateXmlNodeList;
exports.getAttr = getAttr;