//>>built
define("dojo/_base/event",["./kernel","../on","../has","../dom-geometry"],function(d,b,c,e){if(b._fixEvent){var f=b._fixEvent;b._fixEvent=function(a,b){(a=f(a,b))&&e.normalizeEvent(a);return a}}c={fix:function(a,c){return b._fixEvent?b._fixEvent(a,c):a},stop:function(a){a.preventDefault();a.stopPropagation()}};d.fixEvent=c.fix;d.stopEvent=c.stop;return c});