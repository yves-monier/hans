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

$(function () {
    $('#help').click(function () {
        help();
    });

    $('#clear').click(function () {
        $('#result').empty();
    });
});

function help() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, {
            code: "window.getSelection().toString();"
        }, function (selection) {
            if (selection && selection.length > 0) {
                let selectedText = selection[0];
                getHelp(selectedText);
            } else {
                showMessage("Failed to retrieve selected text!");
            }
        });
    });
    // chrome.tabs.executeScript(null, {
    //     code: "window.getSelection().toString();"
    // }, function (selection) {
    //     let selectedText = selection[0];
    //     getHelp(selectedText);
    // });

    // TODO issue on sýna (http://www.ruv.is/frett/katrin-jakobsdottir-oflug-i-spretthlaupi)
}

function showMessage(msg) {
    let result = $('#result');
    let msgDiv = $("<div class='message'></div>");
    msgDiv.text(msg);
    msgDiv.appendTo(result);
}

function getHelp(text) {
    let assistant = $('#assistant');
    let result = $('#result');
    let busy = $('#busy');

    text = text.replace(/\u00AD/g, ''); // &shy; (plenty of them on https://www.mbl.is/frettir/)
    text = text.trim();
    // console.log(text);

    // issuing http $.get from https (icelandiconline.com...) triggers a mixed-content error
    // tried to add permissions in manifest.json, with no success:
    // "http://dev.phpbin.ja.is/ajax_leit.php*", "http://digicoll.library.wisc.edu*"
    //
    // instead the actual processing may take place in background.js + using messages from content-to-background then
    // from background-to-js ???
    //
    // => https://developer.chrome.com/extensions/messaging

    let searchItemDiv = $("<div class='search-item'></div>");
    searchItemDiv.text("Searching for " + text + "...");
    searchItemDiv.appendTo(result);

    chrome.runtime.sendMessage({ surfaceForm: text }, function (lemmas) {
        console.log("lemmas received!");

        searchItemDiv.empty();

        let lemmaDivs = [];

        if (lemmas.length == 0) {
            // if no lemma(s) found, use the given surface form by default, in case of...
            lemmas.push(text);
        }

        for (let i = 0; i < lemmas.length; i++) {
            let lemmaDiv = $("<div class='lemma'></div>");
            lemmaDiv.text("Searching for " + lemmas[i] + "...");
            lemmaDiv.appendTo(searchItemDiv);
            lemmaDivs.push(lemmaDiv);
        }

        chrome.runtime.sendMessage({ lemmas: lemmas }, function (dictionaryLookupResult) {
            console.log("dictionary lookup received!");

            for (let i = 0; i < dictionaryLookupResult.length; i++) {
                let lemma = lemmas[i];
                let lemmaDiv = lemmaDivs[i];
                let entries = dictionaryLookupResult[i].entries;
                lemmaDiv.empty();
                if (entries.length > 0) {
                    let heading = $("<h1 class='lemma-heading'></h1>");
                    heading.html(lemma);
                    heading.appendTo(lemmaDiv);
                    for (let j = 0; j < entries.length; j++) {
                        let entryDiv = $("<div class='entry'></div>");
                        entryDiv.html(entries[j]);
                        entryDiv.appendTo(lemmaDiv);
                    }
                } else {
                    let noResultDiv = $("<div class='no-lemma-result'></div>");
                    noResultDiv.text("Found no dictionary entry for " + lemma);
                    lemmaDiv.append(noResultDiv);
                }
            }

            // scroll result div to bottom
            let scrollHeight = result.prop("scrollHeight");
            result.scrollTop(scrollHeight);
        });
    });
}
