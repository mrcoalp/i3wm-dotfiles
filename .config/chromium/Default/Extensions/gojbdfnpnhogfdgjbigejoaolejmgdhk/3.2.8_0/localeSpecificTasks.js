!function e(t,r,i){function n(o,s){if(!r[o]){if(!t[o]){var l="function"==typeof require&&require;if(!s&&l)return l(o,!0);if(a)return a(o,!0);var c=new Error("Cannot find module '"+o+"'");throw c.code="MODULE_NOT_FOUND",c}var u=r[o]={exports:{}};t[o][0].call(u.exports,function(e){var r=t[o][1][e];return n(r?r:e)},u,u.exports,e,t,r,i)}return r[o].exports}for(var a="function"==typeof require&&require,o=0;o<i.length;o++)n(i[o]);return n}({1:[function(e,t,r){"use strict";var i=e("../localization/rtl"),n=e("../storage/clipperStorageKeys"),a=function(){function e(){}return e.execute=function(e){this.appendDirectionalCssToHead(e)},e.appendDirectionalCssToHead=function(e){for(var t=i.Rtl.isRtl(e)?"-rtl.css":".css",r=["clipper","sectionPicker"],n=0;n<r.length;n++){var a=r[n]+t,o=document.createElement("link");o.setAttribute("rel","stylesheet"),o.setAttribute("type","text/css"),o.setAttribute("href",a),document.getElementsByTagName("head")[0].appendChild(o)}},e}();r.LocaleSpecificTasks=a;var o;try{o=window.localStorage.getItem(n.ClipperStorageKeys.displayLanguageOverride)}catch(e){}a.execute(o||navigator.language||navigator.userLanguage)},{"../localization/rtl":2,"../storage/clipperStorageKeys":3}],2:[function(e,t,r){"use strict";var i;!function(e){function t(e){if(!e)return!1;for(var t=r(e),n=0;n<i.length;n++)if(t===i[n])return!0;return!1}function r(e){return e?e.split("-")[0].split("_")[0].toLowerCase():""}var i=["ar","fa","he","sd","ug","ur"];e.isRtl=t,e.getIso639P1LocaleCode=r}(i=r.Rtl||(r.Rtl={}))},{}],3:[function(e,t,r){"use strict";var i;!function(e){e.clipperId="clipperId",e.cachedNotebooks="notebooks",e.currentSelectedSection="curSection",e.displayLanguageOverride="displayLocaleOverride",e.doNotPromptRatings="doNotPromptRatings",e.flightingInfo="flightingInfo",e.lastBadRatingDate="lastBadRatingDate",e.lastBadRatingVersion="lastBadRatingVersion",e.lastClippedDate="lastClippedDate",e.lastSeenVersion="lastSeenVersion",e.lastInvokedDate="lastInvokedDate",e.lastSeenTooltipTimeBase="lastSeenTooltipTime",e.lastClippedTooltipTimeBase="lastClippedTooltipTime",e.locale="locale",e.locStrings="locStrings",e.numSuccessfulClips="numSuccessfulClips",e.numTimesTooltipHasBeenSeenBase="numTimesTooltipHasBeenSeen",e.userInformation="userInformation"}(i=r.ClipperStorageKeys||(r.ClipperStorageKeys={}))},{}]},{},[1]);