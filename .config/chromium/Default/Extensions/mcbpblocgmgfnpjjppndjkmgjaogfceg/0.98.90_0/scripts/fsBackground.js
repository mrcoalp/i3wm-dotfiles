//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2016 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

var currentTab, imgData = [];
var extVersion = "0.0";
var updateURL = "";
var capAction, capMode, capCallbackCompleted;
var executeScriptTO;
var capId = 0, processedId = 0;
var guiItemsLocked = false;
var resumeMenuEnabled = false;
var shortcutProcessing = false;
var ignoreShortcuts = false;
var commPortName = "FireShot Comm Port #" + Math.ceil(Math.random() * 45309714203);
var capResult, capResultDataURL, capResultFileNameLite, multiPDFMode;
var advFeaturesChecked = false;
var tabURL, tabTitle;


function enableHotkey(fEnable)
{
	if (fEnable) 
		setTimeout(function() {
			shortcutProcessing = false;
		}, 500);
	else
		shortcutProcessing = true;
}

function getVersionInfo() 
{
	var request = new XMLHttpRequest();
	request.open("GET", chrome.extension.getURL("manifest.json"), true);
	request.onreadystatechange = function() 
	{
		if (this.readyState == XMLHttpRequest.DONE) 
		{
			extVersion = JSON.parse(this.responseText).version;
			//noinspection JSUnresolvedVariable
			updateURL = JSON.parse(this.responseText).update_url;

			if (isWindows())
				fsNativePlugin.init(function() {
					logToConsole("Callback from fsNative");
					displayAnnouncements();
					switchToProIfRequired();
                    updateContextMenu();
				}.bind(this));
			else 
				displayAnnouncements();
		}
	};
	request.send();
}

function displayAnnouncements()
{
	var show = getOption(cFirstTimeRun, "true") == "true";
	
	if (show)
	{
		localStorage[cFirstTimeRun] = false;
		localStorage[cCurrentVersion] = extVersion;
		
		//if (!isDebug) 
		//showBadge(getInstalledPageURL());
		openURL(getInstalledPageURL());
	}
	else 
	{
		var prevVer = getOption(cCurrentVersion, "0.0");
		
		if (extVersion != prevVer)
		{
			if (!isNativeSupported()) 
			{
				showBadge("http://getfireshot.com/updated-lite.php?app=" + (isOpera() ? "op" : "ch") + "&ver=" + extVersion);
			}
				//extensionUpdated(true);
			//localStorage[cCurrentVersion] = extVersion;
		}
	}
}

function getInstalledPageURL()
{
	var addonString = "&app=" + (isOpera() ? "op" : "ch");
	
	if (isNativeSupported()) return "http://getfireshot.com/installed.php?ver=" + extVersion + addonString + "&native=1";
	else return "http://getfireshot.com/installed-lite.php?ver=" + extVersion + addonString;
}

//noinspection JSUnusedLocalSymbols
function nativeHostUpdated(newVersion)
{
	logToConsole("Native module has updated to the " + newVersion + " version.");
	
	gaTrack('UA-1025658-9', 'fireshot.com', "NativeHostUpdated"); 
	
	if (newVersion == extVersion)
	{
		showBadge("http://getfireshot.com/updated.php?app=" + (isOpera() ? "op" : "ch") + "&ver=" + newVersion);
	}
}

function switchToProIfRequired()
{
	/*var pro = getOption(cPluginProModePref, "false") == "true";
	if (!pro && updateURL == "http://screenshot-program.com/fireshot/chrome.xml")
		doUpgrade();*/
}

//noinspection JSUnusedLocalSymbols
function pluginEvent(obj)
{
	var topic = obj.topic,
		data = obj.data + "";
		
	if (topic == "status")
	{
		if (obj.code == statusHostReady)
			pluginCommand("setAddonVersion", {version:extVersion, browser: isOpera() ? "Opera" : "Chromium"});
		else
		{
			gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-" + obj.data); 
			alert("FireShot failed to update. The updater reported the following error: \r\n-----------------------------------------------\r\n" + obj.data + "\r\n-----------------------------------------------\r\n\r\nFireShot will have to work in Lite mode.");
			logToConsole("Error from native module: " + obj.data);
		}
	}
	else if (topic == "openURL")
    {
		openURL(data);
	}
	else if (topic == "enableResumeMenu")
	{
		logToConsole("enableResumeMenu " + data);
		resumeMenuEnabled = data == "enable";
		
		setTimeout(function () {updateContextMenu();}, 10);
	}
	else if (topic == "setupMode")
	{
		localStorage[cPluginProModePref] = data != "false";
		
		updateContextMenu();
	}
	else if (topic == "setRegistered")
	{
		localStorage[cRegisteredPref] = data != "false";
		updateContextMenu();
	}
	else if (topic == "getInfo")
	{
		var request = new XMLHttpRequest();
		request.open("GET", data, true);
		request.onreadystatechange = function() 
		{
			if (this.readyState == XMLHttpRequest.DONE) 
			{
				pluginCommand("processInfo", {data:this.responseText});
			}
		};
		request.send();
	} 
	else if (topic == "saveCrashData")
	{
		var addr = "", v = data.split(" ");
        if (v.length >= 3) addr = v[2];
        gaTrack('UA-1025658-9', 'fireshot.com', "AV-" + encodeURIComponent(data), encodeURIComponent(addr));
	}
}

