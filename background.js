// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

try {
  importScripts('/cheerio-bundle.js');
} catch (e) {
  console.error('importScripts: ' + e);
}

// https://github.com/cheeriojs/cheerio
// let ch = cheerio.load('<ul id="fruits">pomme, fraise</ul>');
// let html = ch.html();

// https://stackoverflow.com/questions/70704283/how-to-use-localstorage-or-an-alternative-in-manifest-v3
const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async key => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({ [key]: val }),
  removeItems: keys => chrome.storage.local.remove(keys),
};

// import desabbreviate from "./abbreviations";

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

let abbreviations = [
  // { "abbr": "acc", "is": "?olfall", "en": "accusative" },
  // { "abbr": "adj", "is": "l?singaror?", "en": "adjective" },
  // { "abbr": "adj comp", "is": "l?singaror? ? mi?stigi", "en": "comparative adjective" },
  // { "abbr": "adj (dat)", "is": "l?singaror? sem tekur me? s?r ??gufall", "en": "adjective that governs the dative case" },
  // { "abbr": "adj indecl", "is": "?beygjanlegt l?singaror?", "en": "indeclinable adjective" },
  // { "abbr": "adj n", "is": "l?singaror? ? hvorugkyni", "en": "neuter adjective" },
  // { "abbr": "adj pl", "is": "l?singaror? ? fleirt?lu", "en": "plural adjective" },
  // { "abbr": "adj superl", "is": "l?singaror? ? efstastigi", "en": "superlative adjective" },
  // { "abbr": "adv", "is": "atviksor?", "en": "adverb" },
  // { "abbr": "adv comp", "is": "atviksor? ? mi?stigi", "en": "comparative adverb" },
  // { "abbr": "adv superl", "is": "atviksor? ? efstastigi", "en": "superlative adverb" },
  // { "abbr": "comp", "is": "mi?stig", "en": "comparative" },
  // { "abbr": "conj", "is": "samtenging", "en": "conjunction" },
  // { "abbr": "dat", "is": "??gufall", "en": "dative" },
  // { "abbr": "dat+acc", "is": "er merki vi? s?gn sem tekur me? s?r andlag ? ??gufalli og ?olfalli", "en": "indicates a verb with dative + accusative objects" },
  { "abbr": "e-a", "is": "einhverja", "en": "somebody (feminine)" },
  // { "abbr": "e-�", "is": "eitthva�", "en": "something" },
  { "abbr": "e-\u00f0", "is": "eitthva\u00f0", "en": "something" },
  { "abbr": "e-n", "is": "einhvern", "en": "somebody (masculine)" },
  { "abbr": "e-m", "is": "einhverjum", "en": "somebody" },
  { "abbr": "e-s", "is": "einhvers", "en": "somebody's" },
  { "abbr": "e-u", "is": "einhverju", "en": "something" },
  // { "abbr": "esp", "is": "einkum", "en": "especially" },
  // { "abbr": "f", "is": "kvenkyn/nafnor? ? kvenkyni", "en": "feminine/feminine noun" },
  // { "abbr": "f indecl", "is": "?beygjanlegt nafnor? ? kvenkyni", "en": "indeclinable feminine noun" },
  // { "abbr": "f pl", "is": "fleirt?lunafnor? ? kvenkyni", "en": "feminine plural noun" },
  // { "abbr": "gen", "is": "eignarfall", "en": "genitive" },
  // { "abbr": "impers", "is": "?pers?nuleg notkun", "en": "impersonal usage" },
  // { "abbr": "indic", "is": "frams?guh?ttur", "en": "indicative" },
  // { "abbr": "interj", "is": "upphr?pun", "en": "interjection" },
  // { "abbr": "m", "is": "karlkyn/nafnor? ? karlkyni", "en": "masculine/masculine noun" },
  // { "abbr": "m?lfr", "is": "m?lfr??i", "en": "grammar" },
  // { "abbr": "m pl", "is": "fleirt?lunafnor? ? karlkyni", "en": "masculine plural noun" },
  // { "abbr": "n", "is": "hvorugkyn/nafnor? ? hvorugkyni", "en": "neuter/neuter noun" },
  // { "abbr": "n indecl", "is": "?beygjanlegt nafnor?", "en": "indeclinable neuter noun" },
  // { "abbr": "n pl", "is": "fleirt?lunafnor? ? hvorugkyni", "en": "neuter plural noun" },
  // { "abbr": "num", "is": "t?luor?", "en": "numeral" },
  // { "abbr": "ofl", "is": "og fleira", "en": "and others" },
  // { "abbr": "pers", "is": "pers?na", "en": "person" },
  // { "abbr": "pl", "is": "fleirtala", "en": "plural" },
  // { "abbr": "poet", "is": "sk?ldskaparm?l", "en": "poetical/archaic" },
  // { "abbr": "pp", "is": "l?singarh?ttur ??t??ar", "en": "past participle" },
  // { "abbr": "prep", "is": "forsetning", "en": "preposition" },
  // { "abbr": "prep (acc)", "is": "forsetning sem st?rir ?olfalli", "en": "preposition that governs the accusative case" },
  // { "abbr": "prep (dat)", "is": "forsetning sem st?rir ??gufalli", "en": "preposition that governs the dative case" },
  // { "abbr": "prep (gen)", "is": "forsetning sem st?rir eignarfalli", "en": "preposition that governs the genitive case" },
  // { "abbr": "pron", "is": "fornafn", "en": "pronoun" },
  // { "abbr": "pron demon", "is": "?bendingarfornafn", "en": "demonstrative pronoun" },
  // { "abbr": "pron indef", "is": "??kve?i? fornafn", "en": "indefinite pronoun" },
  // { "abbr": "pron pl", "is": "fornafn ? fleirt?lu", "en": "pronoun plural" },
  // { "abbr": "pron poss", "is": "eignarfornafn", "en": "possessive pronoun" },
  // { "abbr": "pron refl", "is": "afturbeygt fornafn", "en": "reflexive pronoun" },
  // { "abbr": "prp", "is": "l?singarh?ttur n?t??ar", "en": "present participle" },
  // { "abbr": "refl", "is": "mi?mynd", "en": "reflexive, middle voice" },
  // { "abbr": "rel", "is": "tilv?sunaror?", "en": "relative" },
  // { "abbr": "sby", "is": "einhver", "en": "somebody" },
  // { "abbr": "sby's", "is": "einhvers/einhverrar", "en": "somebody's" },
  // { "abbr": "sg", "is": "eintala", "en": "singular" },
  // { "abbr": "skammst", "is": "skammst?fun", "en": "abbreviation" },
  // { "abbr": "sth", "is": "eitthva?", "en": "something" },
  // { "abbr": "st?r?fr", "is": "st?r?fr??i", "en": "mathematics" },
  // { "abbr": "UK", "is": "bresk stafsetning e?a m?lnotkun", "en": "British spelling or usage" },
  // { "abbr": "US", "is": "nor?uramer?sk stafsetning e?a m?lnotkun", "en": "N. American spelling or usage" },
  // { "abbr": "v aux", "is": "hj?lpars?gn", "en": "auxiliary verb" },
  // { "abbr": "v impers", "is": "?pers?nuleg s?gn", "en": "impersonal verb" },
  // { "abbr": "v refl", "is": "mi?myndars?gn", "en": "reflexive verb" }
]

