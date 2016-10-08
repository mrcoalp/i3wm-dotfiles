//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2016 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

const cActionEdit 			= 0;
const cActionSave 			= 1;
const cActionClipboard 		= 2;
const cActionEMail 			= 3;
const cActionPaint 			= 4;
const cActionUpload 		= 5;
const cActionPrint 	 		= 7;
//noinspection JSUnusedGlobalSymbols
const cBASE64Content 		= 8;
const cActionSavePDF		= 10;
const cActionSendOneNote	= 11;
const cActionMultiPDF       = 12;
const cActionSilentAdd      = 13;
const cActionUpgrade		= 100;

const cModeVisible 	= 0;
const cModeEntire  	= 1;
const cModeSelected = 2;
const cModeBrowser 	= 3;
const cModeTabs     = 4;

const cLastActionPref 				= "lastAction";
const cLastModePref 				= "lastMode";
const cShortcutPref					= "hotkey";
const cShortcutPrefVisible			= "hotkeyVisible";
const cShortcutPrefSelection		= "hotkeySelection";
const cShortcutPrefEntire			= "hotkeyEntire";
const cShortcutPrefBrowser			= "hotkeyBrowser";
const cShortcutPrefTabs			    = "hotkeyTabs";
const cDebugPref					= "fsDebug";

const cShortcutPrefVisibleAction	= "hotkeyVisibleAction";
const cShortcutPrefSelectionAction	= "hotkeySelectionAction";
const cShortcutPrefEntireAction		= "hotkeyEntireAction";
const cShortcutPrefBrowserAction	= "hotkeyBrowserAction";
const cShortcutPrefTabsAction	    = "hotkeyTabsAction";

const cPluginProModePref			= "pluginProMode";
const cRegisteredPref				= "registeredMode";
const cFirstTimeRun 				= "firstTimeRunFlag";
const cCurrentVersion 				= "curVersion";
const cTemplatePref					= "filenameTemplate";
const cTemplateNumberPref			= "filenameNumber";
const cTemplateNumberPadCheckPref	= "filenameNumberPadCheck";
const cTemplateNumberPadValuePref	= "filenameNumberPadValue";

const cUpdCheckIgnorePeriodPref     = "uCheck";
const cUpdEmitPref                  = "uEmit";
const cUpdInfoURL                   = "https://ssl.getfireshot.com/images/api/utm.gif?dummy=";

/*const cUpdGracePeriod               = 20 * 1000;
const cUpdMaxPeriod                 = 60 * 1000;
const cUpdTimeCheckInterval         = 10 * 1000;
const cUpdCheckDelay                = 10 * 1000;*/


const cUpdGracePeriod               = 15 * 24 * 60 * 60 * 1000;
const cUpdMaxPeriod                 = 3 * 24 * 60 * 60 * 1000;
const cUpdTimeCheckInterval         = 12 * 60 * 60 * 1000;
const cUpdCheckDelay                = 10 * 60 * 1000;

const cTemplateFilenameMaxLen		= "filenameMaxLen";
const cDefaultImageFormatPref		= "png";
const cQueuedBadgeURLPref			= "queuedBadgeURL";
const cShowSelectionHintPref        = "showSelectionHint.1";
const cAdvancedFeaturesAvailPref    = "advancedFeaturesAvailable";
const cAdvancedFeaturesCheckURL     = "https://ssl.getfireshot.com/images/api/chromefeatures.gif?dummy=";

const cDefaultShortcut 			= getOSFriendlyShortcut("Ctrl+Alt+Shift+Z");
const cDefaultShortcutVisible 	= getOSFriendlyShortcut("Ctrl+Alt+Shift+X");
const cDefaultShortcutSelection = getOSFriendlyShortcut("Ctrl+Alt+Shift+C");
const cDefaultShortcutEntire 	= getOSFriendlyShortcut("Ctrl+Alt+Shift+V");
const cDefaultShortcutBrowser 	= getOSFriendlyShortcut("Ctrl+Alt+Shift+B");
const cDefaultShortcutTabs 	    = getOSFriendlyShortcut("Ctrl+Alt+Shift+T");

const cDefaultShortcutVisibleAction		= 0;
const cDefaultShortcutSelectionAction	= 0;
const cDefaultShortcutEntireAction		= 0;
const cDefaultShortcutBrowserAction		= 0;
const cDefaultShortcutTabsAction		= 0;

const cDefaultTemplate			 = "FireShot Capture %n - %t - %u";