function lockItems()
{
	guiItemsLocked = true;
	chrome.contextMenus.removeAll();
	
	chrome.browserAction.setTitle({title: "FireShot Editor is currently displayed.\r\nPlease close it to take the next capture.\r\n\r\n(switching to FireShot Pro also helps!)"});
	chrome.browserAction.setPopup({popup: ""});
}

function unlockItems()
{
	guiItemsLocked = false;
	
	setTimeout(function () {updateContextMenu();}, 10);
	
	chrome.browserAction.setTitle({title: "Capture page"});
	chrome.browserAction.setPopup({popup: "fsPopup.html"});
}

function checkTabReadyForCapturing(tabId, timeout, callback) {
    var timeoutId = setTimeout(function() {
        if (timeoutId) {
            timeoutId = undefined;
            callback(false);
        }
    }, timeout);

    chrome.tabs.executeScript(tabId, {code:"{}", runAt: "document_start"}, function () {
        var success = chrome.runtime.lastError === undefined;
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
            callback(success);
        }
    });
}

function initMessaging() {
    try {
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {

                //noinspection JSUnresolvedVariable
                switch (request.message) {
                    case "getPortName":
                        sendResponse({portName: commPortName});
                        break;
                    case "loadScript":
                        logToConsole("execScript event");
                        if (executeScriptTO !== undefined) {
                            clearTimeout(executeScriptTO);
                            executeScriptTO = undefined;
                        }

                        chrome.tabs.executeScript(currentTab.id, {file: "scripts/fsUtils.js", runAt: "document_start"},
                            function () {
                                chrome.tabs.executeScript(currentTab.id, {
                                        file: "scripts/fsSelection.js",
                                        runAt: "document_start"
                                    },
                                    function () {
                                        chrome.tabs.executeScript(currentTab.id, {
                                                file: "scripts/fsLinks.js",
                                                runAt: "document_start"
                                            },
                                            function () {
                                                chrome.tabs.executeScript(currentTab.id, {
                                                        file: "scripts/fsContent.js",
                                                        runAt: "document_start"
                                                    },
                                                    function () {
                                                        setTimeout(function() {doCapturing(capAction, capMode, capCallbackCompleted)}, 200);
                                                    });
                                            });
                                    });
                            });
                        break;

                    case "execScript":
                        logToConsole("execScript event");
                        if (executeScriptTO !== undefined) {
                            clearTimeout(executeScriptTO);
                            executeScriptTO = undefined;
                        }

                        setTimeout(function () {
                            doCapturing(capAction, capMode, capCallbackCompleted);
                        }, 100);
                        break;

                    case "checkHotkey":
                    function checkKey(prefName, defaultShortcut, callback) {
                        var prefShortcut = getOption(prefName, defaultShortcut);
                        if (prefShortcut == request.data && !shortcutProcessing && !ignoreShortcuts) {
                            ignoreShortcuts = true;
                            callback();
                            setTimeout(function () {
                                ignoreShortcuts = false;
                            }, 1000);
                            return true;
                        }
                        return false;
                    }

                    function getShortcutAction(prefName, defaultValue) {
                        if (!isNativeSupported()) return cActionEdit;
                        switch (parseInt(getOption(prefName, defaultValue))) {
                            case 1:
                                return cActionSave;
                            case 2:
                                return cActionSavePDF;
                            case 3:
                                return cActionSendOneNote;
                            case 4:
                                return cActionUpload;
                            case 5:
                                return cActionPrint;
                            case 6:
                                return cActionClipboard;
                            case 7:
                                return cActionEMail;
                            case 8:
                                return cActionPaint;
                            case 9:
                                return cActionMultiPDF;
                            default:
                                return cActionEdit;
                        }
                    }


                        checkKey(cShortcutPref, cDefaultShortcut, function () {
                            captureLastUsedMode();
                        }) ||
                        checkKey(cShortcutPrefVisible, cDefaultShortcutVisible, function () {
                            executeGrabber(getShortcutAction(cShortcutPrefVisibleAction, cDefaultShortcutVisibleAction), cModeVisible);
                        }) ||
                        checkKey(cShortcutPrefEntire, cDefaultShortcutEntire, function () {
                            executeGrabber(getShortcutAction(cShortcutPrefEntireAction, cDefaultShortcutEntireAction), cModeEntire);
                        }) ||
                        checkKey(cShortcutPrefSelection, cDefaultShortcutSelection, function () {
                            executeGrabber(getShortcutAction(cShortcutPrefSelectionAction, cDefaultShortcutSelectionAction), cModeSelected);
                        }) ||
                        (isNativeSupported() && checkKey(cShortcutPrefBrowser, cDefaultShortcutBrowser, function () {
                            executeGrabber(getShortcutAction(cShortcutPrefBrowserAction, cDefaultShortcutBrowserAction), cModeBrowser);
                        })) ||
                        (isNativeSupported() && checkKey(cShortcutPrefTabs, cDefaultShortcutTabs, function () {
                            executeGrabber(getShortcutAction(cShortcutPrefTabsAction, cDefaultShortcutTabsAction), cModeTabs);
                        }));

                        break;

                    case "checkFSAvailabilityEvt":
                    {
                        sendResponse({FSAvailable: true, FSNative: isNativeSupported(), FSUpgraded: localStorage[cPluginProModePref] === "true"});
                        break;
                    }

                    case "capturePageEvt":
                    {
                        //noinspection JSUnresolvedVariable
                        var action = parseInt(request.Action);
                        if (action == cActionUpgrade)
                            if (isNativeSupported())
                                doUpgrade();
                            else
                                openURL("http://getfireshot.com/buy.php?SRC=ce-lite");

                        else
                        //noinspection JSUnresolvedVariable
                            executeGrabber(action, request.Entire == "true" ? cModeEntire : cModeVisible);
                        break;
                    }

                    case "switchToNativeEvt":
                    {
                        installNative();
                        break;
                    }

                    case "setOption":
                    {
                        localStorage[request.optionName] = request.optionValue;
                        break;
                    }

                }
            });
    } catch (e) {
    }
}

