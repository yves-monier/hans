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
    $("#controls").submit(function (e) {
        e.preventDefault();
        help();
        return false;
    });

    // $('#help').click(function () {
    //     help();
    // });

    $('#clear').click(function (e) {
        $('#result').empty();
        e.preventDefault();
        return false;
    });

    $('#slider').click(function () {
        toggleSidebar();
    });

    $("#result").on("click", ".search-item .lemma .lemma-heading", function () {
        let lemmaObj = $(this).parent();
        if (lemmaObj.hasClass("off")) {
            $(".entry", lemmaObj).show(500);
            lemmaObj.removeClass("off");
        } else {
            $(".entry", lemmaObj).hide(500);
            lemmaObj.addClass("off");
        }
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
    let userInput = $("#user-input").val().trim();
    if (userInput.length > 0) {
        getHelp(userInput);
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            tabId = tabs[0].id;
            chrome.tabs.executeScript(tabId, {
                code: "window.getSelection().toString();"
            }, function (selection) {
                if (selection && selection.length > 0) {
                    let selectedText = selection[0];
                    selectedText = selectedText.trim();
                    if (selectedText.length > 0) {
                        getHelp(selectedText);
                    } else {
                        showMessage("Please select or enter a word first...");
                    }
                } else {
                    showMessage("Failed to retrieve selected text!");
                }
            });
        });
    }
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
    clearMessage();

    let message = $('#message');
    let msgDiv = $("<div class='message'></div>");
    msgDiv.text(msg);
    msgDiv.appendTo(message);
}

function clearMessage() {
    let message = $('#message');
    message.empty();
}

function deepEquals(result1, result2) {
    let lemma1 = result1.lemma;
    let lemma2 = result2.lemma;

    if (lemma1.lemma.toLowerCase() != lemma2.lemma.toLowerCase())
        return false;

    if (result1.entries.length != result2.entries.length)
        return false;

    for (let i = 0; i < result1.entries.length; i++) {
        let entry1 = result1.entries[i];
        let entry2 = result2.entries[i];
        if (entry1.html.localeCompare(entry2.html) != 0)
            return false;
    }

    return true;
}

function getUniqueResults(results) {
    let uniqueResults = [];
    for (let i = 0; i < results.length; i++) {
        let result1 = results[i];
        let alreadyExists = false;
        for (let j = 0; j < uniqueResults.length; j++) {
            let result2 = uniqueResults[j];
            if (deepEquals(result1, result2)) {
                alreadyExists = true;
                break;
            }
        }
        if (!alreadyExists) {
            uniqueResults.push(result1);
        }
    }
    return uniqueResults;
}

function getHelp(text) {
    clearMessage();

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
            lemmas[i].index = i;
            let lemmaDiv = $("<div class='lemma pending-lemma'></div>");
            lemmaDiv.text("Searching for " + lemmas[i].lemma + "...");
            lemmaDiv.appendTo(searchItemDiv);
            lemmaDivs.push(lemmaDiv);
        }

        chrome.runtime.sendMessage({ method: "dictionaryLookup", lemmas: lemmas }, function (dictionaryLookupResult) {
            console.log("dictionary lookup received!");

            let uniqueResults = getUniqueResults(dictionaryLookupResult);

            for (let i = 0; i < uniqueResults.length; i++) {
                let lemma = lemmas[i].lemma;
                let lemmaDiv = lemmaDivs[lemmas[i].index];
                let entries = uniqueResults[i].entries;
                lemmaDiv.removeClass("pending-lemma");
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

            $(".pending-lemma", searchItemDiv).remove();

            let previousLemmaObjs = $(".search-item:not(:last-child) .lemma", result);
            previousLemmaObjs.addClass("off");
            $(".entry", previousLemmaObjs).hide(500);

            // scroll result div to bottom
            let scrollHeight = result.prop("scrollHeight");
            result.scrollTop(scrollHeight);
        });
    });

    const GOOGLE_TRANSLATE_BASE_URL = "https://translate.google.fr/#view=home&op=translate&sl=is&tl=en&text=";
    let googleTranslateUrl = GOOGLE_TRANSLATE_BASE_URL + encodeURIComponent(text); // loka%C3%B0
    // $("#google-translate").prop("src", googleTranslateUrl);

    chrome.tabs.query({ currentWindow: true }, function (tabs) {
        if (tabs) {
            for (let i = 0; i < tabs.length; i++) {
                let url = tabs[i].url;
                if (url.startsWith(GOOGLE_TRANSLATE_BASE_URL)) {
                    chrome.tabs.update(tabs[i].id, { url: googleTranslateUrl });
                    return;
                }
            }

            let googleTranslateLink = $("#google-translate-link");
            if (googleTranslateLink.length > 0) {
                googleTranslateLink.prop("href", googleTranslateUrl);
                googleTranslateLink[0].click();
            }
        }
    });
}

$(document).ready(function () {
    chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
        // response.sidebarStatus: on / off or undefined
        console.log(response.sidebarStatus);
        updateSlider(response.sidebarStatus);
    });
});
