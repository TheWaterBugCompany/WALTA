//>>built
define("dijit/Viewport","dojo/Evented,dojo/on,dojo/ready,dojo/sniff,dojo/_base/window,dojo/window".split(","),function(e,f,g,i,h,d){var a=new e;g(200,function(){var b=d.getBox();a._rlh=f(h.global,"resize",function(){var c=d.getBox();b.h==c.h&&b.w==c.w||(b=c,a.emit("resize"))})});return a});