let initAbbr = false;

// Credits https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegexp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function desabbreviate(html) {
  if (!initAbbr) {
    for (let i = 0; i < abbreviations.length; i++) {
      let a = abbreviations[i];
      let regex = new RegExp('(^| )(' + escapeRegexp(a.abbr) + ')( |$)', 'g');
      a.rx = regex;
    }
    initAbbr = true;
  }

  for (let i = 0; i < abbreviations.length; i++) {
    let a = abbreviations[i];
    // html = html.replace(a.rx, a.is);
    html = html.replace(a.rx, "$1<span class='abbr-is' title='" + a.is + " (" + a.en + ")'>$2</span>$3");
  }
  return html;
}

function findMorpho(morphoAnalysis, baseform) {
  for (let i = 0; i < morphoAnalysis.length; i++) {
    if (morphoAnalysis[i].baseform == baseform)
      return morphoAnalysis[i];
  }
  return null;
}

// query http://bin.arnastofnun.is/leit/ to get morpho(s)
// http://bin.arnastofnun.is/leit/?q=heiti
// http://dev.phpbin.ja.is/ajax_leit.php?q=heiti
// http://bin.arnastofnun.is/leit/?id=434170
async function getMorphos(form, firstQuery) {
  let encodedForm = encodeURIComponent(form);

  // let url = "http://dev.phpbin.ja.is/ajax_leit.php?q=" + encodedForm;
  // if (!firstQuery) {
  //   url = url + "&id=&ordmyndir=on";
  // }

  let url = "https://bin.arnastofnun.is/php_bin/ajaxleit2.php?q=" + encodedForm;
  if (!firstQuery) {
    url = url + "&ordmyndir=on";
  }

  let response = await fetch(url);
  if (!response.ok) {
    console.log("error: " + response.statusText);
    return []; // no analyses
  }

  // success
  let morphoAnalysis = [];
  let html = await response.text();
  let htmlDoc = cheerio.load(html);
  let lis = htmlDoc("ul li");
  lis.each(function (i, li) {
    let liCh = cheerio.load(li, null, false);
    let b = liCh("b");
    if (b.length == 0)
      return;

    let baseform = b.text();
    baseform = baseform.trim();
    let pos = liCh(".hinfo-ordflokkur").text();
    pos = pos.trim();

    let arnastofnunUrl = url;
    let a = cheerio.load(b[0], null, false)("a");
    if (a.length > 0) {
      let href = a.attr("href");
      if (href != null && href.length > 0) {
        arnastofnunUrl = "https://bin.arnastofnun.is" + href;
      }
    }

    let newMorpho = { baseform: baseform, pos: pos, url: arnastofnunUrl };
    let morpho = findMorpho(morphoAnalysis, baseform);
    if (morpho != null) {
      // duplicates probably have different part-of-speech, but subsequent dictionary lookup
      // will reflect that and return corresponding entries
      morpho.morphoanalysis.push(newMorpho);
    } else {
      morpho = { baseform: baseform, morphoanalysis: [newMorpho] };
      morphoAnalysis.push(morpho);
    }
  });

  if (lis.length == 0) {
    let h2s = htmlDoc(".page-header h2");
    if (h2s.length > 0) {
      let h2 = h2s[0];
      let baseform = h2.children.filter(function (node) {
        return node.nodeType == 3;
      })[0].nodeValue;
      baseform = baseform.trim();
      let small = cheerio.load(h2, null, false)("small .hinfo-ordflokkur");
      let pos = small.text();
      pos = pos.trim();
      // console.log("Analysis: " + baseform + " (" + pos + ")");
      // let arnastofnunUrl = "http://bin.arnastofnun.is/leit/?q=" + encodedForm;
      let arnastofnunUrl = "http://bin.arnastofnun.is/leit/" + encodedForm;
      if (!firstQuery) {
        // arnastofnunUrl = arnastofnunUrl + "&id=&ordmyndir=on";
        arnastofnunUrl = "https://bin.arnastofnun.is/leit/beygingarmynd/" + encodedForm;
      }
      let newMorpho = { baseform: baseform, pos: pos, url: arnastofnunUrl };
      let morpho = findMorpho(morphoAnalysis, baseform);
      if (morpho != null) {
        // duplicates probably have different part-of-speech, but subsequent dictionary lookup
        // will reflect that and return corresponding entries
        morpho.morphoanalysis.push(newMorpho);
      } else {
        morpho = { baseform: baseform, morphoanalysis: [newMorpho] };
        morphoAnalysis.push(morpho);
      }
    } else {
      // found nothing...
    }
  }

  return morphoAnalysis;
}

