package net.thewaterbug.walta;

import java.io.File;
import org.eclipse.core.resources.IMarker;
import org.eclipse.core.resources.IResource;
import org.eclipse.wst.validation.ValidationResult;
import org.eclipse.wst.validation.ValidatorMessage;
import org.xml.sax.Attributes;
import org.xml.sax.Locator;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

public class WaltaPathChecker extends DefaultHandler {
	
	private IResource resource;
	private File mediaPath;
	private Locator locator;
	private ValidationResult results;
	
	public WaltaPathChecker( ValidationResult results, IResource resource, File file ) {
		this.resource = resource;
		this.mediaPath = file;
		this.results = results;
	}
	
	@Override
	public void setDocumentLocator(Locator locator) {
		this.locator = locator;
	}
	
	@Override
	public void startElement(String uri, String localName, String qName, Attributes attributes) 
		throws SAXException {
			// Search for any mediaRef elements and check that the media reference is valid
			if ( uri.equals("http://thewaterbug.net/taxonomy") && localName.equals( "mediaRef") ) {
				String url = attributes.getValue("url");
				File file = new File( mediaPath, url );
				if ( !file.exists() ) {
					foundInvalidPath( url );
				}
			}
	}

	private void foundInvalidPath(String url) {
		ValidatorMessage msg = ValidatorMessage.create( "Unable to find media resource \"" + url + "\"", resource );
		msg.setAttribute( IMarker.SEVERITY, IMarker.SEVERITY_ERROR );
		msg.setAttribute( IMarker.LINE_NUMBER, locator.getLineNumber() );
		results.add( msg );
		
	}
}
