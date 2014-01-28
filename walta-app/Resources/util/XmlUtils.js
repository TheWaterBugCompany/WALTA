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
		throw "Unable to find file: " + file.getNativePath();
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