var isDebug = localStorage[cDebugPref] === "true";
var extensionId = chrome.i18n.getMessage('@@extension_id');
//isDebug = extensionId == "ljhbgpplnapkahgkchjfeednacjockbi";
logToConsole("Extension ID: " + extensionId);


function isNativeSupported()
{ return fsNativePlugin.ready; }

function getPlugin()
{
	return isNativeSupported() ? fsNativePlugin : getJSPlugin();
}

function pluginCommand(cmd, param1)
{
	try
	{
		var obj = param1 ? param1 : {},
			plugin = getPlugin();
		obj.JSONCommand = cmd;
		
		if (isDebug) {
            if (obj.dataurl) {
                var t       = obj.dataurl;
                obj.dataurl = "<cut>";
                logToConsole("plugin command: " + cmd + " : " + JSON.stringify(obj));
                obj.dataurl = t;
            }
            else logToConsole("plugin command: " + cmd + " : " + JSON.stringify(obj));
        }
		//return getPlugin().launchFunction(cmd, obj);
		return isNativeSupported() ? plugin.launchJSON(obj) : plugin.launchFunction(cmd, obj);
	}
	catch (e) 
	{
		logError(e.message);
		return false;
	}
}

function openURL(url) 
{
	chrome.tabs.create({
		url: url
	});
}

function getOption(optionName, defaultValue)
{
	var val = localStorage[optionName];
	if (val == undefined) return defaultValue;
	else return val;
}

function setOptionFromScript(optionName, optionValue) {
    options[optionName] = optionValue;
    chrome.extension.sendMessage({message: "setOption", optionName: optionName, optionValue: optionValue});
}

function getOptionFromScript(optionName, defaultValue) {
    return options[optionName] || defaultValue;
}

function logToConsole(data)
{
    if (isDebug) {
        var k = new Date();
        console.log(k.getHours() + ":" + k.getMinutes() + ":" + k.getSeconds() + "." + k.getMilliseconds() + "   " + data);
    }
}

function logError(data)
{
	console.error("FireShot: " + data);
}

function getSBHeight(window)
{
    if (window.scrollbars.visible)
	{
		var spacer = window.document.createElement("div");
		spacer.setAttribute("style", "position: fixed; margin: 0px; padding: 0px; border: none; visibility: hidden;  top: 0px; left: 0px; width: 1px; height: 100%; z-index: -1;");
		window.document.body.appendChild(spacer);
		var sbHeight = window.innerHeight - spacer.offsetHeight;
		window.document.body.removeChild(spacer);
		return sbHeight > 0 && sbHeight < 40 ? sbHeight : 0;
	}
	else return 0;
}

function getExtension()
{
	return chrome.extension.getBackgroundPage();
}

function getShortcut(event) 
{
	var modifiers = [], key;		
	if (event.ctrlKey) modifiers.push("control");
	if (event.altKey) modifiers.push("alt");
	if (event.metaKey) modifiers.push("meta");
	if (event.shiftKey) modifiers.push("shift");
	modifiers = modifiers.join("+");
	
	if (modifiers == "" || event.which < 32) return "";

	var val = getOSFriendlyShortcut(modifiers.replace("alt", "Alt").replace("shift", "Shift").replace("control", "Ctrl").replace("meta", "Meta").replace("accel", "Ctrl")) + "+";
	
	if (event.which == 32) 
		key = "Space"; 
	else 
		key = String.fromCharCode(event.which).toUpperCase();
	
	val += key;
	
	return val;
}

function getOSFriendlyShortcut(string)
{
	if (isMac())
		return string.replace("Ctrl", "Control").replace("Meta", "Cmd");
	else 
		return string;
}

function isWindows()
{
	return navigator.appVersion.indexOf("Win") !=-1;
}

function isMac()
{
	return navigator.platform.match(/^mac/i) != null;
}

function isOpera()
{
	return navigator.appVersion.match(/OPR\/\d+\./i) != null;
}

function i18nPrepare()
{
	//noinspection JSCheckFunctionSignatures
    var itr = document.createNodeIterator(document.documentElement, NodeFilter.SHOW_ELEMENT,
	function(node) {
        return (node.getAttribute('data-i18n') === null ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT);
    }, false);
	
	var currentNode;  
	while (currentNode = itr.nextNode()) {
		var data = chrome.i18n.getMessage(currentNode.getAttribute('data-i18n'));
		if (data !== "") 
			currentNode.innerText = data;
		else 
			currentNode.innerText = "#" + currentNode.innerText; //currentNode.innerText;//currentNode.getAttribute('data-i18n');
	}
}


