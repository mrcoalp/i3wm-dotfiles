//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2016 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

document.addEventListener('DOMContentLoaded', function () {
	window.location = chrome.extension.getURL('native/fireshot-chrome-plugin.exe');
	var stopReconnectOnClose = false;
	
	var extension = chrome.extension.getBackgroundPage();
	
	/*if (!extension.fsNativePlugin.autoReconnect)
	{
		console.log("start reconnecting");
		extension.fsNativePlugin.startReconnecting();
		stopReconnectOnClose = true;
	}*/
	
	if (isOpera())
	{
		$('#img-step1-opera').toggle();
		$('#download-image').addClass("opera-download");
	}
	else
	{
		$('#img-step1').toggle();
		$('#download-image').addClass("chrome-download");
	}
	
	function checkUpgraded()
	{
		if (extension.fsNativePlugin.ready)
		{
			gaTrack('UA-1025658-9', 'fireshot.com', "NativeHostInstalled"); 
			document.location.href = extension.getInstalledPageURL();
		}
		else
		{
			console.log("check");
			if (!extension.fsNativePlugin.autoReconnect && !extension.fsNativePlugin.updating && !extension.fsNativePlugin.connecting)
			{
				console.log("connecting from page");
				extension.fsNativePlugin.init();
			}
				
			setTimeout(function() {checkUpgraded();}, 1000);
		}
	}
	
	checkUpgraded();
});

