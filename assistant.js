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
    let assistant = $('#assistant');
    let result = $('#result');
    let busy = $('#busy');

    chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
    }, async function (selection) {
        // var query = encodeURIComponent(selection[0] || '汉典')
        // document.querySelector('iframe').src =
        //     'http://www.zdic.net/search/?c=3&q=' + query

        let selectedText = selection[0];
        selectedText = selectedText.replace(/\u00AD/g, ''); // &shy; (plenty of them on https://www.mbl.is/frettir/)
        selectedText = selectedText.trim();
        // console.log(selectedText);

        // issuing http $.get from https (icelandiconline.com...) triggers a mixed-content error
        // tried to add permissions in manifest.json, with no success:
        // "http://dev.phpbin.ja.is/ajax_leit.php*", "http://digicoll.library.wisc.edu*"
        //
        // instead the actual processing may take place in background.js + using messages from content-to-background then
        // from background-to-js ???
        //
        // => https://developer.chrome.com/extensions/messaging

        let searchItemDiv = $("<div class='search-item'></div>");
        searchItemDiv.text("Searching for " + selectedText + "...");
        searchItemDiv.appendTo(result);

        chrome.runtime.sendMessage({ surfaceForm: selectedText }, function (lemmas) {
            console.log("lemmas received!");

            searchItemDiv.empty();

            let lemmaDivs = [];

            if (lemmas.length > 0) {
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
                });
            } else {
                let noResultDiv = $("<div class='no-result'></div>");
                noResultDiv.text("No analysis found for " + selectedText);
                noResultDiv.appendTo(searchItemDiv);
            }

            var height = assistant.scrollHeight;
            assistant.scrollTop(height);
        });
    });
}