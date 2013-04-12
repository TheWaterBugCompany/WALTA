//>>built
define("dojox/html/styles",["dojo/_base/lang","dojo/_base/array","dojo/_base/window","dojo/_base/sniff"],function(l,i,g){var b=l.getObject("dojox.html",!0),f={},e={},j=[];b.insertCssRule=function(a,d,c){var c=b.getDynamicStyleSheet(c),k=a+" {"+d+"}";console.log("insertRule:",k);c.sheet?c.sheet.insertRule(k,c._indicies.length):c.appendChild(g.doc.createTextNode(k));c._indicies.push(a+" "+d);return a};b.removeCssRule=function(a,d,c){var b,e=-1,g,h;for(g in f)if(!(c&&c!==g)){b=f[g];for(h=0;h<b._indicies.length;h++)if(a+
" "+d===b._indicies[h]){e=h;break}if(-1<e)break}if(!b)return console.warn("No dynamic style sheet has been created from which to remove a rule."),!1;if(-1===e)return console.warn("The css rule was not found and could not be removed."),!1;b._indicies.splice(e,1);b.sheet&&b.sheet.deleteRule(e);return!0};b.modifyCssRule=function(){};b.getStyleSheet=function(a){if(f[a||"default"])return f[a||"default"];if(!a)return!1;var d=b.getStyleSheets();if(d[a])return b.getStyleSheets()[a];for(var c in d)if(d[c].href&&
-1<d[c].href.indexOf(a))return d[c];return!1};b.getDynamicStyleSheet=function(a){a||(a="default");if(!f[a])g.doc.createStyleSheet?f[a]=g.doc.createStyleSheet():(f[a]=g.doc.createElement("style"),f[a].setAttribute("type","text/css"),g.doc.getElementsByTagName("head")[0].appendChild(f[a]),console.log(a," ss created: ",f[a].sheet)),f[a]._indicies=[];return f[a]};b.enableStyleSheet=function(a){if(a=b.getStyleSheet(a))a.sheet?a.sheet.disabled=!1:a.disabled=!1};b.disableStyleSheet=function(a){if(a=b.getStyleSheet(a))a.sheet?
a.sheet.disabled=!0:a.disabled=!0};b.activeStyleSheet=function(a){var d=b.getToggledStyleSheets(),c;if(1===arguments.length)i.forEach(d,function(b){b.disabled=b.title===a?!1:!0});else for(c=0;c<d.length;c++)if(!1===d[c].disabled)return d[c];return!0};b.getPreferredStyleSheet=function(){};b.getToggledStyleSheets=function(){var a;if(!j.length){var d=b.getStyleSheets();for(a in d)d[a].title&&j.push(d[a])}return j};b.getStyleSheets=function(){if(e.collected)return e;i.forEach(g.doc.styleSheets,function(a){var b=
a.sheet?a.sheet:a,a=b.title||b.href;e[a]=b;e[a].id=b.ownerNode.id;i.forEach(b.cssRules,function(a){if(a.href)e[a.href]=a.styleSheet,e[a.href].id=b.ownerNode.id})});e.collected=!0;return e};return b});