/*
  karlkynsnafnor\u00f0: m (pl)
  kvenkynsnafnor\u00f0: f (pl)
  hvorugkynsnafnor\u00f0: n (pl)
  sagnor\u00f0: v (acc), v, v refl, v impers 
  pers\u00f3nufornafn: ... pron ... (3rd pers m sg pron / 3rd pers f sg pron, acc pron refl, ...)
  l\u00fdsingaror\u00f0: adj
  t\u00f6luor\u00f0: num
  atviksor\u00f0: adv
  samtenging: conj
  upphr\u00f3pun: interj
  forsetning: prep 

  CF. https://bin.arnastofnun.is/DMII/infl-system/

  TODO: could be "/" in dict. lookup POS e.g. adj / adv
*/
function dictToMorphoPOS(dp) {
  if (dp === undefined)
    return [];

  if (dp.startsWith("prep"))
    return ["forsetning"];

  if (dp.startsWith("interj"))
    return ["upphr\u00f3pun"];

  if (dp.startsWith("conj"))
    return ["samtenging"];

  if (dp.startsWith("adv"))
    return ["atviksor\u00f0"];

  if (dp.startsWith("adj"))
    return ["l\u00fdsingaror\u00f0"];

  if (dp.startsWith("num"))
    return ["t\u00f6luor\u00f0", "ra\u00f0tala"];

  if (dp.includes("pron"))
    return ["pers\u00f3nufornafn", "afturbeygt fornafn", "spurnarfornafn", "\u00e1bendingarfornafn", "\u00f3\u00e1kve\u00f0i\u00f0 \u00e1bendingarfornafn", "\u00f3\u00e1kve\u00f0i\u00f0 fornafn", "eignarfornafn", "afturbeygt eignarfornafn"];

  if (dp.startsWith("m"))
    return ["karlkynsnafnor\u00f0", "karlmannsnafn"];

  if (dp.startsWith("f"))
    return ["kvenkynsnafnor\u00f0", "kvennafn"];

  if (dp.startsWith("n"))
    return ["hvorugkynsnafnor\u00f0"];

  if (dp.startsWith("v"))
    return ["sagnor\u00f0"];

  /*
  What about mp:
  greinir
  nafnh�ttarmerki

  What about dp:
  in compounds
  */

  return [];
}