//noinspection JSUnusedLocalSymbols
function checkBadgeAction()
{
	if (localStorage[cQueuedBadgeURLPref] && localStorage[cQueuedBadgeURLPref] != "undefined")
	{
		openURL(localStorage[cQueuedBadgeURLPref]);
		showBadge(undefined);
		localStorage[cFirstTimeRun] = false;
		localStorage[cCurrentVersion] = extVersion;
		return true;
	}
	return false;
}

//noinspection JSUnusedLocalSymbols
function getMenuSettings(callback)
{
    function runCallback(capturingNotSupported) {
        var unsupported = capturingNotSupported || chrome.runtime.lastError !== undefined,
            fPro = localStorage[cPluginProModePref] == "true",
            fRegistered = localStorage[cRegisteredPref] == "true",
            fLite = !isNativeSupported(),
            lastMode = getLastMode();

        callback({
            "mnuQuickLaunch"		: unsupported && (lastMode == cModeEntire || lastMode == cModeSelected || lastMode == cModeVisible) ? "disabled" : "enabled",

            "mnuCaptureVisible"		: unsupported ? "disabled" : "visible",
            "mnuCaptureEntire"		: unsupported ? "disabled" : "visible",
            "mnuCaptureSelection"	: unsupported ? "disabled" : "visible",

            "mnuCaptureVisibleLite"		: unsupported ? "disabled" : "visible",
            "mnuCaptureEntireLite"		: unsupported ? "disabled" : "visible",
            "mnuCaptureSelectionLite"	: unsupported ? "disabled" : "visible",
            "mnuPreferencesLite"		: fLite ? "visible" : "hidden",

            "mnuViewDemo"			: fLite ? "hidden" : "visible",
            "mnuSupport"			: fLite ? "hidden" : "visible",
            //"mnuAPI"				: fLite ? "hidden" : "visible",
            "mnuAbout"				: fLite ? "hidden" : "visible",
            "sepEditor"				: fLite ? "hidden" : "visible",
            "sepSupport"			: fLite ? "hidden" : "visible",
            "sepAdvanced"			: !isWindows() ? "hidden" : "visible",
            //"sepOptions"			: fLite ? "hidden" : "visible",
            "mnuMiscellaneousFolder": fLite ? "hidden" : "visible",
            "mnuResume"				: fLite ? "hidden" : resumeMenuEnabled ? "enabled" : "disabled",
            "mnuUpgrade"			: fLite ? "hidden" :  fPro ? "hidden" : "visible",
            "mnuRegister"			: fLite ? "hidden" :  fPro && !fRegistered ? "visible" : "hidden",
            "mnuEnterLicense"		: fLite ? "hidden" :  fPro && !fRegistered ? "visible" : "hidden",
            "mnuOpenFile"			: fLite ? "hidden" :  fPro ? "enabled" : "disabled",
            "mnuOpenClipboard"		: fLite ? "hidden" :  fPro ? "enabled" : "disabled",
            "mnuLicenseInfo"		: fLite ? "hidden" :  fPro && fRegistered ? "visible" : "hidden",
            "divCaptureToolsLite"	: fLite ? "visible" : "hidden",
            "divCaptureTools"		: fLite ? "hidden" : "visible",
            "mnuFireShotNative"		: isWindows() && fLite ? "visible" : "hidden"

            //"mnuTabsUpgrade"        : fPro ? "hidden" : "visible"
        });
    }

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        if (tabs.length === 0 || !tabs[0].url) {runCallback(true); return;}
        var tab = tabs[0];

        if (/^(http|https|ftp|ftps|file):\/\/.*/.test(tab.url) && !/^https?:\/\/chrome.google.com\/.*$/.test(tab.url))
            runCallback(false);

        else checkTabReadyForCapturing(tab.id, 1000, function(success){
            runCallback(!success);
        });
    });

}

