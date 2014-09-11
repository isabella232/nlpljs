(function(){
  var loaded = false;
  var open = true;
  chrome.runtime.onMessage.addListener( function(message,sender,sendResponse) {
    //console.log("CS: received message",message);
  if (loaded) {
      document.querySelector('content-push').setAttribute("toggle", open);
      open = !open;
    return;
  }
    // create and open panel
    var currentTabUrl=document.URL;
    var extensionUrl=chrome.extension.getURL("");
    var indexUrl=chrome.extension.getURL("index.html");

    // remove document content and add new head and body
    document.removeChild(document.documentElement);
    //document.open();
    //document.close();
    var html = document.createElement('html');
    var head = document.createElement('head');
    var body = document.createElement('body');
    html.appendChild(head);
    html.appendChild(body);
    document.appendChild(html);

    // add new link/import element to head
    // to load the index.html content
    var link = document.createElement('link');
    link.rel = 'import';
    link.href = indexUrl;
    link.onload = function(e) {
      // copy head and body from import into main document
      console.log("got link load");
      var link = document.querySelector('link[rel="import"]');
      var content = link.import;

      // Grab DOM from warning.html's document.
      var head = content.querySelector('head');
      var body = content.querySelector('body');

      document.head.innerHTML=
        '<base href="'+extensionUrl+'">\n'+
        head.innerHTML;
      document.body.innerHTML=body.innerHTML;

      // set iframe url in <content-push> element
      var cp = document.querySelector('content-push');
      cp.setAttribute("iframeurl",currentTabUrl);
      /*
      cp.addEventListener('content-push-ready', function(e) {
        console.log("Calling setIframeURl:",currentTabUrl);
        cp.setIframeUrl(currentTabUrl);
      });
      */
    };
    link.onerror = function(e) { console.log("got link error"); };
    document.head.appendChild(link);

    /*
    var appUrl=indexUrl+"?"+currentTabUrl;
    console.log("CS: going to:",appUrl);
    location.href=appUrl;
    */

    // send results back to event page
    //console.log("CS: sending done response");
    loaded = true;
    sendResponse("done");
  });
})();
