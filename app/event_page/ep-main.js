'use strict';
/* read the design doc for explanation of the comments */

var nlp_worker = null;
var port = null;

var workerMessage = function (type, data) {
  return JSON.stringify({ type: type, data: data }, null, 4);
};

//Create a web worker for NLP tasks
function createWorker() {
  nlp_worker = new Worker("worker/nlp_worker.js");

  //TODO: Error handling & fallback.
  nlp_worker.onmessage = function(event) {
    var message = JSON.parse(event.data);
    switch (message.type) {
      case "keywordlist":
        if (port) {
          port.postMessage({message: message.type, data: message.data});
        } else {
          console.log("got keywords before port was initialized!");
        }
        break;
      default:
        console.warn("nlp_worker:Unable to recognize response " + message.type);
        break;
    }
  };

  //Initialize the NLP modules and start the worker.
  nlp_worker.postMessage(workerMessage("initialize", null));
};

chrome.runtime.onConnect.addListener(function(localport) {
  port = localport;
  port.onMessage.addListener(function (message) {
    //relay messages from CP to nlp_worker.js
    nlp_worker.postMessage(workerMessage(message.type, message.data));
  });
});

chrome.runtime.onMessage.addListener( function(message, sender, sendResponse) {
    if (message === "cp-nlpinit" ) {
      if (nlp_worker == null)
        createWorker();

      chrome.pageAction.show(sender.tab.id);
    }
});

/**
 * message routing
 *  component: ('auth'||...)
 */
chrome.runtime.onMessageExternal.addListener(function(message,sender,sendResponse) {
  var keepChannelOpen=false;

  if (message.component === 'auth') {
    console.log('EP-AUTH:got message:',message);
    var service = message.service;

    if (epAuth.hasOwnProperty(service)) {
      var type = message.type;
      switch (type) {
        case 'gettoken':
          keepChannelOpen = epAuth[service].getToken(sendResponse);
          break;
        case 'removecachedtoken':
          var token = message.token;
          epAuth[service].removeCachedToken(token);
          break;
        default:
          console.log(new Error('EP-AUTH:unknown message type:'+type));
          break;
      }
    } else {
      console.log(new Error('EP-AUTH:unknown service:'+service));
    }
  } else if (message.component === 'http') {
    keepChannelOpen = true;

    epHttp.send({
      url: message.url,
      cb: sendResponse
    });
  }

  return keepChannelOpen; // to call sendResponse asynchronously
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  console.log('tab ' + tabId + ' is removed');
  /*Could be possible to unload the worker if no tabs are using it ? */
});

if (chrome.pageAction) {
  chrome.pageAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, "cp-toggle");
  });
}
