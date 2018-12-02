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

function queryArnastofnun(form, firstQuery) {
    let url = "http://dev.phpbin.ja.is/ajax_leit.php?q=" + encodeURIComponent(form);
    if (!firstQuery) {
        url = url + "&id=&ordmyndir=on";
    }

    let jqxhr = $.get(url, function (data) {
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
                console.log("Analysis " + i + ": " + lemma + " (" + pos + ") " + url2);
            }

            queryDictionary(lemma);
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
                console.log("Analysis: " + lemma + " (" + pos + ")");

                queryDictionary(lemma);
            } else if (firstQuery) {
                queryArnastofnun(form, false);
            } else {
                // found nothing...
            }
        }
    }).done(function () {
        // console.log("second success");
    }).fail(function () {
        console.log("error");
    }).always(function () {
        // finished
    });
}

function queryDictionary(lemma) {
    // the url needs escape-encoding, not encodeURIComponent-encoding (tested with ákveða)
    let url = "http://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=simple&size=First+100&rgn=lemma&q1=" + escape(lemma) + "&submit=Search";

    let jqxhr = $.get(url, function (data) {
        // success
        let parser = new DOMParser();
        let htmlDoc = parser.parseFromString(data, "text/html");
        let entries = $(".entry", htmlDoc);
        if (entries.length > 0) {
            processDictionaryEntries(entries);
        } else {
            // no dictionary entries found but maybe different part-of-speech proposals (e.g. searching "loka")
            let nestlevels = $(".results .nestlevel", htmlDoc);
            nestlevels.each(function() {
                let aElem = $(".lemma a", this);
                let lemma = aElem.text();
                let href = "http://digicoll.library.wisc.edu" + aElem.attr("href");
                let posElem = $(".pos a", this);
                let pos = posElem.text();
                // TODO match this POS with the provided one
                queryDictionaryRef(href);
            });
            if (nestlevels.length == 0) {
                // finally, no dictionary entries found
            }
        }
    }).done(function () {
        // console.log("second success");
    }).fail(function () {
        console.log("error");
    }).always(function () {
        // finished
    });
}

function queryDictionaryRef(refUrl) {
    let jqxhr = $.get(refUrl, function (data) {
        // success
        let parser = new DOMParser();
        let htmlDoc = parser.parseFromString(data, "text/html");
        let entries = $(".entry", htmlDoc);
        processDictionaryEntries(entries);
    }).done(function () {
        // console.log("second success");
    }).fail(function () {
        console.log("error");
    }).always(function () {
        // finished
    });
}

function processDictionaryEntries(entries) { // TODO accept POS
    entries.each(function () {
        console.log("Dictionary entry:\n" + $(this).html());
        let hrefs = $(".ref a[href^='/cgi-bin/IcelOnline']", this); // e.g. for veitingastaður
        if (hrefs.length == 0) {
            $('#popup').addClass("result");
            $('#information-body').append($(this));
        } else {
            hrefs.each(function () {
                let refUrl = "http://digicoll.library.wisc.edu" + $(this).attr("href");
                queryDictionaryRef(refUrl);
            });
        }
    });
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
    }, function (selection) {
        // var query = encodeURIComponent(selection[0] || '汉典')
        // document.querySelector('iframe').src =
        //     'http://www.zdic.net/search/?c=3&q=' + query
        let selectedText = selection[0];
        console.log(selectedText);

        // http://bin.arnastofnun.is/leit/?q=heiti
        // http://dev.phpbin.ja.is/ajax_leit.php?q=heiti
        // http://bin.arnastofnun.is/leit/?id=434170
        queryArnastofnun(selectedText, true);
    });
}