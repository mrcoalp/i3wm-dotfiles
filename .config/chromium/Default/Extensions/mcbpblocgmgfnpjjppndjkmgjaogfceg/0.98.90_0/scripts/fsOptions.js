//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2016 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

var FireShotSettings = {

	hkModifiers : "ctrl, alt",
	hkKey		: "Z",
	hkKeyCode	: 0,

	
	loadSettings : function()
	{
		$("#edtHotkeyLastUsedAction").val(getOption(cShortcutPref, cDefaultShortcut));
		$("#edtHotkeyVisible").val(getOption(cShortcutPrefVisible, cDefaultShortcutVisible));
		$("#edtHotkeySelection").val(getOption(cShortcutPrefSelection, cDefaultShortcutSelection));
		$("#edtHotkeyEntire").val(getOption(cShortcutPrefEntire, cDefaultShortcutEntire));
		$("#edtHotkeyBrowser").val(getOption(cShortcutPrefBrowser, cDefaultShortcutBrowser));
        $("#edtHotkeyTabs").val(getOption(cShortcutPrefTabs, cDefaultShortcutTabs));
		
		$("#edtFilenameTemplate").val(getOption(cTemplatePref, cDefaultTemplate));
		$("#edtTemplateNumber").val(getOption(cTemplateNumberPref, 1));
		$("#chkTemplateNumberPad").prop('checked', getOption(cTemplateNumberPadCheckPref, "true") === "true");
		$("#edtTemplateNumberPad").val(getOption(cTemplateNumberPadValuePref, 3));
		
		var fPng = getOption(cDefaultImageFormatPref, "png") === "png";
		$("#radImagePNG").prop('checked', fPng);
		$("#radImageJPG").prop('checked', !fPng);
		
		$("#edtTemplateFilenameMaxLen").val(getOption(cTemplateFilenameMaxLen, 100));
		
		$("#cmbVisibleHotkeyAction").val(getOption(cShortcutPrefVisibleAction, cDefaultShortcutVisibleAction));
		$("#cmbSelectionHotkeyAction").val(getOption(cShortcutPrefSelectionAction, cDefaultShortcutSelectionAction));
		$("#cmbEntireHotkeyAction").val(getOption(cShortcutPrefEntireAction, cDefaultShortcutEntireAction));
		$("#cmbBrowserHotkeyAction").val(getOption(cShortcutPrefBrowserAction, cDefaultShortcutBrowserAction));
        $("#cmbTabsHotkeyAction").val(getOption(cShortcutPrefTabsAction, cDefaultShortcutTabsAction));

		$("#chkDebug").prop('checked', getOption(cDebugPref, "true") === "true");
	},

	saveSettings: function()
	{
		localStorage[cShortcutPref] = $("#edtHotkeyLastUsedAction").val();
		localStorage[cShortcutPrefVisible] = $("#edtHotkeyVisible").val();
		localStorage[cShortcutPrefSelection] = $("#edtHotkeySelection").val();
		localStorage[cShortcutPrefEntire] = $("#edtHotkeyEntire").val();
		localStorage[cShortcutPrefBrowser] = $("#edtHotkeyBrowser").val();
        localStorage[cShortcutPrefTabs] = $("#edtHotkeyTabs").val();
		
		localStorage[cShortcutPrefVisibleAction] = $("#cmbVisibleHotkeyAction").val();
		localStorage[cShortcutPrefSelectionAction] = $("#cmbSelectionHotkeyAction").val();
		localStorage[cShortcutPrefEntireAction] = $("#cmbEntireHotkeyAction").val();
		localStorage[cShortcutPrefBrowserAction] = $("#cmbBrowserHotkeyAction").val();
        localStorage[cShortcutPrefTabsAction] = $("#cmbTabsHotkeyAction").val();
		
		localStorage[cTemplatePref] = $("#edtFilenameTemplate").val();
		localStorage[cTemplateNumberPref] = parseInt($("#edtTemplateNumber").val());
		localStorage[cTemplateNumberPadCheckPref] = $("#chkTemplateNumberPad").prop("checked");
		localStorage[cTemplateNumberPadValuePref] = Math.max(0, parseInt($("#edtTemplateNumberPad").val()));
		localStorage[cDefaultImageFormatPref] = $("#radImagePNG").prop("checked") ? "png" : "jpg";
		localStorage[cTemplateFilenameMaxLen] = Math.max(10, parseInt($("#edtTemplateFilenameMaxLen").val()));

		localStorage[cDebugPref] = $("#chkDebug").prop("checked");

		
		getExtension().updateContextMenu();
	},
	
	processHotkey: function(elem, event)
	{
		event.preventDefault();
		event.stopPropagation();
		
		var v = getShortcut(event);
		
		if (v != "") 
			elem.val(v);
	}
};


document.addEventListener('DOMContentLoaded', function () {

    function setupAccessibility() {
        var fLite = !getExtension().isNativeSupported();

        $(".native").toggle(!fLite);
        $(".lite").toggle(fLite);

        if (localStorage[cRegisteredPref] == "true") $("#trLicensingInfo").hide();
    }

  
	try {
		i18nPrepare();
	} 
	catch (e) {logError(e.message);}
	
	$('#container').show();

    $('#btnLicenseInfo').click(function() {
        getExtension().enterLicense();
    });
  
	$('#btnCapSettings').click(function() {
		getExtension().openCaptureSettings();
	});

	$('#btnGeneralOptions').click(function() {
		getExtension().openSettings();
	});

	$('#btnApply').click(function() {
		FireShotSettings.saveSettings(); 
	});

	$('#btnSave').click(function() {
		FireShotSettings.saveSettings(); 
		window.close();
	});
	
	$('#edtHotkeyLastUsedAction').keydown(function(event) {
		FireShotSettings.processHotkey($(this), event);
	});

	$('#edtHotkeyVisible').keydown(function(event) {
		FireShotSettings.processHotkey($(this), event);
	});
	
	$('#edtHotkeyEntire').keydown(function(event) {
		FireShotSettings.processHotkey($(this), event);
	});
	
	$('#edtHotkeySelection').keydown(function(event) {
		FireShotSettings.processHotkey($(this), event);
	});

    $('#edtHotkeyBrowser').keydown(function(event) {
        FireShotSettings.processHotkey($(this), event);
    });

    $('#edtHotkeyTabs').keydown(function(event) {
        FireShotSettings.processHotkey($(this), event);
    });
	
	$("#btnTemplateSettings").click(function(){
		$(this).toggle();
		$("#divTemplateSettings").toggle();
	});
	
	$("#btnTemplateSettingsHide").click(function(){
		$("#btnTemplateSettings").toggle();
		$("#divTemplateSettings").toggle();
	});

	$("#btnAdvancedFunctions").click(function(){
		getExtension().installNative();
	});



    setupAccessibility();

	FireShotSettings.loadSettings();
});


