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

function lemmaExists(lemmas, baseform) {
  for (let i = 0; i < lemmas.length; i++) {
    if (lemmas[i].baseform == baseform)
      return true;
  }
  return false;
}

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
        let baseform = a.text();
        baseform = baseform.trim();
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
          // console.log("Analysis " + i + ": " + baseform + " (" + pos + ") " + url2);
        }
        if (!lemmaExists(lemmas, baseform)) {
          // duplicates probably have different part-of-speech, but subsequent dictionary lookup 
          // will reflect that and return corresponding entries
          let lemma = { baseform: baseform, url: url2 }
          lemmas.push(lemma);
        }
      });

      if (lis.length == 0) {
        let h2s = $(".page-header h2", htmlDoc);
        if (h2s.length > 0) {
          let h2 = h2s[0];
          let baseform = $(h2).contents().filter(function () {
            return this.nodeType == 3;
          })[0].nodeValue;
          baseform = baseform.trim();
          let small = $("small", h2);
          let pos = small.text();
          pos = pos.trim();
          // console.log("Analysis: " + baseform + " (" + pos + ")");
          let arnastofnunUrl = "http://bin.arnastofnun.is/leit/?q=" + encodeURIComponent(form);
          if (!lemmaExists(lemmas, baseform)) {
            // duplicates probably have different part-of-speech, but subsequent dictionary lookup 
            // will reflect that and return corresponding entries
            let lemma = { baseform: baseform, url: arnastofnunUrl }
            lemmas.push(lemma);
          }
        } else {
          // found nothing...
        }
      }
    });
  } catch (error) {
    console.log("error: " + error);
  }

  return lemmas;
}

// query http://digicoll.library.wisc.edu/IcelOnline for dictionary entries
async function getDictionaryEntries(dictionaryLookup, givenUrl) {
  let lemma = dictionaryLookup.lemma;
  let baseform = lemma.baseform;

  let newUrls = [];

  // the url needs escape-encoding, not encodeURIComponent-encoding (tested with ákveða)
  let url;
  if (givenUrl) {
    url = givenUrl;
  } else {
    url = "http://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=simple&size=First+100&rgn=lemma&q1=" + escape(baseform) + "&submit=Search";
  }

  try {
    let jqxhr = await $.get(url, function (data) {
      // success
      let parser = new DOMParser();
      let htmlDoc = parser.parseFromString(data, "text/html");
      let entryElements = $(".entry", htmlDoc);
      if (entryElements.length > 0) {
        processDictionaryEntryElements(dictionaryLookup, entryElements, url, newUrls);
      } else {
        let hrefs = $(".nestlevel .lemma a[href^='/cgi-bin/IcelOnline']", htmlDoc); // e.g. for vegna
        if (hrefs.length > 0) {
          hrefs.each(function () {
            let refUrl = "http://digicoll.library.wisc.edu" + $(this).attr("href");
            // getDictionaryEntriesRef(dictionaryLookup, refUrl);
            newUrls.push(refUrl);
          });
        } else {
          noResultForLemma(dictionaryLookup);
        }
      }
    });
  } catch (error) {
    console.log("error: " + error);
  }

  return newUrls;
}

function processDictionaryEntryElements(dictionaryLookup, entryElements, fromUrl, newUrls) {
  let lemma = dictionaryLookup.lemma;
  let baseform = lemma.baseform;

  entryElements.each(function () {
    // console.log("Dictionary entry:\n" + $(this).html());
    let hrefs = $(".ref a[href^='/cgi-bin/IcelOnline']", this); // e.g. for veitingastaður
    if (hrefs.length == 0) {
      oneResultForLemma(dictionaryLookup, $(this), fromUrl);
    } else {
      hrefs.each(function () {
        let refUrl = "http://digicoll.library.wisc.edu" + $(this).attr("href");
        // getDictionaryEntriesRef(dictionaryLookup, refUrl);
        newUrls.push(refUrl);
      });
    }
  });
  if (entryElements.length == 0) {
    noResultForLemma(dictionaryLookup);
  }
}

// async function getDictionaryEntriesRef(dictionaryLookup, refUrl) {
//   let lemma = dictionaryLookup.lemma;
//   let baseform = lemma.baseform;

//   try {
//     let jqxhr = await $.get(refUrl, function (data) {
//       // success
//       let parser = new DOMParser();
//       let htmlDoc = parser.parseFromString(data, "text/html");
//       let entryElements = $(".entry", htmlDoc);
//       processDictionaryEntryElements(dictionaryLookup, entryElements, refUrl);
//     });
//   } catch (error) {
//     console.log("error: " + error);
//   }
//   return true;
// }

function oneResultForLemma(dictionaryLookup, htmlObj, url) {
  let lemma = dictionaryLookup.lemma;
  let baseform = lemma.baseform;

  let headwdObj = $(".headwd > .lemma", htmlObj);
  let headwd = "???";
  if (headwdObj.length > 0) {
    headwd = headwdObj.contents().filter(function () {
      return this.nodeType == 3;
    })[0].nodeValue;
  }

  // let regex = new RegExp('\\/', 'g');
  // headwd = headwd.replace(regex, ''); // e.g. "tal/a" => "tala"

  let entry = { html: htmlObj.html(), hw: headwd, url: url, source: "uwdc" };
  dictionaryLookup.entries.push(entry);
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

    let newUrls = await getDictionaryEntries(dictionaryLookup);
    if (newUrls.length > 0) {
      for (let j = 0; j < newUrls.length; j++) {
        let newUrl = newUrls[j];
        await getDictionaryEntries(dictionaryLookup, newUrl);
      }
    }
  }

  return dictionaryLookupResult;
}

