/* 
 * Testing the XML loader needs to run in a Titanium environment.
 * 
 */

var XmlUtil = require('logic/XmlUtil')

var testXml = {
			url: "/spec/XmlTestDoc.xml", 
			namespaceMap: { 'test' : 'http://thewaterbug.net/test' }
};