// query https://digicoll.library.wisc.edu/IcelOnline for dictionary entries
async function getDictionaryEntries(dictionaryLookup, givenUrl) {
  let morpho = dictionaryLookup.morphos[0];
  let baseform = morpho.baseform;
  let morphoPOS = new Set();
  if (morpho.morphoanalysis) {
    for (let i = 0; i < morpho.morphoanalysis.length; i++) {
      morphoPOS.add(morpho.morphoanalysis[i].pos);
    }
  }

  // the url needs escape-encoding, not encodeURIComponent-encoding (tested with ?kve?a)
  let url;
  if (givenUrl) {
    url = givenUrl;
  } else {
    //url = "https://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=simple&size=First+100&rgn=lemma&q1=" + escape(baseform) + "&submit=Search";
    // encodeURI is better for accents e.g. "f�"
    url = "https://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=simple&size=First+100&rgn=lemma&q1=" + encodeURI(baseform) + "&submit=Search";
  }

  let response = await fetch(url);
  if (!response.ok) {
    console.log("error: " + response.statusText);
    return []; // no urls returned
  }

  // success
  let newUrls = [];
  let html = await response.text();
  let htmlDoc = cheerio.load(html);
  let entryElements = htmlDoc(".entry");
  if (entryElements.length > 0) {
    processDictionaryEntryElements(dictionaryLookup, entryElements, url, newUrls);
  } else {
    let nestlevels = htmlDoc(".nestlevel"); // e.g. vegna
    let count = 0;
    if (nestlevels.length > 0) {
      nestlevels.each(function (i, nl) {
        let nlCh = cheerio.load(nl, null, false);
        let href = nlCh(".lemma a[href^='/cgi-bin/IcelOnline']");
        let refUrl = "https://digicoll.library.wisc.edu" + href.attr("href");

        // TODO factorization of morphoPOS vs. dictPOS matching to keep only
        // relevant dict entries
        // See oneResultForLemma
        let pos = nlCh(".pos").text();
        let dictPOS = pos.split("/").map(item => item.trim()).filter(item => item.length > 0);
        dictPOS.forEach(function (dp) {
          let mps = dictToMorphoPOS(dp);
          let posOk = false;
          if (mps.length == 0) {
            console.log("[getDictionaryEntries] No POS mapping for: " + pos + " (" + dp + ")");
          } else {
            mps.forEach(function (mp) {
              if (morphoPOS.has(mp)) {
                posOk = true;
              }
            });
          }
          if (posOk) {
            // getDictionaryEntriesRef(dictionaryLookup, refUrl);
            newUrls.push(refUrl);
            count++;
          }
        });
      });
    }
    if (count == 0) {
      noResultForLemma(dictionaryLookup);
    }
    // let hrefs = $(".nestlevel .lemma a[href^='/cgi-bin/IcelOnline']", htmlDoc); // e.g. for vegna
    // if (hrefs.length > 0) {
    //   hrefs.each(function () {
    //     let refUrl = "https://digicoll.library.wisc.edu" + $(this).attr("href");
    //     // getDictionaryEntriesRef(dictionaryLookup, refUrl);
    //     newUrls.push(refUrl);
    //   });
    // } else {
    //   noResultForLemma(dictionaryLookup);
    // }
  }

  return newUrls;
}