//noinspection JSUnusedLocalSymbols
function gaTrack(urchinCode, domain, url, title) {

  function rand(min, max) {
	  return min + Math.floor(Math.random() * (max - min));
  }

  var i=1000000000,
	  utmn=rand(i,9999999999), //random request number
	  cookie=rand(10000000,99999999), //random cookie number
	  random=rand(i,2147483647), //number under 2147483647
	  today=(new Date()).getTime(),
	  win = window.location,
	  img = new Image();

    title = title || "-";

      img.src = 'https://www.google-analytics.com/__utm.gif?utmwv=1.3&utmn='
		  +utmn+'&utmsr=-&utmsc=-&utmul=-&utmje=0&utmfl=-&utmdt='+title+'&utmhn='
		  +domain+'&utmr='+win+'&utmp='
		  +url+'&utmac='
		  +urchinCode+'&utmcc=__utma%3D'
		  +cookie+'.'+random+'.'+today+'.'+today+'.'
		  +today+'.2%3B%2B__utmb%3D'
		  +cookie+'%3B%2B__utmc%3D'
		  +cookie+'%3B%2B__utmz%3D'
		  +cookie+'.'+today
		  +'.2.2.utmccn%3D(referral)%7Cutmcsr%3D' + win.host + '%7Cutmcct%3D' + win.pathname + '%7Cutmcmd%3Dreferral%3B%2B__utmv%3D'
		  +cookie+'.-%3B';
}

