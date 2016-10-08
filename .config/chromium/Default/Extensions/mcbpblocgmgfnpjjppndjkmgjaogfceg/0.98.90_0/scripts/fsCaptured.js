//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2016 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

window.addEventListener('load', function () {
	
	var backgroundPage = null;
	const cShowAlert1OptionName = "showAlert1";
	
	function setupAccessibility()
	{
        if (!backgroundPage.getAdvancedFeaturesAvailable())
            $("#spnAdvancedFeaturesSection").hide();

        if (isWindows())
			$("#divPromo,#upgradeLink,#noflashgoadvanced,#noflashgoadvanced2,#noflashgoadvanced3").removeClass("hiddenInitially");
			
		if (navigator.mimeTypes ["application/x-shockwave-flash"] === undefined) {
			$("#divFlashSave").hide();
			$("#divFlashSavePDF").hide();	
		}
	}
	
	/***************************************************************************************/
	
	function addSaveButton()
	{
		var flashVars = {
				data: backgroundPage.capResultDataURL.replace(/^data:image\/(png|jpeg);base64,/, "").replace(/\+/g, "%2b"),
				dataType: "base64",
				filename: backgroundPage.capResultFileNameLite + "." + getOption(cDefaultImageFormatPref, "png")
			}, 
			params = {
				allowScriptAccess: "always",
				wmode: "transparent"
			};
			
		swfobject.embedSWF("media/save.swf", "spnFlashSaveContainer", "120", "30", "10", null, flashVars, params);	
	}
	
	/***************************************************************************************/
	
	function addSavePDFButton()
	{
		var img = backgroundPage.capResult;
		var doc = new jsPDF(img.width > img.height ? "l" : "p", "in", [img.height / 96, img.width / 96]);
		doc.addImage(backgroundPage.capResult.toDataURL("image/jpeg"), 'JPEG', 0, 0, img.width / 96, img.height / 96);
		
		var flashVars = {
				data: doc.output('datauristring').replace(/^data:image\/(png|jpeg);base64,/, "").replace(/\+/g, "%2b"),
				dataType: "base64",
				filename: backgroundPage.capResultFileNameLite + ".pdf"
			}, 
			params = {
				allowScriptAccess: "always",
				wmode: "transparent"
			};
		
		swfobject.embedSWF("media/save.swf", "spnFlashSavePDFContainer", "120", "30", "10", null, flashVars, params);
	}
	
	/***************************************************************************************/
	
	function initHandlers()
	{
		$("#btnPrint").click(function() {
			var iframe = document.createElement("IFRAME");
			
			$(iframe).attr({
				style: "width:0px;height:0px;",
				id: "fsTempElement"
			});
			
			document.body.appendChild(iframe);
			//noinspection HtmlUnknownTarget
            iframe.contentWindow.document.write("<div style='margin:0 auto;text-align:center'><img style='width:100%' src='" + document.getElementById("imgResult").src + "'></div>");
		
			iframe.contentWindow.print(); 
			$("#fsTempElement").remove();
		});
		
		$("#lnkOptions").click(function() {
			backgroundPage.openExtensionPreferences();
		});

        $("#lnkInstallAdvanced, #lnkInstallAdvanced2, #lnkInstallAdvanced3, #lnkInstallAdvanced4").click(function() {
            backgroundPage.installNative();
            return false;
        });


		
		$("#lnkRecommend").click(function() {
			backgroundPage.openURL("http://getfireshot.com/like.php?browser=" + (isOpera() ? "op" : "ch") + "&ver=" + backgroundPage.extVersion);
		});
		
		$("#btnCloseAlert1").click(function() {
			localStorage[cShowAlert1OptionName] = 0;
		});	
	}

	/***************************************************************************************/
	
	function showWarnings()
	{
		if (isWindows() && localStorage[cPluginProModePref] && localStorage[cShowAlert1OptionName] === undefined)
			setTimeout(function() {$("#divAlert1").fadeIn(700)}, 1000);
	}
	
	/***************************************************************************************/
	
	function showPage()
	{
		$(".container").show();

        document.getElementById("imgResult").onload = function() {
            var img = backgroundPage.capResult;
            var div = document.getElementById("divImgResult");
            if (img.width < $(div).width())
            {
                $("#imgResult").css("width", "auto");
                $("#divImgResult").css("overflow-y", div.clientHeight < div.scrollHeight ? "scroll" : "hidden");
                div.style.zoom = 1.0000001;
                setTimeout(function(){div.style.zoom = 1;},50);
            }

            else if (div.clientHeight >= div.scrollHeight)
            {
                $(div).css("overflow-y", "hidden");
                div.style.zoom = 1.0000001;
                setTimeout(function(){div.style.zoom = 1;},50);
            }
        };

        document.getElementById("imgResult").src = backgroundPage.capResultDataURL;
		document.title = backgroundPage.capResultFileNameLite;//backgroundPage.tabTitle + " (" + backgroundPage.tabURL + ")";
	}

	
	/***************************************************************************************/
	
	function init()
	{
	
		try {
			i18nPrepare();
		} 
		catch (e) {logError(e.message);}
		
		chrome.runtime.getBackgroundPage(function (bp) {
			if (!bp) return;
			
			backgroundPage = bp;
			
			addSaveButton();
			addSavePDFButton();
			setupAccessibility();
			initHandlers();
			
			showPage();
			showWarnings();
		});
	}
	
	init();
});