function processDictionaryEntryElements(dictionaryLookup, entryElements, fromUrl, newUrls) {
  let morpho = dictionaryLookup.morphos[0];
  let baseform = morpho.baseform;

  entryElements.each(function (i, entryElement) {
    let entryElementCh = cheerio.load(entryElement, null, false);
    let hrefs = entryElementCh(".ref a[href^='/cgi-bin/IcelOnline']"); // e.g. for veitingasta?ur
    if (hrefs.length == 0) {
      oneResultForLemma(dictionaryLookup, entryElementCh, fromUrl);
    } else {
      hrefs.each(function () {
        let refUrl = "https://digicoll.library.wisc.edu" + this.attr("href");
        // getDictionaryEntriesRef(dictionaryLookup, refUrl);
        newUrls.push(refUrl);
      });
    }
  });
  if (entryElements.length == 0) {
    noResultForLemma(dictionaryLookup);
  }
}

function oneResultForLemma(dictionaryLookup, entryElementCh, url) {
  let morpho = dictionaryLookup.morphos[0];
  let baseform = morpho.baseform;

  let morphoPOS = new Set();
  if (morpho.morphoanalysis) {
    for (let i = 0; i < morpho.morphoanalysis.length; i++) {
      morphoPOS.add(morpho.morphoanalysis[i].pos);
    }
  }

  let headwdObj = entryElementCh(".headwd > .lemma");
  let headwd = "???";
  if (headwdObj.length > 0) {
    headwd = headwdObj[0].children.filter(function (node) {
      return node.nodeType == 3;
    })[0].nodeValue;
  }

  // TODO factorization of morphoPOS vs. dictPOS matching to keep only
  // relevant dict entries
  // See getDictionaryEntries
  let gramObjs = entryElementCh(".headwd > .graminfl > .gram");
  let dictPOS = [];
  for (let ii = 0; ii < gramObjs.length; ii++) {
    let pos = cheerio.load(gramObjs[ii], null, false).text();
    dictPOS.push(pos.trim());
  }
  let posOk = false;
  dictPOS.forEach(function (dp) {
    let mps = dictToMorphoPOS(dp);
    if (mps.length == 0) {
      // console.log("[oneResultForLemma] No POS mapping for: " + dp);
    } else {
      mps.forEach(function (mp) {
        if (morphoPOS.has(mp)) {
          posOk = true;
        }
      });
    }
  });

  if (posOk) {
    // let regex = new RegExp('\\/', 'g');
    // headwd = headwd.replace(regex, ''); // e.g. "tal/a" => "tala"

    enrichIcelandic(headwd, entryElementCh);

    let entry = { html: entryElementCh.html(), hw: headwd, url: url, source: "uwdc" };

    // enrichHeadword(entry);

    let exist = dictionaryLookup.entries.find(e => e.html == entry.html);
    if (!exist) {
      dictionaryLookup.entries.push(entry);
    }
  }
}

// Credits https://coderwall.com/p/ostduq/escape-html-with-javascript

// List of HTML entities for escaping.
let htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