function capturePage(Action, Mode, CallbackCompleted, tab)
{
	capAction = Action;
	capMode = Mode;
    capCallbackCompleted = CallbackCompleted;

    if (executeScriptTO !== undefined) {
        clearTimeout(executeScriptTO);
        executeScriptTO = undefined;
    }

	capId ++;

	//noinspection JSUnusedLocalSymbols
    currentTab = tab;

    logToConsole("capturePage: checking capabilities at " + tab.url + ". Tab state is: " + tab.status);

    checkTabReadyForCapturing(tab.id, Mode === cModeBrowser ? 10 : 5000, function(success) {
        logToConsole("capturePage: done, result = " + success);

        // Окно захватываем напрямую в случае, если инжект скриптов невозможен, либо нам уже известны заголовок и url страницы
        if (Mode == cModeBrowser && (!success || (tab.url !== undefined && tab.title !== undefined)))
            setTimeout(
                function()
                {
                    logToConsole("Calling captureBrowser directly...");
                    enableHotkey(false);
                    lockItems();
                    pluginCommand("captureBrowser", {action:Action + ":-", url:tab.url, title:tab.title});
                    unlockItems();
                    enableHotkey(true);
                    if (capCallbackCompleted)
                        capCallbackCompleted();
                },
                100
            );

        else
        {
            if (success) {
                executeScriptTO = setTimeout(
                    function() {
                        logToConsole("Calling doCapturing on timeout");
                        doCapturing(capAction, capMode, capCallbackCompleted);
                    },
                    1000
                );

                chrome.tabs.executeScript(tab.id, {file: "scripts/fsScriptChecker.js", runAt: "document_start"}, function() {
                    if (chrome.runtime.lastError) {
                        clearTimeout(executeScriptTO);
                        executeScriptTO = undefined;
                        logToConsole("Calling doCapturing on lastError");
                        doCapturing(capAction, capMode, capCallbackCompleted);
                    }
                });
            }
            else if (capCallbackCompleted) capCallbackCompleted();
        }
    });
}

function getActionLocaleId(action)
{
	switch (action)
	{
		case cActionSave		: return "action_save"; 
		case cActionSavePDF		: return "action_save_pdf"; 
		case cActionClipboard	: return "action_copy";
		case cActionEMail		: return "action_email";
		case cActionPaint		: return "action_external";
		case cActionSendOneNote	: return "action_onenote";
		case cActionUpload		: return "action_upload";
		case cActionPrint		: return "action_print";
        case cActionMultiPDF    : return "action_save_pdf_single";
		default					: return "action_edit"; 
	}
}

function getLADescription()
{
	var action1, action2 = getActionLocaleId(getLastAction());
	var fLite = !isNativeSupported();
	switch (getLastMode())
	{
		case cModeVisible	: action1 = fLite ? "action_capture_visible_lite" : "action_capture_visible"; break;
		case cModeSelected	: action1 = fLite ? "action_capture_selection_lite" : "action_capture_selection"; break;
		case cModeBrowser	: action1 = "action_capture_browser"; break;
        case cModeTabs      : action1 = "action_capture_tabs"; break;
		default				: action1 = fLite ? "action_capture_entire_lite" : "action_capture_entire"; 
	}
	
	if (fLite)
		return chrome.i18n.getMessage(action1);
	else
		return chrome.i18n.getMessage(action1) + " " + chrome.i18n.getMessage(action2);
}

