//>>built
define("dojox/lang/aspect/memoizer",["dijit","dojo","dojox"],function(j,d,h){d.provide("dojox.lang.aspect.memoizer");(function(){var g=h.lang.aspect,d={around:function(e){var c=g.getContext(),f=c.joinPoint,b=c.instance,a;if((a=b.__memoizerCache)&&(a=a[f.targetName])&&e in a)return a[e];c=g.proceed.apply(null,arguments);if(!(a=b.__memoizerCache))a=b.__memoizerCache={};if(!(b=a[f.targetName]))b=a[f.targetName]={};return b[e]=c}},i=function(e){return{around:function(){var c=g.getContext(),f=c.joinPoint,
b=c.instance,a,d=e.apply(b,arguments);if((a=b.__memoizerCache)&&(a=a[f.targetName])&&d in a)return a[d];c=g.proceed.apply(null,arguments);if(!(a=b.__memoizerCache))a=b.__memoizerCache={};if(!(b=a[f.targetName]))b=a[f.targetName]={};return b[d]=c}}};g.memoizer=function(e){return 0==arguments.length?d:i(e)}})()});