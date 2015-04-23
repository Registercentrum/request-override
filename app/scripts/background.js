'use strict';
var apiMethods = [],
  activeTabs = [],
  whitelist = [],
  apiKey, prodUrl;

function currentCallback(details) {
  var matches, newUrl;
  if (prodUrl && activeTabs.indexOf(details.tabId) >= 0) {
    matches = details.url.match(/https{0,1}:\/\/[^\/]+(\/api\/([^\/]+)\/(?:.*\/){0,1}(.+))/);
    if (matches) {
      if (apiMethods.indexOf(matches[2]) >= 0) {
        newUrl = '' + matches[1];
        if (matches[3] && matches[3].indexOf('?') >= 0) {
          if (!matches[3].match(/apikey=.+/i)) {
            newUrl += '&APIKey=' + encodeURIComponent(apiKey);
          }
        } else {
          newUrl += '?APIKey=' + encodeURIComponent(apiKey);
        }
        return {
          redirectUrl: prodUrl + newUrl
        };
      }
    }
  }
}

function stopListening() {
  if (typeof currentCallback === 'function') {
    chrome.webRequest.onBeforeRequest.removeListener(currentCallback);
  }
}

function startListening() {
  chrome.webRequest.onBeforeRequest.addListener(currentCallback, {
    urls: whitelist,
    types: ['xmlhttprequest']
  }, ['blocking']);
}

chrome.tabs.onUpdated.addListener(function(tabId) {
  if (activeTabs.indexOf(tabId) >= 0) {
    chrome.browserAction.setBadgeText({text: 'ON', tabId: tabId});
    chrome.browserAction.setBadgeBackgroundColor({color: '#14CC0B', tabId: tabId});
  }
});

chrome.runtime.onInstalled.addListener(function(details) {
  console.log('previousVersion', details.previousVersion);
});

//Initial setup//
//Reset active tabs from previous sessions
chrome.storage.sync.set({
  activeTabs: []
}, function() {
  activeTabs = [];
});

//Pre load global settings set in the options page
chrome.storage.sync.get(['apiKey', 'checkedApiMethods', 'productionUrl', 'whitelist'], function(items) {
  if (items.apiKey) {
    apiKey = items.apiKey;
  }
  if (items.checkedApiMethods) {
    apiMethods = items.checkedApiMethods;
  }
  if (items.productionUrl) {
    prodUrl = items.productionUrl;
  }
  if (items.whitelist) {
    whitelist = items.whitelist;
  }
});

//Listen for storage changes
chrome.storage.onChanged.addListener(function(changes) {
  if (changes.whitelist) {
    whitelist = changes.whitelist.newValue;
  }
  if (changes.apiKey) {
    apiKey = changes.apiKey.newValue;
  }
  if (changes.checkedApiMethods) {
    apiMethods = changes.checkedApiMethods.newValue;
  }
  if (changes.productionUrl) {
    prodUrl = changes.productionUrl.newValue;
  }
  if (changes.activeTabs) {
    activeTabs = changes.activeTabs.newValue;
  }
  if (activeTabs.length > 0 && whitelist.length > 0) {
    if (!chrome.webRequest.onBeforeRequest.hasListeners()) {
      startListening();
    }
  } else if (chrome.webRequest.onBeforeRequest.hasListeners()) {
    stopListening();
  }
});
