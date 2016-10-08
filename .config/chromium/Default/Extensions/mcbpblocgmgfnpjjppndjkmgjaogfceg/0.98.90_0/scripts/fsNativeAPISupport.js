//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2016 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

const statusHostReady = 0,
	  statusError = 1;

var fsNativePlugin = {
	port: undefined,
	ready: false,
	autoReconnect: false,
	updating: false,
	updated: false,
	ignoreResponse: false,
	connecting: false,
	callback: undefined,
	prevVersion: undefined,
	updateTrials: 0,
	
	init: function(callback)
	{
		this.callback = callback;
		this.connecting = true;
		this.ignoreResponse = false;

		//this.port = chrome.runtime.connectNative('com.getfireshot.debug.api');
		this.port = chrome.runtime.connectNative('com.getfireshot.api');
		
		this.port.onMessage.addListener(function(msg) {
			
			// Не передаём управление, пока  придёт status = ready
			if (fsNativePlugin.ignoreResponse) 
			{
				logToConsole("Ignored response: " + JSON.stringify(msg));
				if (msg.topic === "status" && msg.code == statusError)
				{
					fsNativePlugin.connecting = false;
					fsNativePlugin.updating = false;
					fsNativePlugin.autoReconnect = false;
					
					pluginEvent(msg);
				}
				return;
			}
			
			logToConsole("Received: " + JSON.stringify(msg));
			
			fsNativePlugin.connecting = false;
			fsNativePlugin.autoReconnect = false;
			
			if (!fsNativePlugin.processInternally(msg))
				pluginEvent(msg);
		});
		
		this.port.onDisconnect.addListener(function() { 
			this.ready = false;
			this.connecting = false;
			
			if (!this.updating)
				this.runCallback();
			
			logToConsole("Native port disconnected.");
			
			if (this.autoReconnect) this.doReconnect();
		}.bind(this));
		
		logToConsole("Native port created successfully. Starting test...");
		this.launchJSON({JSONCommand:"ping"});
	},
	
	runCallback: function()
	{
		if (this.callback !== undefined)
		{
			this.callback();
			this.callback = undefined;
		}
	
	},
	
	processInternally: function(msg)
	{
		if (msg.topic == "hostVersion")
		{
			let version = msg.data;
			
		
			if (extVersion != version)
			{
				if (++this.updateTrials > 7) 
				{
					logToConsole("Too much of unsuccessful update trials. No updates anymore.");
					gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-Too much of unsuccessful update trials. No updates anymore"); 
					this.updating = false;
					return false;
				}
				else
				{
					this.prevVersion = version;
					this.doUpdate();
					return true;
				}
			}
		}
		else if (msg.topic == "status")
		{
			if (msg.code == statusHostReady)
			{
				let version = msg.data;
				
				this.updateTrials = 0;
				this.ready = true;
				this.runCallback();
			
				if (this.updating)
				{
					this.updated = true;
					this.updating = false;

					if (this.prevVersion != "0")
						nativeHostUpdated(version);
				}
				
				return false;
			}
			else 
			{
				if (this.updating)
				{
					this.updating = false;
					//nativeHostUpdated(version);
				}
				
				return false;
			}
		}
		
		else if (msg.topic == "getDLL")
		{
			this.sendDLL();
			return true;
		}
		
		return false;
	},
	
	launchJSON: function(JSONData)
	{
		this.port.postMessage(JSONData);
	},
	
	getFile: function(fileName, callback) 
	{
        var xhr = new XMLHttpRequest();
        var url = chrome.extension.getURL(fileName);

        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
			
        xhr.onreadystatechange = function() {
            if ((xhr.readyState == XMLHttpRequest.DONE)) {
                if (xhr.status == 200 && xhr.response)
                    callback(base64EncodeBuf(xhr.response));
                else
                    gaTrack('UA-1025658-9', 'fireshot.com', "NativeError-Error retrieving SSS.dll: " + xhr.status);
            }
        };
        xhr.send();
    },
	
	sendDLL: function()
	{
		this.getFile("native/sss.dll", function(data) {
		
			this.launchJSON({JSONCommand: "updateDLL", data: data});
		}.bind(this));
	},
	
	doUpdate: function()
	{
		logToConsole("Updating native to the version: " + extVersion);
		this.ignoreResponse = true;
		this.getFile("native/fireshot-chrome-plugin.exe", function(data) {
			this.updating = true;
			this.autoReconnect = true;
			this.launchJSON({JSONCommand: "updateNative", data: data});
		}.bind(this));
	},
	
	doReconnect: function()
	{
		setTimeout(function() {
			logToConsole("Trying to reconnect...");
			this.init(this.callback);
		}.bind(this), 1000);
	}
};