function doCapturing(Action, Mode, CallbackCompleted)
{
    function getEmulationWidth(resultCB) {
        chrome.tabs.captureVisibleTab(currentTab.windowId, {format: "jpeg"},
            function (data) {
                var width = -1, height = -1;
                if (!chrome.runtime.lastError) {
                    try {
                        var extents = getJpegExtents(data);
                        width = extents[0];
                        height = extents[1];
                        logToConsole("Emulation extents: " + extents[0] + " x " + extents[1]);
                    }
                    catch (e) {
                        logToConsole(e.toString());
                    }
                }

                resultCB(width, height);
            });
    }

    logToConsole("doCapturing");
    if (capId <= processedId++)
	{
		capId = processedId;
        //if (CallbackCompleted)
        //    throw "Unexpected error while capturing using callback";

		return;
	}

    try {
        var
            isEmulation = false,
            port = chrome.tabs.connect(currentTab.id, {name: commPortName}), connecting = true;

        port.postMessage({topic: "init", mode: Mode, debug: isDebug, options: localStorage, p: localStorage[cPluginProModePref] == "true", native: isNativeSupported()});
        port.onMessage.addListener(function (msg) {

            logToConsole(JSON.stringify(msg));

            switch (msg.topic) {

                case "initAborted":
                    logToConsole("init Aborted");
                    if (CallbackCompleted) CallbackCompleted(); return;
                break;

                case "initDone":

                    tabURL = msg.url;
                    tabTitle = msg.title;
                    connecting = false;
                    enableHotkey(false);

                    switch (Mode) {
                        case cModeVisible    :
                        case cModeEntire    :
                            /*if (!msg.emulation) {
                                pluginCommand("captureInit");
                                port.postMessage({topic: "scrollNext"});
                            }
                            else
                            */
                            getEmulationWidth(function(width, height) {

                                let ratioW = closestToInt(width / msg.cw);
                                let ratioH = closestToInt(height / msg.ch);
                                isEmulation = true;
                                pluginCommand("captureInit");
                                port.postMessage({topic: "setRatio", ratioW: ratioW, ratioH: ratioH});
                                port.postMessage({topic: "scrollNext"});
                            });
                            break;
                        case cModeSelected    :
                            getEmulationWidth(function(width, height) {
                                let ratioW = closestToInt(width / msg.cw);
                                let ratioH = closestToInt(height / msg.ch);
                                isEmulation = true;
                                pluginCommand("captureInit");
                                port.postMessage({topic: "setRatio", ratioW: ratioW, ratioH: ratioH});
                                port.postMessage({topic: "selectArea"});
                            });
                            break;
                        case cModeBrowser    :
                            enableHotkey(false);
                            lockItems();
                            pluginCommand("captureBrowser", {
                                action: Action + ":-",
                                url: tabURL,
                                title: tabTitle
                            });
                            unlockItems();
                            enableHotkey(true);
                            break;
                    }
                    break;

                case "areaSelected":
                    port.postMessage({topic: "scrollNext"});
                    break;

                case "areaSelectionCanceled":
                    enableHotkey(true);
                    port.onMessage.removeListener(arguments.callee);
                    break;

                case "scrollDone":
                    chrome.tabs.captureVisibleTab(currentTab.windowId, {format: "png"},
                        function (data) {
                            if (!chrome.runtime.lastError)
                                pluginCommand("captureTabPNG", {
                                    dataurl: data,
                                    datasize: data.length,
                                    x: msg.x,
                                    y: msg.y
                                });
                            port.postMessage({topic: "scrollNext"});
                        });
                    break;

                case "scrollFinished":
                    logToConsole("FINISHED (" + msg.rows + " x " + msg.cols + ")");

                    msg.url = tabURL;
                    msg.title = tabTitle;

                    msg.key = "-";
                    msg.action = Action;
                    msg.browserVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);

                    lockItems();
                    pluginCommand("captureDone", msg);
                    enableHotkey(true);
                    unlockItems();

                    port.onMessage.removeListener(arguments.callee);
                    if (CallbackCompleted) CallbackCompleted(true);
                    break;
            }


        });
        //noinspection JSUnresolvedVariable
        port.onDisconnect.addListener(function() {
           if (connecting) {
               if (CallbackCompleted)
                   CallbackCompleted(false);
           }
        });
    } catch (e) {
        if (CallbackCompleted)
            CallbackCompleted(false);
    }
}

