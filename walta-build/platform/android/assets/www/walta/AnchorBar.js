//>>built
define("walta/AnchorBar",["dojo/_base/declare","dojo/on","dojo/dom-construct","dojo/_base/lang","dojox/mobile/Container"],function(b,c,a,d,e){return b("walta.AnchorBar",[e],{title:"","class":"waltaAnchorBar",onHome:null,onSettings:null,onInfo:null,buildRendering:function(){this.inherited(arguments);var b=a.create("div",{"class":"waltaAnchorBarIcon waltaHome"},this.containerNode),e=a.create("div",{"class":"waltaAnchorBarIcon waltaInfo"},this.containerNode),f=a.create("div",{"class":"waltaAnchorBarIcon waltaSettings"},
this.containerNode);a.create("h1",{innerHTML:this.title},this.containerNode);c(b,"click",d.hitch(this,function(){this.onHome()}));c(f,"click",d.hitch(this,function(){this.onSettings()}));c(e,"click",d.hitch(this,function(){this.onInfo()}))}})});