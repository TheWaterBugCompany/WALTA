package net.thewaterbug.walta;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.eclipse.core.resources.IResource;
import org.eclipse.core.runtime.IProgressMonitor;
import org.eclipse.wst.validation.AbstractValidator;
import org.eclipse.wst.validation.ValidationResult;
import org.eclipse.wst.validation.ValidationState;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;

public class WaltaKeyValidator extends AbstractValidator  {
	
	//private ILog log = WaltaPlugin.getInstance().getLog();
	
	@Override
	public ValidationResult validate(IResource resource, int kind, ValidationState state, IProgressMonitor monitor) {
		
		//log.log( new Status(Status.INFO, "net.waterbug.walta", Status.OK, "validate() method called", null ) );
		
		ValidationResult res = new ValidationResult();
		
		SAXParserFactory spf = SAXParserFactory.newInstance();
		spf.setNamespaceAware(true);
		
		// Parse the underlying file collecting any messages
		try {
			SAXParser saxParser = spf.newSAXParser();
			XMLReader xmlReader = saxParser.getXMLReader();
			WaltaPathChecker pathChecker = new WaltaPathChecker( res, resource, new File( resource.getLocation().toFile().getParent(), "media" ) );
			xmlReader.setContentHandler( pathChecker );
			xmlReader.parse( new InputSource( new FileInputStream( resource.getLocation().toFile() ) ) );	
		} catch (ParserConfigurationException e) {

		} catch (SAXException e) {
			
		} catch (FileNotFoundException e) {
			
		} catch (IOException e) {
			
		}
	
		return res;
	}

}
