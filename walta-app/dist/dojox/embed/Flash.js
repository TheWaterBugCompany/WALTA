//>>built
define("dojox/embed/Flash",["dojo"],function(c){function h(a){a=c.delegate(i,a);if(!("path"in a))return null;if(!("id"in a))a.id=j+k++;return a}var g,e,j="dojox-embed-flash-",k=0,i={expressInstall:!1,width:320,height:240,swLiveConnect:"true",allowScriptAccess:"sameDomain",allowNetworking:"all",style:null,redirect:null};c.isIE?(g=function(a){a=h(a);if(!a)return null;var b,d=a.path;if(a.vars){var c=[];for(b in a.vars)c.push(b+"="+a.vars[b]);a.params.FlashVars=c.join("&");delete a.vars}d='<object id="'+
a.id+'" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+a.width+'" height="'+a.height+'"'+(a.style?' style="'+a.style+'"':"")+'><param name="movie" value="'+d+'" />';if(a.params)for(b in a.params)d+='<param name="'+b+'" value="'+a.params[b]+'" />';return{id:a.id,markup:d+"</object>"}},e=function(){for(var a=10,b=null;!b&&7<a;)try{b=new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+a--)}catch(d){}return b?(a=b.GetVariable("$version").split(" ")[1].split(","),{major:null!=a[0]?parseInt(a[0]):
0,minor:null!=a[1]?parseInt(a[1]):0,rev:null!=a[2]?parseInt(a[2]):0}):{major:0,minor:0,rev:0}}(),c.addOnUnload(function(){var a=function(){};c.query("object").reverse().style("display","none").forEach(function(b){for(var d in b)if("FlashVars"!=d&&c.isFunction(b[d]))try{b[d]=a}catch(e){}})})):(g=function(a){a=h(a);if(!a)return null;var b,d=a.path;if(a.vars){var c=[];for(b in a.vars)c.push(b+"="+a.vars[b]);a.params.flashVars=c.join("&");delete a.vars}d='<embed type="application/x-shockwave-flash" src="'+
d+'" id="'+a.id+'" width="'+a.width+'" height="'+a.height+'"'+(a.style?' style="'+a.style+'" ':"")+'pluginspage="'+window.location.protocol+'//www.adobe.com/go/getflashplayer" ';if(a.params)for(b in a.params)d+=" "+b+'="'+a.params[b]+'"';return{id:a.id,markup:d+" />"}},e=function(){var a=navigator.plugins["Shockwave Flash"];return a&&a.description?(a=a.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s+r|\s+b[0-9]+)/,".").split("."),{major:null!=a[0]?parseInt(a[0]):0,minor:null!=a[1]?parseInt(a[1]):
0,rev:null!=a[2]?parseInt(a[2]):0}):{major:0,minor:0,rev:0}}());var f=function(a,b){if(-1<location.href.toLowerCase().indexOf("file://"))throw Error("dojox.embed.Flash can't be run directly from a file. To instatiate the required SWF correctly it must be run from a server, like localHost.");this.available=dojox.embed.Flash.available;this.minimumVersion=a.minimumVersion||9;this.domNode=this.movie=this.id=null;b&&(b=c.byId(b));setTimeout(c.hitch(this,function(){if(a.expressInstall||this.available&&
this.available>=this.minimumVersion)if(a&&b)this.init(a,b);else this.onError("embed.Flash was not provided with the proper arguments.");else if(this.available)this.onError("Flash version detected: "+this.available+" is out of date. Minimum required: "+this.minimumVersion);else this.onError("Flash is not installed.")}),100)};c.extend(f,{onReady:function(){},onLoad:function(){},onError:function(){},_onload:function(){clearInterval(this._poller);delete this._poller;delete this._pollCount;delete this._pollMax;
this.onLoad(this.movie)},init:function(a,b){this.destroy();b=c.byId(b||this.domNode);if(!b)throw Error("dojox.embed.Flash: no domNode reference has been passed.");var d=0;this._poller=null;this._pollCount=0;this._pollMax=15;this.pollTime=100;if(dojox.embed.Flash.initialized)this.id=dojox.embed.Flash.place(a,b),this.domNode=b,setTimeout(c.hitch(this,function(){this.movie=this.byId(this.id,a.doc);this.onReady(this.movie);this._poller=setInterval(c.hitch(this,function(){try{d=this.movie.PercentLoaded()}catch(a){}if(100==
d)this._onload();else if(0==d&&this._pollCount++>this._pollMax)throw clearInterval(this._poller),Error("Building SWF failed.");}),this.pollTime)}),1)},_destroy:function(){try{this.domNode.removeChild(this.movie)}catch(a){}this.id=this.movie=this.domNode=null},destroy:function(){if(this.movie){var a=c.delegate({id:!0,movie:!0,domNode:!0,onReady:!0,onLoad:!0}),b;for(b in this)a[b]||delete this[b];this._poller?c.connect(this,"onLoad",this,"_destroy"):this._destroy()}},byId:function(a,b){b=b||document;
return b.embeds[a]?b.embeds[a]:b[a]?b[a]:window[a]?window[a]:document[a]?document[a]:null}});c.mixin(f,{minSupported:8,available:e.major,supported:e.major>=e.required,minimumRequired:e.required,version:e,initialized:!1,onInitialize:function(){f.initialized=!0},__ie_markup__:function(a){return g(a)},proxy:function(a,b){c.forEach(c.isArray(b)?b:[b],function(a){this[a]=c.hitch(this,function(){return function(){return eval(this.movie.CallFunction('<invoke name="'+a+'" returntype="javascript"><arguments>'+
c.map(arguments,function(a){return __flash__toXML(a)}).join("")+"</arguments></invoke>"))}.apply(this,arguments||[])})},a)}});f.place=function(a,b){var d=g(a),b=c.byId(b);if(!b)b=c.doc.createElement("div"),b.id=d.id+"-container",c.body().appendChild(b);return d?(b.innerHTML=d.markup,d.id):null};f.onInitialize();c.setObject("dojox.embed.Flash",f);return f});