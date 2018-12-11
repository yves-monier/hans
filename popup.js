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
                if (m !== null) {
                    let id = m[1];
                    let url2 = "http://bin.arnastofnun.is/leit/?id=" + id
                    // console.log("Analysis " + i + ": " + lemma + " (" + pos + ") " + url2);
                }
                lemmas.push(lemma);
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
                    lemmas.push(lemma);
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
async function displayLemmaDictionaryEntries(lemma) {
    // the url needs escape-encoding, not encodeURIComponent-encoding (tested with ákveða)
    let url = "http://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=simple&size=First+100&rgn=lemma&q1=" + escape(lemma) + "&submit=Search";

    try {
        let jqxhr = await $.get(url, function (data) {
            // success
            let parser = new DOMParser();
            let htmlDoc = parser.parseFromString(data, "text/html");
            let entryElements = $(".entry", htmlDoc);
            if (entryElements.length > 0) {
                displayDictionaryEntries(lemma, entryElements);
            } else {
                let hrefs = $(".nestlevel .lemma a[href^='/cgi-bin/IcelOnline']", htmlDoc); // e.g. for vegna
                if (hrefs.length > 0) {
                    hrefs.each(function () {
                        let refUrl = "http://digicoll.library.wisc.edu" + $(this).attr("href");
                        getDictionaryEntriesRef(lemma, refUrl);
                    });
                } else {
                    $('#information-body').append("<p></p>").text("No dictionary entry found for " + lemma);
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
}

function displayDictionaryEntries(lemma, entryElements) {
    entryElements.each(function () {
        // console.log("Dictionary entry:\n" + $(this).html());
        let hrefs = $(".ref a[href^='/cgi-bin/IcelOnline']", this); // e.g. for veitingastaður
        if (hrefs.length == 0) {
            $('#popup').addClass("result");
            $('#information-body').append($(this));
        } else {
            hrefs.each(function () {
                let refUrl = "http://digicoll.library.wisc.edu" + $(this).attr("href");
                getDictionaryEntriesRef(lemma, refUrl);
            });
        }
    });
    if (entryElements.length == 0) {
        $('#information-body').append("<p></p>").text("No dictionary entry found for " + lemma);
    }
}

async function getDictionaryEntriesRef(lemma, refUrl) {
    try {
        let jqxhr = await $.get(refUrl, function (data) {
            // success
            let parser = new DOMParser();
            let htmlDoc = parser.parseFromString(data, "text/html");
            let entryElements = $(".entry", htmlDoc);
            displayDictionaryEntries(lemma, entryElements);
        });
    } catch (error) {
        console.error(error);
    }        
}

$(function () {
    $('#help').click(function () {
        provideHelp();
    });
});

function provideHelp() {
    /*
    chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
        function (tab) {
            chrome.tabs.sendMessage(tab[0].id, { method: "getSelection" },
                function (response) {
                    var text = document.getElementById('text');
                    text.innerHTML = response.data;
                });
        });
        */

    $('#information-body').empty();
    $('#information').show();

    chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
    }, async function (selection) {
        // var query = encodeURIComponent(selection[0] || '汉典')
        // document.querySelector('iframe').src =
        //     'http://www.zdic.net/search/?c=3&q=' + query

        let selectedText = selection[0];
        // console.log(selectedText);

        let lemmas = await getLemmas(selectedText, true);
        if (lemmas.length == 0) {
            lemmas = await getLemmas(selectedText, false);
        }

        for (lemma of lemmas) {
            // console.log("lemma: " + lemma);
            displayLemmaDictionaryEntries(lemma);
        }
    });
}