async function googleTranslate(lemmas) {
  let dictionaryLookupResult = [];

  for (let i = 0; i < lemmas.length; i++) {
    let lemma = lemmas[i];
    let dictionaryLookup = {};
    dictionaryLookup.lemma = lemma;
    dictionaryLookup.entries = [];

    dictionaryLookupResult.push(dictionaryLookup);

    let url = "https://translate.google.fr/translate_a/single?client=webapp&sl=is&tl=fr&hl=fr&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&pc=1&otf=1&ssel=0&tsel=0&kc=1&tk=342556.242781&q=" + escape(lemma.baseform);

    try {
      let jqxhr = await $.get(url, function (data) {
        // success
        console.log("google translate: " + data);
        // let htmlDoc = parser.parseFromString(data, "text/html");
        // let entryElements = $(".entry", htmlDoc);
        // if (entryElements.length > 0) {
        //   processDictionaryEntryElements(dictionaryLookup, entryElements, url, newUrls);
        // } else {
        //   let hrefs = $(".nestlevel .lemma a[href^='/cgi-bin/IcelOnline']", htmlDoc); // e.g. for vegna
        //   if (hrefs.length > 0) {
        //     hrefs.each(function () {
        //       let refUrl = "http://digicoll.library.wisc.edu" + $(this).attr("href");
        //       // getDictionaryEntriesRef(dictionaryLookup, refUrl);
        //       newUrls.push(refUrl);
        //     });
        //   } else {
        //     noResultForLemma(dictionaryLookup);
        //   }
        // }
      });
    } catch (error) {
      console.log("error: " + error);
    }
  }

  return dictionaryLookupResult;
}

async function doDisambiguation(surfaceForm, sendResponse) {
  let lemmas = await disambiguation(surfaceForm);
  sendResponse(lemmas);
}

async function doDictionaryLookup(lemmas, sendResponse) {
  let dictionaryLookupResult = await dictionaryLookup(lemmas);

  // let googleTranslateResult = await googleTranslate(lemmas);
  // for (let i = 0; i < googleTranslateResult.length; i++) {
  //   dictionaryLookupResult.push(googleTranslateResult[i]);
  // }

  sendResponse(dictionaryLookupResult);
}

// async function doGoogleTranslate(lemmas, sendResponse) {
//   let dictionaryLookupResult = await googleTranslate(lemmas);
//   sendResponse(dictionaryLookupResult);
// }

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

function getOptions() {
  let options = {};
  options.sidebarStatus = localStorage['sidebarStatus'];
  if (options.sidebarStatus != "on") {
    options.sidebarStatus = "off";
  }
  options.googleTranslate = localStorage['googleTranslate'];
  if (options.googleTranslate != "on") {
    options.googleTranslate = "off";
  }
  options.googleTranslateTarget = localStorage['googleTranslateTarget'];
  if (!options.googleTranslateTarget) {
    options.googleTranslateTarget = "en";
  }
  return options;
}

function setOptions(options) {
  if (options.sidebarStatus) {
    if (options.sidebarStatus == "on") {
      localStorage['sidebarStatus'] = "on";
    } else {
      localStorage['sidebarStatus'] = "off";
    }
  }

  if (options.googleTranslate) {
    if (options.googleTranslate == "on") {
      localStorage['googleTranslate'] = "on";
    } else {
      localStorage['googleTranslate'] = "off";
    }
  }

  if (options.googleTranslateTarget) {
    localStorage['googleTranslateTarget'] = options.googleTranslateTarget;
  }
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.method == "disambiguation") {
      doDisambiguation(request.surfaceForm, sendResponse);
      return true;
    } else if (request.method == "dictionaryLookup") {
      doDictionaryLookup(request.lemmas, sendResponse);
      return true;
    } else if (request.method == "getSidebarStatus") {
      let sidebarStatus = localStorage['sidebarStatus'];
      sendResponse({ sidebarStatus: sidebarStatus });
    } else if (request.method == "setSidebarStatus") {
      let sidebarStatus = request.param;
      localStorage['sidebarStatus'] = sidebarStatus;
      sendResponse({});
    } else if (request.method == "getOptions") {
      let options = getOptions();
      sendResponse({ options: options });
    } else if (request.method == "setOptions") {
      setOptions(request.options);
      sendResponse({});
    } else {
      // console.log(sender.tab ?
      //   "from a content script:" + sender.tab.url :
      //   "from the extension");
      // sendResponse({ data: "provide help about: " + request.surfaceForm });
    }
  });

  // google translate:
/*
https://translate.google.fr/translate_a/single?client=webapp&sl=is&tl=fr&hl=fr&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&pc=1&otf=1&ssel=0&tsel=0&kc=1&tk=342556.242781&q=Pósthússtræti verður lokað fyrir bílaumferð í dag og um helgina vegna veðurs. Reykjavíkurborg hefur ákveðið að loka götunni í góða veðrinu

https://stackoverflow.com/questions/22936421/google-translate-iframe-workaround

https://gist.github.com/carolineschnapp/806456
*/
////});