//noinspection JSUnusedLocalSymbols
function genericOnClick(info, tab)
{
	switch (info.menuItemId)
	{
        case mnuTest                : doTest(); break;
        case mnuVisibleEdit			: executeGrabber(cActionEdit, cModeVisible); break;
        case mnuVisibleSave			: executeGrabber(cActionSave, cModeVisible); break;
		case mnuVisibleSavePDF		: executeGrabber(cActionSavePDF, cModeVisible); break;
		case mnuVisibleSendOneNote	: executeGrabber(cActionSendOneNote, cModeVisible); break;
		case mnuVisibleUpload		: executeGrabber(cActionUpload, cModeVisible); break;
		case mnuVisiblePrint		: executeGrabber(cActionPrint, cModeVisible); break;
		case mnuVisibleCopy			: executeGrabber(cActionClipboard, cModeVisible); break;
		case mnuVisibleEMail		: executeGrabber(cActionEMail, cModeVisible); break;
		case mnuVisibleExtEditor	: executeGrabber(cActionPaint, cModeVisible); break;
		
		case mnuEntireEdit			: executeGrabber(cActionEdit, cModeEntire); break;
        case mnuEntireSave			: executeGrabber(cActionSave, cModeEntire); break;
		case mnuEntireSavePDF		: executeGrabber(cActionSavePDF, cModeEntire); break;
		case mnuEntireSendOneNote	: executeGrabber(cActionSendOneNote, cModeEntire); break;
		case mnuEntireUpload		: executeGrabber(cActionUpload, cModeEntire); break;
		case mnuEntirePrint			: executeGrabber(cActionPrint, cModeEntire); break;
		case mnuEntireCopy			: executeGrabber(cActionClipboard, cModeEntire); break;
		case mnuEntireEMail			: executeGrabber(cActionEMail, cModeEntire); break;
		case mnuEntireExtEditor		: executeGrabber(cActionPaint, cModeEntire); break;

		case mnuSelectedEdit		: executeGrabber(cActionEdit, cModeSelected); break;
        case mnuSelectedSave		: executeGrabber(cActionSave, cModeSelected); break;
		case mnuSelectedSavePDF		: executeGrabber(cActionSavePDF, cModeSelected); break;
		case mnuSelectedSendOneNote	: executeGrabber(cActionSendOneNote, cModeSelected); break;
		case mnuSelectedUpload		: executeGrabber(cActionUpload, cModeSelected); break;
		case mnuSelectedPrint		: executeGrabber(cActionPrint, cModeSelected); break;
		case mnuSelectedCopy		: executeGrabber(cActionClipboard, cModeSelected); break;
		case mnuSelectedEMail		: executeGrabber(cActionEMail, cModeSelected); break;
		case mnuSelectedExtEditor	: executeGrabber(cActionPaint, cModeSelected); break;

		case mnuBrowserEdit			: executeGrabber(cActionEdit, cModeBrowser); break;
        case mnuBrowserSave			: executeGrabber(cActionSave, cModeBrowser); break;
		case mnuBrowserSavePDF		: executeGrabber(cActionSavePDF, cModeBrowser); break;
		case mnuBrowserSendOneNote	: executeGrabber(cActionSendOneNote, cModeBrowser); break;
		case mnuBrowserUpload		: executeGrabber(cActionUpload, cModeBrowser); break;
		case mnuBrowserPrint		: executeGrabber(cActionPrint, cModeBrowser); break;
		case mnuBrowserCopy			: executeGrabber(cActionClipboard, cModeBrowser); break;
		case mnuBrowserEMail		: executeGrabber(cActionEMail, cModeBrowser); break;
		case mnuBrowserExtEditor	: executeGrabber(cActionPaint, cModeBrowser); break;

        case mnuAllTabsEdit		    : executeGrabber(cActionEdit, cModeTabs); break;
        case mnuAllTabsSinglePDF	: executeGrabber(cActionMultiPDF, cModeTabs); break;
        case mnuAllTabsSave         : executeGrabber(cActionSave, cModeTabs); break;
        case mnuAllTabsSendOneNote  : executeGrabber(cActionSendOneNote, cModeTabs); break;
        case mnuAllTabsUpload       : executeGrabber(cActionUpload, cModeTabs); break;
        case mnuAllTabsPrint        : executeGrabber(cActionPrint, cModeTabs); break;
        case mnuAllTabsClipboard    : executeGrabber(cActionClipboard, cModeTabs); break;
        case mnuAllTabsEMail        : executeGrabber(cActionEMail, cModeTabs); break;
        case mnuAllTabsExtEditor    : executeGrabber(cActionPaint, cModeTabs); break;

		case mnuLastAction		    : captureLastUsedMode(); break;
		case mnuPreferences		    : openExtensionPreferences(); break;
		case mnuViewDemo		    : openDemoPage(); break;
		case mnuSupport			    : openSupportPage(); break;
		case mnuAPI				    : openAPIPage(); break;

        case mnuUnlockProFeatures   :
		case mnuUpgrade			    : doUpgrade(); break;

		case mnuRegister		    : doRegister(); break;
		case mnuEnterLicense	    : enterLicense(); break;
		case mnuOpenFile		    : openFile(); break;
		case mnuOpenClipboard	    : openClipboard(); break;
		case mnuResume			    : resumeEditing(); break;
		case mnuFireShotNative 	    : installNative(); break;
		case mnuLicensingInfo	    : showLicenseInfo(); break;
		case mnuAbout			    : showAbout(); break;
	}
}

function updateLastActionInContextMenu()
{
	chrome.contextMenus.update(mnuLastAction, {title: getLADescription() + "    " + getOption(cShortcutPref, cDefaultShortcut)});

	if (!isNativeSupported()) {
        chrome.contextMenus.update(mnuEntireEdit, {title: chrome.i18n.getMessage("action_capture_entire_lite") + "...    " + getOption(cShortcutPrefEntire, cDefaultShortcutEntire)});
        chrome.contextMenus.update(mnuVisibleEdit, {title: chrome.i18n.getMessage("action_capture_visible_lite") + "...    " + getOption(cShortcutPrefVisible, cDefaultShortcutVisible)});
        chrome.contextMenus.update(mnuSelectedEdit, {title: chrome.i18n.getMessage("action_capture_selection_lite") + "...    " + getOption(cShortcutPrefSelection, cDefaultShortcutSelection)});
    }
}

