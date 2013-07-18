package net.thewaterbug.walta;

import org.eclipse.core.runtime.Plugin;

public class WaltaPlugin extends Plugin {
	
	// Allow easy access to plugin singleton class
	private static WaltaPlugin instance;
	public static WaltaPlugin getInstance() { return instance; }
	
	public WaltaPlugin() {
		super();
		instance = this;
	}

}