// Regex containing the keys listed immediately above.
let htmlEscaper = /[&<>"'\/]/g;

// Escape a string for HTML interpolation.
function htmlEscape(string) {
  return ('' + string).replace(htmlEscaper, function (match) {
    return htmlEscapes[match];
  });
}

function enrichIcelandic(headwd, htmlObj) {
  let hwFull = headwd;

  // search for '/' or '.' headword separator (see https://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=HTML&rgn=DIV1&id=IcelOnline.IEOrd&target=IcelOnline.IEOrd.Guide)
  let separatorPos = hwFull.indexOf('/');
  if (separatorPos == -1) {
    separatorPos = hwFull.indexOf('.');
  }
  if (separatorPos != -1) {
    let regex = new RegExp('\\/|\\.', 'g');
    hwFull = hwFull.replace(regex, ''); // e.g. "tal/a" => "tala"
  }

  let regexFull = /(~~)/g;
  let enrichmentFull = "<span class='hw-placeholder'>$1</span><span class='hw-actual'>" + htmlEscape(hwFull) + "</span>";
  let regexBeforeSeparator = /(~)/g;
  let hwBeforeSeparator = headwd;
  if (separatorPos != -1) {
    hwBeforeSeparator = hwBeforeSeparator.substring(0, separatorPos);
  }
  let enrichmentBeforeSeparator = "<span class='hw-placeholder'>$1</span><span class='hw-actual'>" + htmlEscape(hwBeforeSeparator) + "</span>";

  htmlObj(".orth, .usg").each(function (index) {
    let obj = this;
    let html = obj.html();
    let enrichedHtml = html.replace(regexFull, enrichmentFull); // tala, segja, sj?n, ...
    enrichedHtml = enrichedHtml.replace(regexBeforeSeparator, enrichmentBeforeSeparator); // tala, segja, sj?n
    enrichedHtml = desabbreviate(enrichedHtml);
    obj.html(enrichedHtml);
  });
}

function enrichHeadword(entry) {
  let hwFull = entry.hw;

  // search for '/' or '.' headword separator (see https://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=HTML&rgn=DIV1&id=IcelOnline.IEOrd&target=IcelOnline.IEOrd.Guide)
  let separatorPos = hwFull.indexOf('/');
  if (separatorPos == -1) {
    separatorPos = hwFull.indexOf('.');
  }
  if (separatorPos != -1) {
    let regex = new RegExp('\\/|\\.', 'g');
    hwFull = hwFull.replace(regex, ''); // e.g. "tal/a" => "tala"
  }

  let regexFull = /(~~)/g;
  let enrichmentFull = "<span class='hw-placeholder'>$1</span><span class='hw-actual'>" + htmlEscape(hwFull) + "</span>";
  let html = entry.html;
  let enrichedHtml = html.replace(regexFull, enrichmentFull); // tala, segja, sj?n, ...

  let hwBeforeSeparator = entry.hw;
  if (separatorPos != -1) {
    hwBeforeSeparator = hwBeforeSeparator.substring(0, separatorPos);
  }
  let regexBeforeSeparator = /(~)/g;
  let enrichmentBeforeSeparator = "<span class='hw-placeholder'>$1</span><span class='hw-actual'>" + htmlEscape(hwBeforeSeparator) + "</span>";
  enrichedHtml = enrichedHtml.replace(regexBeforeSeparator, enrichmentBeforeSeparator); // tala, segja, sj?n

  entry.html = enrichedHtml;
}

function noResultForLemma(dictionaryLookup) {
}

async function morphoAnalysis(surfaceForm) {
  surfaceForm = surfaceForm.replace(/\u00AD/g, ''); // &shy; (plenty of them on https://www.mbl.is/frettir/)
  surfaceForm = surfaceForm.trim();

  // issuing http $.get from https (icelandiconline.com...) triggers a mixed-content error
  // tried to add permissions in manifest.json, with no success:
  // "http://dev.phpbin.ja.is/ajax_leit.php*", "https://digicoll.library.wisc.edu*"
  //
  // instead the actual processing may take place in background.js + using messages from content-to-background then
  // from background-to-js ???
  //
  // => https://developer.chrome.com/extensions/messaging

  // let morphos = await getMorphos(surfaceForm, true);
  // if (morphos.length == 0) {
  //   morphos = await getMorphos(surfaceForm, false);
  // }
  let morphos = await getMorphos(surfaceForm, false);

  return morphos;
}

async function dictionaryLookup(morphos) {
  let dictionaryLookupResult = [];

  for (let i = 0; i < morphos.length; i++) {
    let morpho = morphos[i];
    let dictionaryLookup = {};
    dictionaryLookup.morphos = [morpho];
    dictionaryLookup.entries = [];

    dictionaryLookupResult.push(dictionaryLookup);

    let newUrls = await getDictionaryEntries(dictionaryLookup);
    if (newUrls.length > 0) {
      for (let j = 0; j < newUrls.length; j++) {
        let newUrl = newUrls[j];
        let newUrls2 = await getDictionaryEntries(dictionaryLookup, newUrl);
        if (newUrls2.length > 0) {
          for (let j2 = 0; j2 < newUrls2.length; j2++) {
            let newUrl2 = newUrls2[j2];
            /*let newUrls3 =*/ await getDictionaryEntries(dictionaryLookup, newUrl2);
          }
        }
      }
    }
  }

  return dictionaryLookupResult;
}

async function doMorphoAnalysis(surfaceForm, sendResponse) {
  let morphos = await morphoAnalysis(surfaceForm);
  sendResponse(morphos);
}

async function doDictionaryLookup(morphos, sendResponse) {
  let dictionaryLookupResult = await dictionaryLookup(morphos);

  // let googleTranslateResult = await googleTranslate(morphos);
  // for (let i = 0; i < googleTranslateResult.length; i++) {
  //   dictionaryLookupResult.push(googleTranslateResult[i]);
  // }

  sendResponse(dictionaryLookupResult);
}

// async function doGoogleTranslate(morphos, sendResponse) {
//   let dictionaryLookupResult = await googleTranslate(morphos);
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
  options.sidebarStatus = "on"; // localStorage['sidebarStatus'];
  if (options.sidebarStatus != "on") {
    options.sidebarStatus = "off";
  }
  options.autoHelpSelection = "on"; // localStorage['autoHelpSelection'];
  if (options.autoHelpSelection != "on") {
    options.autoHelpSelection = "off";
  }
  options.darkMode = "on"; // localStorage['darkMode'];
  if (options.darkMode != "on") {
    options.darkMode = "off";
  }
  options.googleTranslate = "off"; // localStorage['googleTranslate'];
  if (options.googleTranslate != "on") {
    options.googleTranslate = "off";
  }
  options.googleTranslateTarget = "fr"; // localStorage['googleTranslateTarget'];
  if (!options.googleTranslateTarget) {
    options.googleTranslateTarget = "en";
  }
  return options;
}

