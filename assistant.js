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

    $("#result").on("click", ".search-item .lemma .lemma-heading-in", function () {
        let lemmaObj = $(this).closest(".lemma");
        if (lemmaObj.hasClass("off")) {
            $(".entry", lemmaObj).show(500);
            lemmaObj.removeClass("off");
        } else {
            $(".entry", lemmaObj).hide(500);
            lemmaObj.addClass("off");
        }
    });
});

// Credits https://coderwall.com/p/ostduq/escape-html-with-javascript

// List of HTML entities for escaping.
var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
};

// Regex containing the keys listed immediately above.
var htmlEscaper = /[&<>"'\/]/g;

// Escape a string for HTML interpolation.
function htmlEscape(string) {
    return ('' + string).replace(htmlEscaper, function (match) {
        return htmlEscapes[match];
    });
};

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

    if (lemma1.baseform.toLowerCase() != lemma2.baseform.toLowerCase())
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
        let newResult = results[i];
        let alreadyExists = false;
        for (let j = 0; j < uniqueResults.length; j++) {
            let existingResult = uniqueResults[j];
            if (deepEquals(existingResult, newResult)) {
                if (existingResult.lemma.baseform != newResult.lemma.baseform) {
                    // merge base forms for detailed display (e.g. "grein, Grein")
                    existingResult.lemma.baseform = existingResult.lemma.baseform + ", " + newResult.lemma.baseform;
                }
                alreadyExists = true;
                break;
            }
        }
        if (!alreadyExists) {
            uniqueResults.push(newResult);
        }
    }
    return uniqueResults;
}

function enrichEntry(entry) {
    let hwFull = entry.hw;

    // search for '/' or '.' headword separator (see http://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=HTML&rgn=DIV1&id=IcelOnline.IEOrd&target=IcelOnline.IEOrd.Guide)
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
    let enrichedHtml = html.replace(regexFull, enrichmentFull); // tala, segja, sjón, ...

    let hwBeforeSeparator = entry.hw;
    if (separatorPos != -1) {
        hwBeforeSeparator = hwBeforeSeparator.substring(0, separatorPos);
    }
    let regexBeforeSeparator = /(~)/g;
    let enrichmentBeforeSeparator = "<span class='hw-placeholder'>$1</span><span class='hw-actual'>" + htmlEscape(hwBeforeSeparator) + "</span>";
    enrichedHtml = enrichedHtml.replace(regexBeforeSeparator, enrichmentBeforeSeparator); // tala, segja, sjón

    entry.html = enrichedHtml;
}

const GOOGLE_TRANSLATE_BASE_URL = "https://translate.google.fr/#view=home&op=translate&sl=is&tl="; // + <target language>&text=<text>

function googleTranslate(text) {
    chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
        if (response.options.googleTranslate == "on") {
            let googleTranslateLink = $("#google-translate-link");
            if (googleTranslateLink.length > 0) {
                let googleTranslateUrl = GOOGLE_TRANSLATE_BASE_URL + response.options.googleTranslateTarget + "&text=" + encodeURIComponent(text); // loka%C3%B0
                googleTranslateLink.prop("href", googleTranslateUrl);
                googleTranslateLink[0].click();
            }
        }
    });
}

