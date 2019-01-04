// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

////chrome.runtime.onInstalled.addListener(function () {
// chrome.storage.sync.set({ color: '#3aa757' }, function () {
//   console.log("The color is green.");
// });

// let changeColor = document.getElementById('changeColor');

// chrome.storage.sync.get('color', function (data) {
//     changeColor.style.backgroundColor = data.color;
//     changeColor.setAttribute('value', data.color);
// });

// changeColor.onclick = function (element) {
//     let color = element.target.value;
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//         chrome.tabs.executeScript(
//             tabs[0].id,
//             { code: 'document.body.style.backgroundColor = "' + color + '";' });
//     });
// };

// query http://bin.arnastofnun.is/leit/ to get lemma(s)
// http://bin.arnastofnun.is/leit/?q=heiti
// http://dev.phpbin.ja.is/ajax_leit.php?q=heiti
// http://bin.arnastofnun.is/leit/?id=434170
async function getLemmas(form, firstQuery) {
  let lemmas = [];

  let url = "http://dev.phpbin.ja.is/ajax_leit.php?q=" + encodeURIComponent(form);
  if (!firstQuery) {
    url = url + "&id=&ordmyndir=on";
  }

  try {
    let jqxhr = await $.get(url, function (data) {
      // success
      let parser = new DOMParser();
      let htmlDoc = parser.parseFromString(data, "text/html");
      let lis = $("ul li", htmlDoc);
      lis.each(function (i) {
        let a = $("a", this);
        let lemma = a.text();
        lemma = lemma.trim();
        let pos = $(this).contents().filter(function () {
          return this.nodeType == 3;
        })[0].nodeValue;
        pos = pos.trim();
        let onclick = a[0].getAttribute("onclick");
        let regex = /'(\d+)'/gm;
        let m = regex.exec(onclick);
        let url2 = url;
        if (m !== null) {
          let id = m[1];
          url2 = "http://bin.arnastofnun.is/leit/?id=" + id
          // console.log("Analysis " + i + ": " + lemma + " (" + pos + ") " + url2);
        }
        let analysis = { lemma: lemma, url: url2 }
        lemmas.push(analysis);
      });

      if (lis.length == 0) {
        let h2s = $(".page-header h2", htmlDoc);
        if (h2s.length > 0) {
          let h2 = h2s[0];
          let lemma = $(h2).contents().filter(function () {
            return this.nodeType == 3;
          })[0].nodeValue;
          lemma = lemma.trim();
          let small = $("small", h2);
          let pos = small.text();
          pos = pos.trim();
          // console.log("Analysis: " + lemma + " (" + pos + ")");
          let arnastofnunUrl = "http://bin.arnastofnun.is/leit/?q=" + encodeURIComponent(form);
          let analysis = { lemma: lemma, url: arnastofnunUrl }
          lemmas.push(analysis);
        } else {
          // found nothing...
        }
      }
    });
  } catch (error) {
    console.error(error);
  }

  return lemmas;
}

