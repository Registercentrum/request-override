'use strict';

var $apiKeyForm = $('#apikey-form'),
  $saveBtn = $apiKeyForm.find('button'),
  $apiKey = $('#apiKey'),
  $prodUrl = $('#prodUrl'),
  $methodFormCt = $('#api-method-form-container'),
  $whitelistFormCt = $('#whitelist-form-container'),
  manifest = chrome.runtime.getManifest();

chrome.storage.sync.get(['apiKey', 'productionUrl'], function(items) {
  $apiKey.val(items.apiKey);
  $prodUrl.val(items.productionUrl);
});

$apiKeyForm.submit(function(e) {
  e.preventDefault();
  $saveBtn.button('loading');
  chrome.storage.sync.set({
    'apiKey': $apiKey.val(),
    'productionUrl': $prodUrl.val()
  }, function() {
    setTimeout(function() {
      $saveBtn.button('reset');
    }, 500);
  });
});

function writeMultiForm($formContainer, storageProp) {
  var $inputs = $formContainer.find('input'),
    data = {};
  data[storageProp] = [];
  $inputs.each(function(i, item) {
    if (i + 1 === $inputs.length) {
      return;
    }
    data[storageProp].push(item.value);
  });
  chrome.storage.sync.set(data, function() {
    // Notify that we saved.
    // message('Settings saved');
  });
}


function removeEvent(e) {
  var $form = $(e.target);
  e.preventDefault();
  $form.remove();
}

function addEvent(e) {
  var $form = $(e.target),
    $input = $form.find('input'),
    value = $input.val();
  e.preventDefault();
  if (!value || value.length <= 0) {
    return;
  }
  $form.remove();
  return value;
}

function addMultiForm($formContainer, addEvt, removeEvt, input) {
  var $form =
    $('<form class="form-horizontal api-method-form">' +
      '  <div class="form-group">' +
      '    <div class="col-xs-10">' +
      '      <input type="text" class="form-control" placeholder="Ny..." value="' + (!input ? '"' : input + '" disabled=true') + '>' +
      '    </div>' +
      '    <div class="col-xs-2">' +
      '      <button type="submit" class="btn btn-' + (input ? 'danger' : 'primary') + ' col-xs-12 remove-btn"><span class="glyphicon glyphicon-' + (input ? 'remove' : 'plus') + '" aria-hidden="true"></span></button>' +
      '    </div>' +
      '  </div>' +
      '</form>');
  $form.submit(input ? removeEvt : addEvt);
  $formContainer.append($form);
  return $form;
}

function initMultiForm($formContainer, addEvt, removeEvt, storageProp) {
  var i, storageVal;
  chrome.storage.sync.get(storageProp, function(items) {
    storageVal = items[storageProp];
    if (storageVal) {
      for (i = 0; i < storageVal.length; i++) {
        if (storageVal[i].length > 0) {
          addMultiForm($formContainer, addEvt, removeEvt, storageVal[i]);
        }
      }
    }
    addMultiForm($formContainer, addEvt, removeEvt);
  });
}

function removeApiEvent(e) {
  removeEvent(e);
  writeMultiForm($methodFormCt, 'apiMethods');
}

function addApiEvent(e) {
  var value = addEvent(e);
  if(!value){
    return;
  }
  addMultiForm($methodFormCt, addApiEvent, removeApiEvent, value);
  addMultiForm($methodFormCt, addApiEvent, removeApiEvent);
  writeMultiForm($methodFormCt, 'apiMethods');
}

function removeWLEvent(e) {
  removeEvent(e);
  writeMultiForm($whitelistFormCt, 'whitelist');
}

function addWLEvent(e) {
  var value = addEvent(e);
  if(!value){
    return;
  }
  addMultiForm($whitelistFormCt, addWLEvent, removeWLEvent, value);
  addMultiForm($whitelistFormCt, addWLEvent, removeWLEvent);
  writeMultiForm($whitelistFormCt, 'whitelist');
}

function createAlert(message) {
  return $(
    '<div class="alert alert-danger aler-dismissable" role="alert" id="import-error">' +
    '  <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
    message +
    '</div>'
  );
}

$('#import-settings-form').submit(function(evt) {
  var $form = $(evt.target),
    value, $modal, json, $error;
  evt.preventDefault();
  $modal = $form.closest('.modal');
  value = $form.find('textarea').val();
  $error = $('#import-error');
  try {
    json = JSON.parse(value);
    chrome.storage.sync.set(_.pick(json, 'apiMethods', 'whitelist', 'productionUrl', 'apiKey'), function() {
      location.reload();
      $error.empty();
    });
  } catch (ex) {
    $error.html(createAlert(ex));
  }
});

document.title = manifest.name + ' ' + manifest.version;
$('#rover-app-name').text(manifest.name);
$('#rover-version').text(manifest.version);
$('#rover-description').text(manifest.description);

initMultiForm($methodFormCt, addApiEvent, removeApiEvent, 'apiMethods');
initMultiForm($whitelistFormCt, addWLEvent, removeWLEvent, 'whitelist');