function setOptions(options) {
  if (options.sidebarStatus) {
    if (options.sidebarStatus == "on") {
      // localStorage['sidebarStatus'] = "on";
    } else {
      // localStorage['sidebarStatus'] = "off";
    }
  }

  if (options.autoHelpSelection == "on") {
    // localStorage['autoHelpSelection'] = "on";
  } else {
    // localStorage['autoHelpSelection'] = "off";
  }

  if (options.googleTranslate) {
    if (options.googleTranslate == "on") {
      // localStorage['googleTranslate'] = "on";
    } else {
      // localStorage['googleTranslate'] = "off";
    }
  }

  if (options.darkMode) {
    if (options.darkMode == "on") {
      // localStorage['darkMode'] = "on";
    } else {
      // localStorage['darkMode'] = "off";
    }
  }

  if (options.googleTranslateTarget) {
    // localStorage['googleTranslateTarget'] = options.googleTranslateTarget;
  }
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.method == "morphoAnalysis") {
      doMorphoAnalysis(request.surfaceForm, sendResponse);
      return true;
    } else if (request.method == "dictionaryLookup") {
      doDictionaryLookup(request.morphos, sendResponse);
      return true;
    } else if (request.method == "getSidebarStatus") {
      let sidebarStatus = "on"; // localStorage['sidebarStatus'];
      sendResponse({ sidebarStatus: sidebarStatus });
    } else if (request.method == "setSidebarStatus") {
      let sidebarStatus = request.param;
      // localStorage['sidebarStatus'] = sidebarStatus;
      sendResponse({});
    } else if (request.method == "getOptions") {
      let options = getOptions();
      sendResponse({ options });
    } else if (request.method == "setOptions") {
      setOptions(request.options);
      sendResponse({});
    } else if (request.method == "showMorphoAnalysis") {
      console.log("background.js onMessage showMorphoAnalysis " + request.url);
      // var iframe = document.createElement('iframe');
      // var html = '<body>Foo</body>';
      // // iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
      // iframe.src = 'https://bin.arnastofnun.is/beyging/469289';
      // document.body.appendChild(iframe);
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
https://translate.google.fr/translate_a/single?client=webapp&sl=is&tl=fr&hl=fr&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&pc=1&otf=1&ssel=0&tsel=0&kc=1&tk=342556.242781&q=P?sth?sstr?ti ver?ur loka? fyrir b?laumfer? ? dag og um helgina vegna ve?urs. Reykjav?kurborg hefur ?kve?i? a? loka g?tunni ? g??a ve?rinu

https://stackoverflow.com/questions/22936421/google-translate-iframe-workaround

https://gist.github.com/carolineschnapp/806456
*/
////});
