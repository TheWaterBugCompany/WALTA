//>>built
define("dojo/has",["require","module"],function(g){var b=g.has||function(){};b.add("device-width",screen.availWidth||innerWidth);document.createElement("form");b.clearElement=function(a){a.innerHTML="";return a};b.normalize=function(a,c){var e=a.match(/[\?:]|[^:\?]*/g),f=0,d=function(a){var c=e[f++];if(":"==c)return 0;if("?"==e[f++]){if(!a&&b(c))return d();d(!0);return d(a)}return c||0};return(a=d())&&c(a)};b.load=function(a,c,b){a?c([a],b):b()};return b});