//>>built
define("walta/HomeView","dojo/_base/declare,dojo/on,dojo/topic,dojo/dom-construct,dojo/_base/lang,dojox/mobile/View".split(","),function(j,d,e,a,l,k){return j("walta.HomeView",[k],{"class":"waltaHomeView waltaFullscreen",buildRendering:function(){this.inherited(arguments);var c=a.create("div",{"class":"waltaPanel waltaHeader"},this.domNode);a.create("div",{"class":"waltaLogo"},c);a.create("h1",{innerHTML:"WALTA"},c);a.create("h3",{innerHTML:"Waterbug ALT App"},c);var b=this.domNode,c=a.create("div",
{"class":"waltaPanel waltaMenu"},b);a.create("div",{"class":"waltaMenuIcon waltaSpeedbugLogo"},c);a.create("h2",{innerHTML:"Speedbug"},c);a.create("p",{innerHTML:"Look at silhouettes of bugs to choose the best match."},c);var f=a.create("div",{"class":"waltaPanel waltaMenu"},b);a.create("div",{"class":"waltaMenuIcon waltaAltKeyLogo"},f);a.create("h2",{innerHTML:"ALT key"},f);a.create("p",{innerHTML:"Questions to help identify your waterbug."},f);var g=a.create("div",{"class":"waltaPanel waltaMenu"},
b);a.create("div",{"class":"waltaMenuIcon waltaBrowseLogo"},g);a.create("h2",{innerHTML:"Browse list"},g);a.create("p",{innerHTML:"If you know the name or scientific name of your bug."},g);var h=a.create("div",{"class":"waltaPanel waltaMenu waltaSecondary"},b);a.create("h2",{innerHTML:"Help"},h);a.create("p",{innerHTML:"Info to get you started."},h);var i=a.create("div",{"class":"waltaPanel waltaMenu waltaSecondary"},b);a.create("h2",{innerHTML:"Gallery"},i);a.create("p",{innerHTML:"Browse photos & videos."},
i);b=a.create("div",{"class":"waltaPanel waltaMenu waltaSecondary"},b);a.create("h2",{innerHTML:"About"},b);a.create("p",{innerHTML:"About the app."},b);d(b,"click",function(){e.publish("about/open")});d(h,"click",function(){e.publish("help/open")});d(g,"click",function(){e.publish("browse/open")});d(f,"click",function(){e.publish("key/start")});d(c,"click",function(){e.publish("speedbug/open")})}})});