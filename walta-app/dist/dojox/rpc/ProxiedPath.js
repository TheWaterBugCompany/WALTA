//>>built
define("dojox/rpc/ProxiedPath",["dojo","dojox","dojox/rpc/Service"],function(g,e){e.rpc.envelopeRegistry.register("PROXIED-PATH",function(b){return"PROXIED-PATH"==b},{serialize:function(b,f,c){var a,d=e.rpc.getTarget(b,f);if(g.isArray(c))for(a=0;a<c.length;a++)d+="/"+(null==c[a]?"":c[a]);else for(a in c)d+="/"+a+"/"+c[a];return{data:"",target:(f.proxyUrl||b.proxyUrl)+"?url="+encodeURIComponent(d)}},deserialize:function(b){return b}})});