// query http://digicoll.library.wisc.edu/IcelOnline for dictionary entries
async function getDictionaryEntries(dictionaryLookup) {
  let lemmaAnalysis = dictionaryLookup.lemma;
  let lemma = lemmaAnalysis.lemma;

  // the url needs escape-encoding, not encodeURIComponent-encoding (tested with ákveða)
  let url = "http://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=simple&size=First+100&rgn=lemma&q1=" + escape(lemma) + "&submit=Search";

  try {
    let jqxhr = await $.get(url, function (data) {
      // success
      let parser = new DOMParser();
      let htmlDoc = parser.parseFromString(data, "text/html");
      let entryElements = $(".entry", htmlDoc);
      if (entryElements.length > 0) {
        processDictionaryEntryElements(dictionaryLookup, entryElements);
      } else {
        let hrefs = $(".nestlevel .lemma a[href^='/cgi-bin/IcelOnline']", htmlDoc); // e.g. for vegna
        if (hrefs.length > 0) {
          hrefs.each(function () {
            let refUrl = "http://digicoll.library.wisc.edu" + $(this).attr("href");
            getDictionaryEntriesRef(dictionaryLookup, refUrl);
          });
        } else {
          noResultForLemma(dictionaryLookup);
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
}

function processDictionaryEntryElements(dictionaryLookup, entryElements) {
  let lemmaAnalysis = dictionaryLookup.lemma;
  let lemma = lemmaAnalysis.lemma;

  entryElements.each(function () {
    // console.log("Dictionary entry:\n" + $(this).html());
    let hrefs = $(".ref a[href^='/cgi-bin/IcelOnline']", this); // e.g. for veitingastaður
    if (hrefs.length == 0) {
      oneResultForLemma(dictionaryLookup, $(this));
    } else {
      hrefs.each(function () {
        let refUrl = "http://digicoll.library.wisc.edu" + $(this).attr("href");
        getDictionaryEntriesRef(dictionaryLookup, refUrl);
      });
    }
  });
  if (entryElements.length == 0) {
    noResultForLemma(dictionaryLookup);
  }
}

async function getDictionaryEntriesRef(dictionaryLookup, refUrl) {
  let lemmaAnalysis = dictionaryLookup.lemma;
  let lemma = lemmaAnalysis.lemma;

  try {
    let jqxhr = await $.get(refUrl, function (data) {
      // success
      let parser = new DOMParser();
      let htmlDoc = parser.parseFromString(data, "text/html");
      let entryElements = $(".entry", htmlDoc);
      processDictionaryEntryElements(dictionaryLookup, entryElements);
    });
  } catch (error) {
    console.error(error);
  }
}

function oneResultForLemma(dictionaryLookup, htmlObj) {
  let lemmaAnalysis = dictionaryLookup.lemma;
  let lemma = lemmaAnalysis.lemma;

  dictionaryLookup.entries.push(htmlObj.html());
}

function noResultForLemma(dictionaryLookup) {
}

async function disambiguation(surfaceForm) {
  surfaceForm = surfaceForm.replace(/\u00AD/g, ''); // &shy; (plenty of them on https://www.mbl.is/frettir/)
  surfaceForm = surfaceForm.trim();

  // issuing http $.get from https (icelandiconline.com...) triggers a mixed-content error
  // tried to add permissions in manifest.json, with no success:
  // "http://dev.phpbin.ja.is/ajax_leit.php*", "http://digicoll.library.wisc.edu*"
  //
  // instead the actual processing may take place in background.js + using messages from content-to-background then
  // from background-to-js ???
  //
  // => https://developer.chrome.com/extensions/messaging

  let lemmas = await getLemmas(surfaceForm, true);
  if (lemmas.length == 0) {
    lemmas = await getLemmas(surfaceForm, false);
  }

  return lemmas;
}

async function dictionaryLookup(lemmas) {
  let dictionaryLookupResult = [];

  for (let i = 0; i < lemmas.length; i++) {
    let lemma = lemmas[i];
    let dictionaryLookup = {};
    dictionaryLookup.lemma = lemma;
    dictionaryLookup.entries = [];

    dictionaryLookupResult.push(dictionaryLookup);

    await getDictionaryEntries(dictionaryLookup);
  }

  return dictionaryLookupResult;
}

async function doDisambiguation(surfaceForm, sendResponse) {
  let lemmas = await disambiguation(surfaceForm);
  sendResponse(lemmas);
}

async function doDictionaryLookup(lemmas, sendResponse) {
  let dictionaryLookupResult = await dictionaryLookup(lemmas);
  sendResponse(dictionaryLookupResult);
}

chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher({
      pageUrl: { hostSuffix: '.is' },
    })
    ],
    actions: [new chrome.declarativeContent.ShowPageAction()]
  }, {
    conditions: [new chrome.declarativeContent.PageStateMatcher({
      pageUrl: { hostEquals: 'icelandiconline.com' },
    })
    ],
    actions: [new chrome.declarativeContent.ShowPageAction()]
  }]);
});

if (chrome.browserAction) {
  chrome.browserAction.onClicked.addListener(function () {
    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //   chrome.tabs.sendMessage(tabs[0].id, "toggle");
    // })
  });
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.method == "disambiguation") {
      doDisambiguation(request.surfaceForm, sendResponse);
      return true;
    } if (request.method == "dictionaryLookup") {
      doDictionaryLookup(request.lemmas, sendResponse);
      return true;
    } if (request.method == "getSidebarStatus") {
      let sidebarStatus = localStorage['sidebarStatus'];
      sendResponse({ sidebarStatus: sidebarStatus });
    } if (request.method == "setSidebarStatus") {
      let sidebarStatus = request.param;
      localStorage['sidebarStatus'] = sidebarStatus;
      sendResponse({});
    } else {
      // console.log(sender.tab ?
      //   "from a content script:" + sender.tab.url :
      //   "from the extension");
      // sendResponse({ data: "provide help about: " + request.surfaceForm });
    }
  });
////});
