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

    $('#slider').click(function () {
        toggleSidebar();
    });
});

function toggleSidebar() {
    chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
        // response.sidebarStatus: on / off or undefined
        console.log(response.sidebarStatus);
        let newStatus;
        if ("on" === response.sidebarStatus) {
            newStatus = "off";
        } else {
            newStatus = "on";
        }
        chrome.runtime.sendMessage({ method: "setSidebarStatus", param: newStatus }, function (response) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                tabId = tabs[0].id;
                chrome.tabs.sendMessage(tabId, { method: "showSidebar", param: newStatus });
                updateSlider(newStatus);
            });
        });
    });
}

function updateSlider(sidebarStatus) {
    if ("on" === sidebarStatus) {
        $("#assistant").addClass("on");
    } else {
        $("#assistant").removeClass("on");
    }
}

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

    // TODO issues with:
    // sýna http://www.ruv.is/frett/katrin-jakobsdottir-oflug-i-spretthlaupi
    // veðurs https://icelandiconline.com/course/Icelandic%20Online%203/121(1)
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

    chrome.runtime.sendMessage({ method: "disambiguation", surfaceForm: text }, function (lemmas) {
        console.log("lemmas received!");

        searchItemDiv.empty();

        let lemmaDivs = [];

        if (lemmas.length == 0) {
            // if no lemma(s) found, use the given surface form by default, in case of...
            let defaultLemma = { lemma: text, url: undefined };
            lemmas.push(defaultLemma);
        }

        for (let i = 0; i < lemmas.length; i++) {
            let lemmaDiv = $("<div class='lemma'></div>");
            lemmaDiv.text("Searching for " + lemmas[i].lemma + "...");
            lemmaDiv.appendTo(searchItemDiv);
            lemmaDivs.push(lemmaDiv);
        }

        chrome.runtime.sendMessage({ method: "dictionaryLookup", lemmas: lemmas }, function (dictionaryLookupResult) {
            console.log("dictionary lookup received!");

            for (let i = 0; i < dictionaryLookupResult.length; i++) {
                let lemma = lemmas[i].lemma;
                let lemmaDiv = lemmaDivs[i];
                let entries = dictionaryLookupResult[i].entries;
                lemmaDiv.empty();
                let heading = $("<h1 class='lemma-heading'></h1>");
                heading.html(lemma);
                if (lemmas[i].url) {
                    let link = $("<a class='lemma-url' title='Show on http://bin.arnastofnun.is' target='ia-arnastofnun' href='" + lemmas[i].url + "'></a>");
                    heading.prepend(link);
                }
                heading.appendTo(lemmaDiv);
                if (entries.length > 0) {
                    for (let j = 0; j < entries.length; j++) {
                        let entry = entries[j];
                        let entryDiv = $("<div class='entry'></div>");
                        let link = $("<a class='entry-url' title='Show on UWDC Icelandic Online Dictionary' target='ia-uwdc' href='" + entry.url + "'></a>");
                        link.appendTo(entryDiv);
                        let uwdcDiv = $("<div class='entry-uwdc'></div>");
                        uwdcDiv.html(entry.html);
                        uwdcDiv.appendTo(entryDiv);
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

$(document).ready(function () {
    chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
        // response.sidebarStatus: on / off or undefined
        console.log(response.sidebarStatus);
        updateSlider(response.sidebarStatus);
    });
});
