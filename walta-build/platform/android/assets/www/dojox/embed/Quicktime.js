//>>built
define("dojox/embed/Quicktime","dojo/_base/kernel,dojo/_base/lang,dojo/_base/sniff,dojo/_base/window,dojo/dom,dojo/dom-construct,dojo/domReady!".split(","),function(f,j,q,k,l,g){var h,e,o={width:320,height:240,redirect:null},p=0;f.getObject("dojox.embed",!0);e=function(){for(var a=0,b=navigator.plugins,c=b.length;a<c;a++)if(-1<b[a].name.indexOf("QuickTime"))return!0;return!1}();h=function(a){if(!e)return{id:null,markup:'This content requires the <a href="http://www.apple.com/quicktime/download/" title="Download and install QuickTime.">QuickTime plugin</a>.'};
a=f.mixin(j.clone(o),a||{});if(!("path"in a)&&!a.testing)console.error("dojox.embed.Quicktime(ctor):: no path reference to a QuickTime movie was provided."),a=null;else{if(a.testing)a.path="";if(!("id"in a))a.id="dojox-embed-quicktime-"+p++}if(!a)return null;var b='<embed type="video/quicktime" src="'+a.path+'" id="'+a.id+'" name="'+a.id+'" pluginspage="www.apple.com/quicktime/download" enablejavascript="true" width="'+a.width+'" height="'+a.height+'"',c;for(c in a.params||{})b+=" "+c+'="'+a.params[c]+
'"';return{id:a.id,markup:b+"></embed>"}};var d=function(a,b){return d.place(a,b)};f.mixin(d,{minSupported:6,available:e,supported:e,version:{major:0,minor:0,rev:0},initialized:!1,onInitialize:function(){d.initialized=!0},place:function(a,b){var c=h(a);if(!(b=l.byId(b)))b=g.create("div",{id:c.id+"-container"},k.body());return c&&(b.innerHTML=c.markup,c.id)?document[c.id]:null}});var m=h({testing:!0,width:4,height:4}),i=10,n=function(){setTimeout(function(){var a=document[m.id],b=l.byId("-qt-version-test");
if(a)try{var c=a.GetQuickTimeVersion().split(".");d.version={major:parseInt(c[0]||0),minor:parseInt(c[1]||0),rev:parseInt(c[2]||0)};if(d.supported=c[0])d.onInitialize();i=0}catch(e){i--&&n()}!i&&b&&g.destroy(b)},20)};g.create("div",{innerHTML:m.markup,id:"-qt-version-test",style:{top:"-1000px",left:0,width:"1px",height:"1px",overflow:"hidden",position:"absolute"}},k.body());n();j.setObject("dojox.embed.Quicktime",d);return d});