function getHelp(text) {
    text = text.replace(/\u00AD/g, ''); // &shy; (plenty of them on https://www.mbl.is/frettir/)
    text = text.trim();

    clearMessage();

    if (text.indexOf(" ") != -1) {
        // if text contains whitespace, just send it to google translate (disambiguation and dictionary lookup wouldn't work)
        googleTranslate(text);
        return;
    }

    let assistant = $('#assistant');
    let result = $('#result');
    let busy = $('#busy');

    let alreadySearchedItems = $(".search-item[data-search='" + escape(text) + "']", result);
    if (alreadySearchedItems.length > 0) {
        let alreadySearched = $(alreadySearchedItems[0]);
        let alreadySearchedLemmas = $(".lemma", alreadySearched);
        alreadySearchedLemmas.removeClass("off");
        $(".entry", alreadySearchedLemmas).show(500, function () {
            let newScrollTop = result.scrollTop();
            newScrollTop += alreadySearched.position().top;
            result.scrollTop(newScrollTop);
        });
        return;
    }

    // issuing http $.get from https (icelandiconline.com...) triggers a mixed-content error
    // tried to add permissions in manifest.json, with no success:
    // "http://dev.phpbin.ja.is/ajax_leit.php*", "http://digicoll.library.wisc.edu*"
    //
    // instead the actual processing may take place in background.js + using messages from content-to-background then
    // from background-to-js ???
    //
    // => https://developer.chrome.com/extensions/messaging

    let searchItemDiv = $("<div class='search-item searching-item' data-search='" + escape(text) + "'></div>");
    searchItemDiv.text("Searching for " + text + "...");
    // searchItemDiv.appendTo(result);
    result.prepend(searchItemDiv);

    chrome.runtime.sendMessage({ method: "disambiguation", surfaceForm: text }, function (lemmas) {
        // console.log("lemmas received!");

        searchItemDiv.removeClass("searching-item");

        let previousLemmaObjs = $(".search-item:not(:first-child) .lemma", result);
        previousLemmaObjs.addClass("off");
        $(".entry", previousLemmaObjs).hide(250);

        searchItemDiv.empty();

        let lemmaDivs = [];

        if (lemmas.length == 0) {
            // if no lemma(s) found, use the given surface form by default, in case of...
            let defaultLemma = { baseform: text, url: [] };
            lemmas.push(defaultLemma);
        }

        for (let i = 0; i < lemmas.length; i++) {
            lemmas[i].index = i;
            let lemmaDiv = $("<div class='lemma searching-lemma'></div>");
            lemmaDiv.text("Searching for " + lemmas[i].baseform + "...");
            lemmaDiv.appendTo(searchItemDiv);
            lemmaDivs.push(lemmaDiv);
        }

        chrome.runtime.sendMessage({ method: "dictionaryLookup", lemmas: lemmas }, function (dictionaryLookupResult) {
            console.log("dictionary lookup received!");

            let uniqueResults = getUniqueResults(dictionaryLookupResult);

            for (let i = 0; i < uniqueResults.length; i++) {
                // let baseform = lemmas[i].baseform;
                let baseform = uniqueResults[i].lemma.baseform;
                let entries = uniqueResults[i].entries;

                let lemmaDiv = lemmaDivs[lemmas[i].index];
                lemmaDiv.removeClass("searching-lemma");
                lemmaDiv.empty();

                let heading = $("<h1 class='lemma-heading'></h1>");
                let headingIn = $("<span class='lemma-heading-in'></span>");
                headingIn.html(baseform);
                heading.append(headingIn);

                if (lemmas[i].disambiguation.length > 0) {
                    for (let d=lemmas[i].disambiguation.length-1;d>=0; d--) {
                        let disamb = lemmas[i].disambiguation[d];
                        let link = $("<a class='lemma-url' title='" + disamb.pos + " - show on http://bin.arnastofnun.is' target='ia-arnastofnun' href='" + disamb.url + "'></a>");
                        heading.prepend(link);
                    }
                }
                heading.appendTo(lemmaDiv);

                if (entries.length > 0) {
                    for (let j = 0; j < entries.length; j++) {
                        let entry = entries[j];
                        enrichEntry(entry);
                        let entryDiv = $("<div class='entry'></div>");
                        let link = $("<a class='entry-url' title='Show on UWDC Icelandic Online Dictionary' target='ia-uwdc' href='" + entry.url + "'></a>");
                        link.appendTo(entryDiv);
                        let uwdcDiv = $("<div class='entry-uwdc'></div>");
                        uwdcDiv.html(entry.html);
                        uwdcDiv.appendTo(entryDiv);
                        entryDiv.appendTo(lemmaDiv);
                    }
                } else {
                    let noResultDiv = $("<div class='entry'></div>");
                    noResultDiv.text("Found no dictionary entry for " + baseform);
                    lemmaDiv.append(noResultDiv);
                    lemmaDiv.addClass("no-entry");
                }
            }

            $(".searching-lemma", searchItemDiv).remove();

            // // scroll result div to bottom
            // let scrollHeight = result.prop("scrollHeight");
            // result.scrollTop(scrollHeight);
        });
    });

    chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
        if (response.options.googleTranslate == "on") {
            chrome.tabs.query({ currentWindow: true }, function (tabs) {
                if (tabs) {
                    for (let i = 0; i < tabs.length; i++) {
                        let url = tabs[i].url;
                        // if a google translate tab exists, update it
                        if (url.startsWith(GOOGLE_TRANSLATE_BASE_URL)) {
                            let googleTranslateUrl = GOOGLE_TRANSLATE_BASE_URL + response.options.googleTranslateTarget + "&text=" + encodeURIComponent(text); // loka%C3%B0
                            chrome.tabs.update(tabs[i].id, { url: googleTranslateUrl });
                            return;
                        }
                    }

                    // if no existing google translate tab, open one
                    googleTranslate(text);
                }
            });
        }
    });
}

$(document).ready(function () {
    chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
        // response.sidebarStatus: on / off or undefined
        //console.log(response.sidebarStatus);
        updateSlider(response.sidebarStatus);
    });

    // see https://javascript.info/cross-window-communication
    window.addEventListener("message", function (e) {
        // if (event.origin != 'http://javascript.info') {
        //   // something from an unknown domain, let's ignore it
        //   return;
        // }
        if (e.data.method && e.data.method == "getHelp") {
            let selectedText = e.data.param;
            getHelp(selectedText);
        }
    });
});
