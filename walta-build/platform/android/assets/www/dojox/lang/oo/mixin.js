//>>built
define("dojox/lang/oo/mixin",["dijit","dojo","dojox","dojo/require!dojox/lang/oo/Filter,dojox/lang/oo/Decorator"],function(u,e,p){e.provide("dojox.lang.oo.mixin");e.experimental("dojox.lang.oo.mixin");e.require("dojox.lang.oo.Filter");e.require("dojox.lang.oo.Decorator");(function(){var i=p.lang.oo,q=i.Filter,m=i.Decorator,f={},r=function(b){return b},s=function(b,a){return a},t=function(b,a,d){b[a]=d},n=e._extraNames,o=n.length,l=i.applyDecorator=function(b,a,d,k){if(d instanceof m){var f=d.decorator,
d=l(b,a,d.value,k);return f(a,d,k)}return b(a,d,k)};i.__mixin=function(b,a,d,k,i){var h,g,c,j,e;for(h in a)if(c=a[h],!(h in f)||f[h]!==c)if((g=k(h,b,a,c))&&(!(g in b)||!(g in f)||f[g]!==c))j=b[g],c=l(d,g,c,j),j!==c&&i(b,g,c,j);if(o)for(e=0;e<o;++e)if(h=n[e],c=a[h],!(h in f)||f[h]!==c)if((g=k(h,b,a,c))&&(!(g in b)||!(g in f)||f[g]!==c))j=b[g],c=l(d,g,c,j),j!==c&&i(b,g,c,j);return b};i.mixin=function(b,a){for(var d,e,f=1,h=arguments.length;f<h;++f)a=arguments[f],a instanceof q?(e=a.filter,a=a.bag):
e=r,a instanceof m?(d=a.decorator,a=a.value):d=s,i.__mixin(b,a,d,e,t);return b}})()});