function getFilenameLite()
{
	function padString(str, padString, length) 
	{
		str = str.toString();
		while (str.length < length)
			str = padString + str;
		return str;
	}
	
	var maxLen = getOption(cTemplateFilenameMaxLen, 100),  i = 0;

	do
	{
		var template = getOption(cTemplatePref, cDefaultTemplate),	
			d = new Date(),
			n = getOption(cTemplateNumberPref, 1);
			
		var url = getExtension().tabURL,
			title = getExtension().tabTitle;
			
		/*if (i == 1)
			title = title.substr(0, maxLen - (fullLength - title.length));		
		
		if (i == 2)*/
			//url = url.replace(/(.*)\?.*/gi, "$1");
			
		template = template.replace("%n", getOption(cTemplateNumberPadCheckPref, true) === "true" ? padString(n, 0, getOption(cTemplateNumberPadValuePref, 3)) : n);
		template = template.replace("%y", d.getFullYear());
		template = template.replace("%m", padString(d.getMonth() + 1, 0, 2));
		template = template.replace("%d", padString(d.getDate(), 0, 2));
		
		template = template.replace("%H", padString(d.getHours(), 0, 2));
		template = template.replace("%M", padString(d.getMinutes(), 0, 2));
		template = template.replace("%S", padString(d.getSeconds(), 0, 2));
			
		if (i == 1)
			url = url.substr(0, Math.max(14, maxLen - template.length + 1));
		else if (i == 2)
		{
			url = url.replace(/(.*)\?.*/gi, "$1");
			template = template.replace("%u", url);
			title = title.substr(0, Math.max(14, maxLen - template.length + 1)) + "_";
		}
		else if  (i == 3)
		{
		  url = url.substr(0, (maxLen - template.length) / 2 - 1);
		  template = template.replace("%u", url);
		  title = title.substr(0, (maxLen - template.length) - 1) + "_";
		}
		
		template = template.replace("%u", url);
		template = template.replace("%t", title);
		
		template = template.replace(/[:\/\\\*\?"]/g, "_");
		template = template.replace("<", "{");
		template = template.replace(">", "}");
		template = template.replace("|", "I");
		
	} while (++i < 4 && template.length > maxLen);
	
	//template = template.substr(0, maxLen - 4);
	if (template == "") template = "Untitled";
	
	localStorage[cTemplateNumberPref] = parseInt(n) + 1;
	
	
	
	return template;
}
/*
function tabSupportedForCapturing(tabId)
{
	try
	{
		chrome.tabs.executeScript(tabId, {code:"{}"}, function (res)
		{
			return chrome.runtime.lastError === undefined;
		});
		//logToconsole(chrome.runtime.lastError);
		return true;
	}
	catch (e)
	{
		return false;
	}
}*/

function showBadge(url)
{
	localStorage[cQueuedBadgeURLPref] = url;
	chrome.browserAction.setBadgeText({text: url && url != "undefined" ? "New" : ""});
	if (url)
		logToConsole("Setting badge for url: " + url);
}

function getLastAction() {return parseInt(getOption(cLastActionPref, cActionEdit));}

function getLastMode() {return parseInt(getOption(cLastModePref, cModeEntire));}

function setLastActionAndMode(capAction, capMode) {
    localStorage[cLastActionPref] = capAction;
    localStorage[cLastModePref] = capMode;
}

//noinspection JSUnusedGlobalSymbols
function isProMode() {
    return localStorage[cPluginProModePref] == "true";
}


function getIntersection(x1, y1, w1, h1, x2, y2, w2, h2)
{
    return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
}

function rectsIntersected(a, b) {
    return (a.left < b.left + b.width &&
    b.left < a.left + a.width &&
    a.top < b.top + b.height &&
    b.top < a.top + a.height)
}

function isChildOf(parent, element)
{
    var p = element.parentNode;

    while (p)
    {
        if (p == parent) return true;
        else p = p.parentNode;
    }

    return false;
}


function difference(a, b) {
    var result = [];

    if (!rectsIntersected(a, b)) return [a];

    var top = a.top;
    var height = a.height;

    var ar = a.left + a.width;
    var ab = a.top + a.height;

    var br = b.left + b.width;
    var bb = b.top + b.height;

    // Subtract off any area on top where A extends past B
    if (b.top > a.top) {
        result.push({left:a.left, top:a.top, width:a.width, height:b.top - a.top});
        top = b.top;
        // If we're moving the top down, we also need to subtract the height diff.
        height -= b.top - a.top;
    }
    // Subtract off any area on bottom where A extends past B
    if (bb < ab) {
        result.push({left:a.left, top:bb, width:a.width, height:ab - bb});
        height = bb - top;
    }
    // Subtract any area on left where A extends past B
    if (b.left > a.left) {
        result.push({left:a.left, top:top, width:b.left - a.left, height:height});
    }
    // Subtract any area on right where A extends past B
    if (br < ar) {
        result.push({left:br, top:top, width:ar - br, height:height});
    }

    return result;
}

function isScrollableStyle(style) {
	return style && (style.getPropertyValue("overflow") == "scroll" || style.getPropertyValue("overflow") == "auto" ||
			style.getPropertyValue("overflow-y") == "scroll" || style.getPropertyValue("overflow-y") == "auto" ||
			style.getPropertyValue("overflow-x") == "scroll" || style.getPropertyValue("overflow-x") == "auto")	&&
			style.getPropertyValue("display") != "none" && style.getPropertyValue("visibility") != "hidden";
}


function isOverflowed(style) {
	return style && style.getPropertyValue("display") !== "none" &&
			(style.getPropertyValue("overflow") === "hidden" ||
			style.getPropertyValue("overflow-y") === "hidden" || style.getPropertyValue("overflow-y") === "auto" || style.getPropertyValue("overflow-y") == "scroll" ||
			style.getPropertyValue("overflow-x") === "hidden" || style.getPropertyValue("overflow-x") === "auto" || style.getPropertyValue("overflow-x") == "scroll");
}


function getAdvancedFeaturesAvailable() {
    return getOption(cAdvancedFeaturesAvailPref, "1") == 1;
}

function checkAdvancedFeatures() {
    if (!advFeaturesChecked) {
        advFeaturesChecked = true;
        getFeaturesFromSite();
    }
}

function getFeaturesFromSite() {
    if (!isNativeSupported()) {
        var img    = new Image(), d = new Date(),
            t = Math.round(d.getTime() / (1000 * 60 * 60 * 24));

        img.onload = function () {
            localStorage[cAdvancedFeaturesAvailPref] = "1";
            logToConsole("Advanced features available");
        };

        img.onerror = function () {
            localStorage[cAdvancedFeaturesAvailPref] = "0";
            logToConsole("Advanced features unavailable");
        };
        img.src = cAdvancedFeaturesCheckURL + t;

        logToConsole("Checking " + img.src);

        setTimeout(function () {
            getFeaturesFromSite()
        }, 1000 * 60 * 60 * 24);
    }
}


function checkAdvancedUpdates() {
    if (!isWindows()) return;

    logToConsole("checkAdvancedUpdates");

    function getUInfoFromSite() {
        var img = new Image(), d = new Date(),
            t = Math.round(d.getTime() / (1000 * 60 * 60 * 24));

        img.onload = function () {
            localStorage[cUpdEmitPref] = d.getTime() + Math.round(Math.random() * cUpdMaxPeriod);
            logToConsole("Update info available in " + (parseInt(localStorage[cUpdEmitPref]) - d.getTime()) / 1000  + " seconds");
            setupUTmr();
        };

        img.onerror = function () {
            setTimeout(getUInfoFromSite, cUpdTimeCheckInterval);
        };

        img.src = cUpdInfoURL + t;

        logToConsole("Checking " + img.src);
    }

    function setupUTmr() {
        var t = parseInt(getOption(cUpdEmitPref, "0")),
            d = t - new Date().getTime();

        if (t && d <= 0) {
            localStorage[cUpdCheckIgnorePeriodPref] = "";
            localStorage[cUpdEmitPref] = "";
            logToConsole("Update!");
            showBadge("http://getfireshot.com/updated.php?app=" + (isOpera() ? "op" : "ch") + "&src=ext&ver=" + localStorage[cCurrentVersion]);
            checkAdvancedUpdates();
        }
        else setTimeout(setupUTmr, d + 1000);
    }


    let updCheckTimeStarts = parseInt(getOption(cUpdCheckIgnorePeriodPref, "0")),
        updScheduled = parseInt(getOption(cUpdEmitPref, "0")),
        now = new Date().getTime();

    if (updScheduled) setupUTmr();
    else if (!updCheckTimeStarts) {
        localStorage[cUpdCheckIgnorePeriodPref] = now + cUpdGracePeriod;
        setTimeout(arguments.callee, cUpdGracePeriod + 1000);
    }
    else if (now >= updCheckTimeStarts)
        setTimeout(getUInfoFromSite, Math.random() * cUpdCheckDelay);
    else
        setTimeout(arguments.callee, updCheckTimeStarts - now + 1000);
}


function getJpegExtents(image) {
    var width, height;
    if (image.substring(0, 23) === 'data:image/jpeg;base64,') {
        image = atob(image.replace('data:image/jpeg;base64,', ''));
    }

    if (!image.charCodeAt(0) === 0xff ||
        !image.charCodeAt(1) === 0xd8 ||
        !image.charCodeAt(2) === 0xff ||
        !image.charCodeAt(3) === 0xe0 ||
        !image.charCodeAt(6) === 'J'.charCodeAt(0) ||
        !image.charCodeAt(7) === 'F'.charCodeAt(0) ||
        !image.charCodeAt(8) === 'I'.charCodeAt(0) ||
        !image.charCodeAt(9) === 'F'.charCodeAt(0) ||
        !image.charCodeAt(10) === 0x00) {
        throw new Error('getJpegSize requires a binary jpeg file')
    }

    var blockLength = image.charCodeAt(4)*256 + image.charCodeAt(5);
    var i = 4, len = image.length;
    while ( i < len ) {
        i += blockLength;
        if (image.charCodeAt(i) !== 0xff) {
            throw new Error('getJpegSize could not find the size of the image');
        }
        if (image.charCodeAt(i+1) === 0xc0) {
            height = image.charCodeAt(i+5)*256 + image.charCodeAt(i+6);
            width = image.charCodeAt(i+7)*256 + image.charCodeAt(i+8);
            return [width, height];
        } else {
            i += 2;
            blockLength = image.charCodeAt(i)*256 + image.charCodeAt(i+1)
        }
    }
}

function isConsoleOpened() {
    var element = new Image(), opened = false;
    Object.defineProperty(element, 'id', {
        get: function () {
            opened = true;
        }
    });
    console.log('%cFireShot console check.', element);
    return opened;
}

function closestToInt(value) {
    if (Math.abs(value - Math.floor(value)) < 0.009)
        value = Math.floor(value);

    return value;
}

/*
function waitForLoading(window, tabId, timeout, callback)
{

    function doneWaiting(tab)
    {
        chrome.tabs.executeScript({file: "scripts/fsNotificationOff.js", runAt: "document_start"});
        callback(tab);
    }

    try {
        if (window.tabs[tabId].status === "complete")
            callback(window.tabs[tabId]);
        else {

            chrome.tabs.executeScript({file: "scripts/fsNotificationOn.js", runAt: "document_start"});
            var cycle = new AsyncCycle(
                function (iterator) {
                    setTimeout(function () {
                        chrome.tabs.query({windowId: window.id}, function (tabs) {
                            try {
                                if (tabs && tabs[tabId]) {
                                    iterator.next(tabs[tabId]);
                                }
                                else doneWaiting();
                            }
                            catch (e) {
                                logError(e.message);
                                doneWaiting();
                            }
                        });
                    }, 1000);
                },

                function (tab) {
                    try {
                        if (tab.status === "complete" || --timeout <= 0) {
                            doneWaiting(tab);
                            return true;
                        }
                        return false;
                    }
                    catch (e) {
                        logError(e.message);
                        doneWaiting();
                        return true;
                    }
                }
            );

            cycle.next(window.tabs[tabId]);
        }
    }
    catch (e) {
        logError(e.message);
        callback();
    }
}

*/


