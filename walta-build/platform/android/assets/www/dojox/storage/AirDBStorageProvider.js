//>>built
define("dojox/storage/AirDBStorageProvider",["dijit","dojo","dojox","dojo/require!dojox/storage/manager,dojox/storage/Provider"],function(i,g,h){g.provide("dojox.storage.AirDBStorageProvider");g.require("dojox.storage.manager");g.require("dojox.storage.Provider");g.isAIR&&function(){if(!f)var f={};f.File=window.runtime.flash.filesystem.File;f.SQLConnection=window.runtime.flash.data.SQLConnection;f.SQLStatement=window.runtime.flash.data.SQLStatement;g.declare("dojox.storage.AirDBStorageProvider",[h.storage.Provider],
{DATABASE_FILE:"dojo.db",TABLE_NAME:"__DOJO_STORAGE",initialized:!1,_db:null,initialize:function(){this.initialized=!1;try{this._db=new f.SQLConnection,this._db.open(f.File.applicationStorageDirectory.resolvePath(this.DATABASE_FILE)),this._sql("CREATE TABLE IF NOT EXISTS "+this.TABLE_NAME+"(namespace TEXT, key TEXT, value TEXT)"),this._sql("CREATE UNIQUE INDEX IF NOT EXISTS namespace_key_index ON "+this.TABLE_NAME+" (namespace, key)"),this.initialized=!0}catch(a){console.debug("dojox.storage.AirDBStorageProvider.initialize:",
a)}h.storage.manager.loaded()},_sql:function(a,b){var c=new f.SQLStatement;c.sqlConnection=this._db;c.text=a;if(b)for(var d in b)c.parameters[d]=b[d];c.execute();return c.getResult()},_beginTransaction:function(){this._db.begin()},_commitTransaction:function(){this._db.commit()},isAvailable:function(){return!0},put:function(a,b,c,d){if(!1==this.isValidKey(a))throw Error("Invalid key given: "+a);d=d||this.DEFAULT_NAMESPACE;if(!1==this.isValidKey(d))throw Error("Invalid namespace given: "+d);try{this._sql("DELETE FROM "+
this.TABLE_NAME+" WHERE namespace = :namespace AND key = :key",{":namespace":d,":key":a}),this._sql("INSERT INTO "+this.TABLE_NAME+" VALUES (:namespace, :key, :value)",{":namespace":d,":key":a,":value":b})}catch(e){console.debug("dojox.storage.AirDBStorageProvider.put:",e);c(this.FAILED,a,e.toString());return}c&&c(this.SUCCESS,a,null,d)},get:function(a,b){if(!1==this.isValidKey(a))throw Error("Invalid key given: "+a);var b=b||this.DEFAULT_NAMESPACE,c=this._sql("SELECT * FROM "+this.TABLE_NAME+" WHERE namespace = :namespace AND key = :key",
{":namespace":b,":key":a});return c.data&&c.data.length?c.data[0].value:null},getNamespaces:function(){var a=[this.DEFAULT_NAMESPACE],b=this._sql("SELECT namespace FROM "+this.TABLE_NAME+" DESC GROUP BY namespace");if(b.data)for(var c=0;c<b.data.length;c++)b.data[c].namespace!=this.DEFAULT_NAMESPACE&&a.push(b.data[c].namespace);return a},getKeys:function(a){a=a||this.DEFAULT_NAMESPACE;if(!1==this.isValidKey(a))throw Error("Invalid namespace given: "+a);var b=[],a=this._sql("SELECT key FROM "+this.TABLE_NAME+
" WHERE namespace = :namespace",{":namespace":a});if(a.data)for(var c=0;c<a.data.length;c++)b.push(a.data[c].key);return b},clear:function(a){if(!1==this.isValidKey(a))throw Error("Invalid namespace given: "+a);this._sql("DELETE FROM "+this.TABLE_NAME+" WHERE namespace = :namespace",{":namespace":a})},remove:function(a,b){b=b||this.DEFAULT_NAMESPACE;this._sql("DELETE FROM "+this.TABLE_NAME+" WHERE namespace = :namespace AND key = :key",{":namespace":b,":key":a})},putMultiple:function(a,b,c,d){if(!1===
this.isValidKeyArray(a)||!b instanceof Array||a.length!=b.length)throw Error("Invalid arguments: keys = ["+a+"], values = ["+b+"]");if(null==d||"undefined"==typeof d)d=this.DEFAULT_NAMESPACE;if(!1==this.isValidKey(d))throw Error("Invalid namespace given: "+d);this._statusHandler=c;try{this._beginTransaction();for(var e=0;e<a.length;e++)this._sql("DELETE FROM "+this.TABLE_NAME+" WHERE namespace = :namespace AND key = :key",{":namespace":d,":key":a[e]}),this._sql("INSERT INTO "+this.TABLE_NAME+" VALUES (:namespace, :key, :value)",
{":namespace":d,":key":a[e],":value":b[e]});this._commitTransaction()}catch(f){console.debug("dojox.storage.AirDBStorageProvider.putMultiple:",f);c&&c(this.FAILED,a,f.toString(),d);return}c&&c(this.SUCCESS,a,null)},getMultiple:function(a,b){if(!1===this.isValidKeyArray(a))throw Error("Invalid key array given: "+a);if(null==b||"undefined"==typeof b)b=this.DEFAULT_NAMESPACE;if(!1==this.isValidKey(b))throw Error("Invalid namespace given: "+b);for(var c=[],d=0;d<a.length;d++){var e=this._sql("SELECT * FROM "+
this.TABLE_NAME+" WHERE namespace = :namespace AND key = :key",{":namespace":b,":key":a[d]});c[d]=e.data&&e.data.length?e.data[0].value:null}return c},removeMultiple:function(a,b){b=b||this.DEFAULT_NAMESPACE;this._beginTransaction();for(var c=0;c<a.length;c++)this._sql("DELETE FROM "+this.TABLE_NAME+" WHERE namespace = namespace = :namespace AND key = :key",{":namespace":b,":key":a[c]});this._commitTransaction()},isPermanent:function(){return!0},getMaximumSize:function(){return this.SIZE_NO_LIMIT},
hasSettingsUI:function(){return!1},showSettingsUI:function(){throw Error(this.declaredClass+" does not support a storage settings user-interface");},hideSettingsUI:function(){throw Error(this.declaredClass+" does not support a storage settings user-interface");}});h.storage.manager.register("dojox.storage.AirDBStorageProvider",new h.storage.AirDBStorageProvider);h.storage.manager.initialize()}()});