var fEntered = false;
var mnuLastAction, mnuVisibleEdit, mnuVisibleSave, mnuVisibleSavePDF, mnuVisibleSendOneNote, mnuVisibleUpload, mnuVisiblePrint, mnuVisibleCopy, mnuVisibleEMail, mnuVisibleExtEditor,
	mnuEntireEdit, mnuEntireSave, mnuEntireSavePDF, mnuEntireSendOneNote, mnuEntireUpload, mnuEntirePrint, mnuEntireCopy, mnuEntireEMail, mnuEntireExtEditor, 
	mnuSelectedEdit, mnuSelectedSave, mnuSelectedSavePDF, mnuSelectedSendOneNote, mnuSelectedUpload, mnuSelectedPrint, mnuSelectedCopy, mnuSelectedEMail, mnuSelectedExtEditor, 
	mnuBrowserEdit, mnuBrowserSave, mnuBrowserSavePDF, mnuBrowserSendOneNote, mnuBrowserUpload, mnuBrowserPrint, mnuBrowserCopy, mnuBrowserEMail, mnuBrowserExtEditor, 
	mnuResume, mnuOpenFile, mnuOpenClipboard, mnuPreferences, mnuRegister, mnuEnterLicense, mnuUpgrade, mnuViewDemo, mnuSupport, mnuAPI,  mnuLicensingInfo, mnuAbout, mnuFireShotNative, mnuTest,
    mnuAllTabsEdit, mnuAllTabsSinglePDF, mnuUnlockProFeatures, mnuAllTabsSave, mnuAllTabsSendOneNote, mnuAllTabsUpload, mnuAllTabsPrint, mnuAllTabsEMail, mnuAllTabsExtEditor, mnuAllTabsClipboard;



function updateContextMenu()
{
	if (fEntered) return;
	fEntered = true;
	//logToConsole("updateContextMenu");
	
	chrome.contextMenus.removeAll(
		function()
		{
			var mnuRoot,
                fPro = localStorage[cPluginProModePref] == "true",
                fRegistered = localStorage[cRegisteredPref] == "true",
                fLite = !isNativeSupported();

			
			if (!guiItemsLocked)
			{
                if (isDebug)
                {
                    mnuTest = chrome.contextMenus.create({title: "do test", onclick: genericOnClick});
                    chrome.contextMenus.create({type: "separator"});
                }

				//logToConsole("items removed");
				mnuLastAction = chrome.contextMenus.create({title: "Last action", onclick: genericOnClick});

				chrome.contextMenus.create({type: "separator"});

				
				if (fLite)
				{
					mnuEntireEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_entire_lite") + "...", onclick: genericOnClick});
					mnuVisibleEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_visible_lite") + "...", onclick: genericOnClick});
					mnuSelectedEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_selection_lite") + "...", onclick: genericOnClick});
					
					chrome.contextMenus.create({type: "separator"});
				}
				else
				{
					mnuRoot = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_visible") + "..."});
					mnuVisibleEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleSave = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleSavePDF = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save_pdf") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleSendOneNote = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleUpload = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisiblePrint = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleCopy = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleEMail = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuVisibleExtEditor = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});

					mnuRoot = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_entire") + "..."});
					mnuEntireEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireSave = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireSavePDF = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save_pdf") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireSendOneNote = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireUpload = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntirePrint = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireCopy = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireEMail = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuEntireExtEditor = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});

					mnuRoot = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_selection") + "..."});
					mnuSelectedEdit = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedSave = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedSavePDF = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save_pdf") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedSendOneNote = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedUpload = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedPrint = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedCopy = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedEMail = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuSelectedExtEditor = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});
					
					mnuRoot = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_browser") + "..."});
					mnuBrowserEdit = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserSave = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserSavePDF = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_save_pdf") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserSendOneNote = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserUpload = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserPrint = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserCopy = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserEMail = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
					mnuBrowserExtEditor = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});

                    mnuRoot = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_capture_tabs") + "..."});

                    mnuUnlockProFeatures = fPro || fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_switch_pro_tabs"), parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsSinglePDF = fLite ||  chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_save_pdf_single") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsEdit = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_edit") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsSave = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_save") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsSendOneNote = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_onenote") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsUpload = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_upload") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsPrint = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_print") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsClipboard = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_copy") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsEMail = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_email") + "...", parentId: mnuRoot, onclick: genericOnClick});
                    mnuAllTabsExtEditor = fLite || chrome.contextMenus.create({enabled: fPro, title: chrome.i18n.getMessage("action_external") + "...", parentId: mnuRoot, onclick: genericOnClick});


                    chrome.contextMenus.create({type: "separator"});
					
					if (!fLite && fPro)
					{
						if (resumeMenuEnabled)
							mnuResume = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_resume") + "...", onclick: genericOnClick});		
					
						mnuOpenFile = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_open_file") + "...", onclick: genericOnClick});		
						mnuOpenClipboard = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_open_clipboard") + "...", onclick: genericOnClick});		
							
						chrome.contextMenus.create({type: "separator"});
					}
				}
				
				
				
				mnuPreferences = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_options") + "...", onclick: genericOnClick});		
				mnuFireShotNative = !isWindows() || !fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_install_native") + "...", parentId: mnuRoot, onclick: genericOnClick});
				//mnuCapPreferences = chrome.contextMenus.create({title: "Capture preferences...", onclick: genericOnClick});		
				
				if (!fLite)
					chrome.contextMenus.create({type: "separator"});
			}
			
			
			if (!fLite && fPro && !fRegistered)
			{
				mnuRegister = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_register") + "...", onclick: genericOnClick});		
				mnuEnterLicense = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_enter_license") + "...", onclick: genericOnClick});		
			}
			
			if (!fLite && !fPro)
				mnuUpgrade = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_switch_pro") + "!", onclick: genericOnClick});		
				
			mnuViewDemo = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_view_demo"), onclick: genericOnClick});		
			mnuSupport = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_support"), onclick: genericOnClick});		
			//mnuAPI = chrome.contextMenus.create({title: "FireShot API...", onclick: genericOnClick});		

			fLite || chrome.contextMenus.create({type: "separator"});
			
			if (!fLite && fPro && fRegistered)
				mnuLicensingInfo = chrome.contextMenus.create({title: chrome.i18n.getMessage("action_license_info"), onclick: genericOnClick});		
				
			mnuAbout = fLite || chrome.contextMenus.create({title: chrome.i18n.getMessage("action_about"), onclick: genericOnClick});		
			
			//logToConsole("items added");

            updateLastActionInContextMenu();
			
			fEntered = false;
		}
	);
			
}

