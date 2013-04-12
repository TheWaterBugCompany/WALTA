//>>built
define("dojox/data/FileStore",["dojo/_base/declare","dojo/_base/lang","dojo/_base/kernel","dojo/_base/json","dojo/_base/xhr"],function(j,f,h,g,i){return j("dojox.data.FileStore",null,{constructor:function(a){if(a&&a.label)this.label=a.label;if(a&&a.url)this.url=a.url;if(a&&a.options)if(f.isArray(a.options))this.options=a.options;else if(f.isString(a.options))this.options=a.options.split(",");if(a&&a.pathAsQueryParam)this.pathAsQueryParam=!0;if(a&&"urlPreventCache"in a)this.urlPreventCache=a.urlPreventCache?
!0:!1},url:"",_storeRef:"_S",label:"name",_identifier:"path",_attributes:"children,directory,name,path,modified,size,parentDir".split(","),pathSeparator:"/",options:[],failOk:!1,urlPreventCache:!0,_assertIsItem:function(a){if(!this.isItem(a))throw Error("dojox.data.FileStore: a function was passed an item argument that was not an item");},_assertIsAttribute:function(a){if("string"!==typeof a)throw Error("dojox.data.FileStore: a function was passed an attribute argument that was not an attribute name string");
},pathAsQueryParam:!1,getFeatures:function(){return{"dojo.data.api.Read":!0,"dojo.data.api.Identity":!0}},getValue:function(a,b,c){return(a=this.getValues(a,b))&&0<a.length?a[0]:c},getAttributes:function(){return this._attributes},hasAttribute:function(a,b){this._assertIsItem(a);this._assertIsAttribute(b);return b in a},getIdentity:function(a){return this.getValue(a,this._identifier)},getIdentityAttributes:function(){return[this._identifier]},isItemLoaded:function(a){var b=this.isItem(a);b&&"boolean"==
typeof a._loaded&&!a._loaded&&(b=!1);return b},loadItem:function(a){var b=a.item,c=this,d=a.scope||h.global,e={};if(0<this.options.length)e.options=g.toJson(this.options);if(this.pathAsQueryParam)e.path=b.parentPath+this.pathSeparator+b.name;e=i.get({url:this.pathAsQueryParam?this.url:this.url+"/"+b.parentPath+"/"+b.name,handleAs:"json-comment-optional",content:e,preventCache:this.urlPreventCache,failOk:this.failOk});e.addErrback(function(b){a.onError&&a.onError.call(d,b)});e.addCallback(function(e){delete b.parentPath;
delete b._loaded;f.mixin(b,e);c._processItem(b);a.onItem&&a.onItem.call(d,b)})},getLabel:function(a){return this.getValue(a,this.label)},getLabelAttributes:function(){return[this.label]},containsValue:function(a,b,c){a=this.getValues(a,b);for(b=0;b<a.length;b++)if(a[b]==c)return!0;return!1},getValues:function(a,b){this._assertIsItem(a);this._assertIsAttribute(b);var c=a[b];"undefined"!==typeof c&&!f.isArray(c)?c=[c]:"undefined"===typeof c&&(c=[]);return c},isItem:function(a){return a&&a[this._storeRef]===
this?!0:!1},close:function(){},fetch:function(a){a=a||{};if(!a.store)a.store=this;var b=this,c=a.scope||h.global,d={};if(a.query)d.query=g.toJson(a.query);if(a.sort)d.sort=g.toJson(a.sort);if(a.queryOptions)d.queryOptions=g.toJson(a.queryOptions);if("number"==typeof a.start)d.start=""+a.start;if("number"==typeof a.count)d.count=""+a.count;if(0<this.options.length)d.options=g.toJson(this.options);d=i.get({url:this.url,preventCache:this.urlPreventCache,failOk:this.failOk,handleAs:"json-comment-optional",
content:d});d.addCallback(function(c){b._processResult(c,a)});d.addErrback(function(b){a.onError&&a.onError.call(c,b,a)})},fetchItemByIdentity:function(a){var b=a.identity,c=this,d=a.scope||h.global,e={};if(0<this.options.length)e.options=g.toJson(this.options);if(this.pathAsQueryParam)e.path=b;b=i.get({url:this.pathAsQueryParam?this.url:this.url+"/"+b,handleAs:"json-comment-optional",content:e,preventCache:this.urlPreventCache,failOk:this.failOk});b.addErrback(function(b){a.onError&&a.onError.call(d,
b)});b.addCallback(function(b){b=c._processItem(b);a.onItem&&a.onItem.call(d,b)})},_processResult:function(a,b){var c=b.scope||h.global;try{if(a.pathSeparator)this.pathSeparator=a.pathSeparator;b.onBegin&&b.onBegin.call(c,a.total,b);var d=this._processItemArray(a.items);if(b.onItem){var e;for(e=0;e<d.length;e++)b.onItem.call(c,d[e],b);d=null}b.onComplete&&b.onComplete.call(c,d,b)}catch(f){b.onError?b.onError.call(c,f,b):console.log(f)}},_processItemArray:function(a){var b;for(b=0;b<a.length;b++)this._processItem(a[b]);
return a},_processItem:function(a){if(!a)return null;a[this._storeRef]=this;if(a.children&&a.directory)if(f.isArray(a.children)){var b=a.children,c;for(c=0;c<b.length;c++){var d=b[c];f.isObject(d)?b[c]=this._processItem(d):(b[c]={name:d,_loaded:!1,parentPath:a.path},b[c][this._storeRef]=this)}}else delete a.children;return a}})});