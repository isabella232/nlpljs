/**
 * Load the stored sources for the tab URL. The schema for the
 * source is as follows. We have 6 groups of Sources. They are,
 * Images, Quotations, Text+Images, Files, Videos and All.
 * Each group has more than 1 sources. The groups have the following
 * properties:
 * title - name of the group
 * icon - the icon name for the group (from core-iconset)
 * enabled - if the group is enabled
 * sources - the sources in this group
 *
 * Sources is a collection of objects with the following properties:
 * title - Title for the source.
 * url - the url to be used for google searching
 * enabled - if this source is enabled
 *
 * Here is the entire schema layed out. This is how data is stored in the sync storage.
 *
 * <tab_url> <----> <item>
 * (key)           (value)
 *
 * <item> = {{title0: group0},{title1: group1},....,{titleN: groupN}}
 *
 * <title> : { title: 'Images',
 *             icon: 'core-image',
 *             enabled: true,
 *             sources: <sources>
 *           }
 *
 * <sources> = {{title0 : source0}, {title1 : source1},....,{titleN: sourceN} }
 *
 * <title> : { title: 'flickr',
 *             url: 'flickr.com',
 *             enabled: true,
 *           }
 */

(function () {
  var currentItem = {};
  var storage = null;
  var port;

  var defaults = {
    'Images': {
      'title': 'Images',
      'icon': 'drive-image',
      'enabled': true,
      'sources': {
        'Google Images': {
          title: 'Google Images',
          url: 'google.com',
          enabled: true
        },
        'Flickr': {
          title: 'Flickr',
          url: 'flickr.com',
          enabled: true
        }
      }
    },
    'Quotations': {
      'title': 'Quotations',
      'icon': 'editor:format-color-text',
      'enabled': false,
      'sources': {
        'iHeart Quotes': {
          title: 'iHeart Quotes',
          url: 'iheartquotes.com',
          enabled: false
        },
        'They said so': {
          title: 'They Said So!',
          url: 'theysaidso.com',
          enabled: false
        }
      }
    }
  };

  /* Uncomment to over write the sync storage */
  //chrome.storage.sync.remove(url);

  function loadSources(url,result) {
    if (result.hasOwnProperty(url)){
      console.log('EP-SOURCES-STORAGE:result:' + result[url]);
      currentItem[url] = result[url];

      dumpCurrentItem(url);

      var message = {
        component: 'sources',
        data: currentItem[url]
      };

     port.postMessage(message);
    } else {
      var obj = {};
      obj[url] = defaults;
      console.log('EP-SOURCES-STORAGE:Adding defaults');
      chrome.storage.sync.set(obj, function() {
        if (chrome.runtime.lastError) {
          console.log('EP-SOURCES-STORAGE:error storing defaults:' + chrome.runtime.lastError);
        }
      });
      chrome.storage.sync.get(url, function(result) {
        loadSources(url,result);
      });
    }
  }

  function dumpCurrentItem(url) {
    console.log('EP-SOURCES-STORAGE:Sources selection for:' + url);
    for (var key in currentItem[url]) {
      console.log('EP-SOURCES-STORAGE:Group Name:' + currentItem[url][key].title);
      console.log('EP-SOURCES-STORAGE:Enabled:' + currentItem[url][key].enabled);
      for (var src in currentItem[url][key].sources) {
        console.log('EP-SOURCES-STORAGE:source title:' + currentItem[url][key].sources[src].title);
        console.log('EP-SOURCES-STORAGE:source url:' + currentItem[url][key].sources[src].url);
        console.log('EP-SOURCES-STORAGE:source enabled:' + currentItem[url][key].sources[src].enabled);
      }
    }
  }

  chrome.runtime.onConnectExternal.addListener(function(newPort) {
    port = newPort;

    port.onMessage.addListener(function(message) {
      if (message.component === 'sources') {
        console.log('EP-SOURCES-STORAGE:got message:',message);
        var url = message.url;

        if (message.action === 'get') {

          if (!currentItem.hasOwnProperty(url)) {
            chrome.storage.sync.get(url, function(result) {
              loadSources(url,result);

            });
          } else {
            var message = {
              component: 'sources',
              data: currentItem[url]
            };
            port.postMessage(message);
          }

        } else
        if (message.action === 'set') {
        } else {
          console.error(new Error('EP-SOURCES-STORAGE:unknown action:'+message.action));
          var obj = {};
          obj[url] = message.data;
          chrome.storage.sync.set(obj, function() {
            if (chrome.runtime.lastError) {
              console.log('EP-SOURCES-STORAGE:error storing defaults:', chrome.runtime.lastError);
            }
          });
          chrome.storage.sync.get(url, function(result) {
            loadSources(url,result);
          });
        }

      }
    });
  });

  /**
   * TODO: take changes made on other machines
   */
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
      var storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. ' +
                  'Old value was "%s", new value is "%s".',
                  key,
                  namespace,
                  storageChange.oldValue,
                  storageChange.newValue);
    }
  });

})();
