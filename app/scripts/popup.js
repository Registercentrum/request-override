'use strict';

var $apiMethods = $('#api-methods');

function changeStatus($btn, isActive) {
  $btn.html(isActive ? 'Avaktivera' : 'Aktivera');
  $btn.removeClass(!isActive ? 'btn-danger' : 'btn-success');
  $btn.addClass(isActive ? 'btn-danger' : 'btn-success');
}

function setBadge(isActive, tabId){
  if(isActive){
    chrome.browserAction.setBadgeText({text: 'ON', tabId: tabId});
    chrome.browserAction.setBadgeBackgroundColor({color: '#14CC0B', tabId: tabId});
  } else{
    chrome.browserAction.setBadgeText({text: '', tabId: tabId});
  }
}

$('#activate-button').click(function(e) {
  var $btn = $(e.target),
    newState = !$btn.hasClass('btn-danger');

  changeStatus($btn, newState);
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabArray) {
    if (tabArray && tabArray.length > 0) {
      var tabId = tabArray[0].id;
      chrome.storage.sync.get('activeTabs', function(items) {
        var activeTabs = items.activeTabs || [];
        if (newState && activeTabs.indexOf(tabId) < 0) {
          activeTabs.push(tabId);
        } else if (!newState) {
          activeTabs = _.without(activeTabs, tabId);
        }
        setBadge(newState, tabId);
        chrome.storage.sync.set({
          'isActive': newState,
          'activeTabs': activeTabs
        }, function() {
          // Notify that we saved.
          // message('Settings saved');
        });
      });
    }
  });
});

function addCheckboxListeners() {
  var $checkboxes = $apiMethods.find('input');
  $checkboxes.click(function() {
    var selected = $apiMethods.find('input:checked').map(function() {
      return $(this).val();
    }).get();
    chrome.storage.sync.set({
      'checkedApiMethods': selected
    }, function() {});
  });
}

function addApiMethodCheckboxes(apiMethods, checkedMethods) {
  var i;
  for (i = 0; i < apiMethods.length; i++) {
    $apiMethods.append(
      '<div class="checkbox">' +
      '  <label>' +
      '    <input type="checkbox" value="' + apiMethods[i] + '"' + (_.contains(checkedMethods, apiMethods[i]) ? 'checked' : '') + '> ' + apiMethods[i] +
      '  </label>' +
      '</div>'
    );
  }
}

function initPopup() {
  var methods, checkedMethods, activeTabs;
  chrome.storage.sync.get(['activeTabs', 'apiMethods', 'checkedApiMethods'], function(items) {
    methods = items.apiMethods || [];
    checkedMethods = items.checkedApiMethods || [];
    activeTabs = items.activeTabs || [];

    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabArray) {
      var tabId, isActive;
      if (tabArray && tabArray.length > 0) {
        tabId = tabArray[0].id;
        isActive = activeTabs.indexOf(tabId) >= 0;
        changeStatus($('#activate-button'), isActive);
      }
    });
    addApiMethodCheckboxes(methods, checkedMethods);
    addCheckboxListeners();
  });
}

initPopup();