function restoreBadge() {
	if (localStorage[cQueuedBadgeURLPref] && localStorage[cQueuedBadgeURLPref] != "undefined")
		showBadge(localStorage[cQueuedBadgeURLPref]);
}

//noinspection JSUnusedGlobalSymbols
function executeGrabber(action, mode) {
    if (guiItemsLocked) return;
    setLastActionAndMode(action, mode);

    if (mode === cModeTabs) captureTabs(action);
    else {
        if (multiPDFMode) {
            pluginCommand("cancelMultiPagePDF");
            multiPDFMode = undefined;
        }

        chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
            if (tabs.length > 0)
                capturePage(action, mode, undefined, tabs[0]);
        });
    }
}


function captureTabs(action) {

    function AsyncCycle(method, stop) {
        return {
            next: function (param) {
                if (!stop(param))
                    method(this);
            }
        }
    }

    function AnimatedIcon() {
        return {
            running: false,

            start: function() {
                var cntr = 0,
                    images = ['images/progress_1.png', 'images/progress_2.png', 'images/progress_3.png', 'images/progress_4.png'],
                    parent = this,
                    cycle = function() {
                        if (parent.running) {
                            chrome.browserAction.setIcon({path: images[++cntr % 4]});
                            setTimeout(function () {cycle()}, 500);
                        }
                        else parent.defaultIcon();
                    };

                this.running = true;
                cycle();
            },

            stop: function() {
                this.running = false;
                this.defaultIcon();
            },

            defaultIcon: function() {chrome.browserAction.setIcon({path: 'images/sss_19.png'});}


        }
    }

    function iterateTabsAndCapture(action) {

        return new Promise(function(resolve) {
            var tabsCaptured = 0;

            chrome.tabs.query({currentWindow: true}, function (tabs) {
                if (!tabs || tabs.length === 0) {resolve(tabsCaptured); return;}
                var currentTab = 0,
                    cycle      = new AsyncCycle(function (iterator) {
                            try {
                                chrome.tabs.highlight({windowId: tabs[currentTab].windowId, tabs: currentTab}, function () {
                                    capturePage(action, cModeEntire, function (result) {
                                        if (result) ++tabsCaptured;
                                        iterator.next();
                                    }, tabs[currentTab++]);
                                    /*waitForLoading(wnd, currentTab - 1, 300, function (tab) {
                                     if (!tab)
                                     alert('tab closed');
                                     iterator.next();
                                     });*/
                                });
                            }
                            catch (e) {
                                logError(e.message);
                                resolve(tabsCaptured);
                            }
                        },

                        function () {
                            if (currentTab >= tabs.length) {
                                resolve(tabsCaptured);
                                return true;
                            }
                            else return false;
                        });

                cycle.next();
            });
        });

    }


    var progressIcon = new AnimatedIcon();
    progressIcon.start();

    var tAction = action === cActionMultiPDF ? action : cActionSilentAdd;

    if (action === cActionMultiPDF) {
        pluginCommand("startMultiPagePDF");
        multiPDFMode = true;
    }

    iterateTabsAndCapture(tAction)
        .then(function(tabsCaptured){
            progressIcon.stop();

            if (action === cActionMultiPDF) {
                pluginCommand("endMultiPagePDF");
                multiPDFMode = undefined;
            }
            else
                pluginCommand("doGroupAction", {action: action, count: tabsCaptured});
        });
    /*
        .catch(function(e) {
            alert(e);
            action === cActionMultiPDF && pluginCommand("endMultiPagePDF");
        });*/
}


function init() {
    initMessaging();

    document.addEventListener('DOMContentLoaded', function () {
        restoreBadge();
        getVersionInfo();
        updateContextMenu();
        checkAdvancedUpdates();
    });
}

init();


