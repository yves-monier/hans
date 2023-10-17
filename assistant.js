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
/*
$(function () {
    $("#controls-form").submit(function (e) {
        e.preventDefault();
        withSelectedText(getHelp);
        return false;
    });

    $('#hlusta').click(function (e) {
        e.preventDefault();
        withSelectedText(hlusta);
        return false;
    });

    $('#clear').click(function (e) {
        $('#result').empty();
        e.preventDefault();
        return false;
    });

    $('#settings').click(function (e) {
        $('#settings-form').show();
        e.preventDefault();
        return false;
    });
    $('#close-settings').click(function (e) {
        $('#settings-form').hide();
        e.preventDefault();
        return false;
    });

    $('#slider').click(function () {
        toggleSidebar();
    });

    $("#result").on("click", ".search-item .morpho .morpho-heading", function (e) {
        if (e.target == e.currentTarget) {
            let morphoObj = $(this).closest(".morpho");
            if (morphoObj.hasClass("off")) {
                $(".entry", morphoObj).show(500);
                morphoObj.removeClass("off");
            } else {
                $(".entry", morphoObj).hide(500);
                morphoObj.addClass("off");
            }
        }
    });
});
*/
//
// HTML enrichment is now done in background.js: replacement of ~/~~ and some abbreviations
//

// // Credits https://coderwall.com/p/ostduq/escape-html-with-javascript

// // List of HTML entities for escaping.
// var htmlEscapes = {
//     '&': '&amp;',
//     '<': '&lt;',
//     '>': '&gt;',
//     '"': '&quot;',
//     "'": '&#x27;',
//     '/': '&#x2F;'
// };

// // Regex containing the keys listed immediately above.
// var htmlEscaper = /[&<>"'\/]/g;

// // Escape a string for HTML interpolation.
// function htmlEscape(string) {
//     return ('' + string).replace(htmlEscaper, function (match) {
//         return htmlEscapes[match];
//     });
// }

// function enrichEntry(entry) {
//     let hwFull = entry.hw;

//     // search for '/' or '.' headword separator (see https://digicoll.library.wisc.edu/cgi-bin/IcelOnline/IcelOnline.TEId-idx?type=HTML&rgn=DIV1&id=IcelOnline.IEOrd&target=IcelOnline.IEOrd.Guide)
//     let separatorPos = hwFull.indexOf('/');
//     if (separatorPos == -1) {
//         separatorPos = hwFull.indexOf('.');
//     }
//     if (separatorPos != -1) {
//         let regex = new RegExp('\\/|\\.', 'g');
//         hwFull = hwFull.replace(regex, ''); // e.g. "tal/a" => "tala"
//     }

//     let regexFull = /(~~)/g;
//     let enrichmentFull = "<span class='hw-placeholder'>$1</span><span class='hw-actual'>" + htmlEscape(hwFull) + "</span>";
//     let html = entry.html;
//     let enrichedHtml = html.replace(regexFull, enrichmentFull); // tala, segja, sjón, ...

//     let hwBeforeSeparator = entry.hw;
//     if (separatorPos != -1) {
//         hwBeforeSeparator = hwBeforeSeparator.substring(0, separatorPos);
//     }
//     let regexBeforeSeparator = /(~)/g;
//     let enrichmentBeforeSeparator = "<span class='hw-placeholder'>$1</span><span class='hw-actual'>" + htmlEscape(hwBeforeSeparator) + "</span>";
//     enrichedHtml = enrichedHtml.replace(regexBeforeSeparator, enrichmentBeforeSeparator); // tala, segja, sjón

//     entry.html = enrichedHtml;
// }

function toggleSidebar() {
    chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
        // response.sidebarStatus: on / off or undefined
        let msg = "toggleSidebar " + response.sidebarStatus + " => ";
        let newStatus;
        if ("on" === response.sidebarStatus) {
            newStatus = "off";
        } else {
            newStatus = "on";
        }
        msg += newStatus;
        console.log(msg);
        chrome.runtime.sendMessage({ method: "setSidebarStatus", param: newStatus }, function (response) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                tabId = tabs[0].id;
                chrome.tabs.sendMessage(tabId, { method: "showSidebar", param: newStatus });
                updateSlider(newStatus);
            });
        });
    });
}

function showSidebar() {
    chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
        // response.sidebarStatus: on / off or undefined
        console.log(response.sidebarStatus);
        if ("off" === response.sidebarStatus) {
            let newStatus = "on";
            chrome.runtime.sendMessage({ method: "setSidebarStatus", param: newStatus }, function (response) {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    tabId = tabs[0].id;
                    chrome.tabs.sendMessage(tabId, { method: "showSidebar", param: newStatus });
                    updateSlider(newStatus);
                });
            });
        }
    });
}

function updateSlider(sidebarStatus) {
    if ("on" === sidebarStatus) {
        $("#assistant").addClass("on");
    } else {
        $("#assistant").removeClass("on");
    }
}

function updateDarkMode(darkMode) {
    if ("on" === darkMode) {
        $("#assistant").addClass("darkmode");
    } else {
        $("#assistant").removeClass("darkmode");
    }
}

function help() {
    let userInput = $("#user-input").val().trim();
    if (userInput.length > 0) {
        getHelp(userInput);
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let tabId = tabs[0].id;
            // chrome.tabs.executeScript(tabId, {
            //     code: "window.getSelection().toString();"
            // }, function (selection) {
            //     if (selection && selection.length > 0) {
            //         let selectedText = selection[0];
            //         selectedText = selectedText.trim();
            //         if (selectedText.length > 0) {
            //             getHelp(selectedText);
            //         } else {
            //             showMessage("Please select or enter a word first...");
            //         }
            //     } else {
            //         showMessage("Failed to retrieve selected text!");
            //     }
            // });
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['get-window-selection.js']
            },
                function (selection) {
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
}

function withSelectedText(f) {
    let userInput = $("#user-input").val().trim();
    if (userInput.length > 0) {
        f(userInput);
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            tabId = tabs[0].id;
            // chrome.tabs.executeScript(tabId, {
            //     code: "window.getSelection().toString();"
            // }, function (selection) {
            //     if (selection && selection.length > 0) {
            //         let selectedText = selection[0];
            //         selectedText = selectedText.trim();
            //         if (selectedText.length > 0) {
            //             f(selectedText);
            //         } else {
            //             showMessage("Please select or enter a word first...");
            //         }
            //     } else {
            //         showMessage("Failed to retrieve selected text!");
            //     }
            // });
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['get-window-selection.js']
            },
                function (selection) {
                    if (selection && selection.length > 0) {
                        let selectedText = selection[0];
                        selectedText = selectedText.trim();
                        if (selectedText.length > 0) {
                            f(selectedText);
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
    let morpho1 = result1.morphos[0];
    let morpho2 = result2.morphos[0];

    if (morpho1.baseform.toLowerCase() != morpho2.baseform.toLowerCase())
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

// for "hestur" arnastofnun gives "hestur" and "Hestur". uwdc returns the same result for both
// => in such case we want to display the same/single result under "hestur, Hestur"
function getUniqueResults(results) {
    let uniqueResults = [];

    for (let i = 0; i < results.length; i++) {
        let newResult = results[i];
        let alreadyExists = false;
        for (let j = 0; j < uniqueResults.length; j++) {
            let existingResult = uniqueResults[j];
            if (deepEquals(existingResult, newResult)) {
                if (existingResult.morphos[0].baseform != newResult.morphos[0].baseform) { // e.g. "grein, Grein"
                    existingResult.morphos.push(newResult.morphos[0]);
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

    if (text.indexOf(" ") != -1 || text.indexOf("\n") != -1) {
        // if text contains whitespace or carriage return, just send it to google translate (morpho analysis and dictionary lookup wouldn't work)
        googleTranslate(text);
        return;
    }

    showSidebar();

    let assistant = $('#assistant');
    let result = $('#result');
    let busy = $('#busy');

    let alreadySearchedItems = $(".search-item[data-search='" + escape(text) + "']", result);
    if (alreadySearchedItems.length > 0) {
        let alreadySearched = $(alreadySearchedItems[0]);
        let alreadySearchedMorphos = $(".morpho", alreadySearched);
        alreadySearchedMorphos.removeClass("off");
        let entriesToHighlight = $(".entry", alreadySearchedMorphos);
        entriesToHighlight.addClass("highlight").show(500, function () {
            entriesToHighlight.removeClass("highlight");
            let newScrollTop = result.scrollTop();
            newScrollTop += alreadySearched.position().top;
            result.scrollTop(newScrollTop);
        });
        return;
    }

    // issuing http $.get from https (icelandiconline.com...) triggers a mixed-content error
    // tried to add permissions in manifest.json, with no success:
    // "http://dev.phpbin.ja.is/ajax_leit.php*", "https://digicoll.library.wisc.edu*"
    //
    // instead the actual processing may take place in background.js + using messages from content-to-background then
    // from background-to-js ???
    //
    // => https://developer.chrome.com/extensions/messaging

    let searchItemDiv = $("<div class='search-item searching-item' data-search='" + escape(text) + "'></div>");
    // searchItemDiv.text("Morphological analysis: " + text + "...");
    searchItemDiv.text(text);
    // searchItemDiv.appendTo(result);
    result.prepend(searchItemDiv);

    chrome.runtime.sendMessage({ method: "morphoAnalysis", surfaceForm: text }, function (morphos) {
        // console.log("morpho analysis received!");

        searchItemDiv.removeClass("searching-item");

        let previousLemmaObjs = $(".search-item:not(:first-child) .morpho", result);
        previousLemmaObjs.addClass("off");
        $(".entry", previousLemmaObjs).hide(250);

        searchItemDiv.empty();

        let morphoDivs = [];

        if (morphos.length == 0) {
            // if no morpho(s) found, use the given surface form by default, in case of...
            let defaultMorpho = { baseform: text, url: [] };
            morphos.push(defaultMorpho);
        }

        for (let i = 0; i < morphos.length; i++) {
            let morphoDiv = $("<div class='morpho searching-morpho'></div>");
            let txt = morphos[i].baseform + "...";
            morphoDiv.text(txt);
            morphoDiv.appendTo(searchItemDiv);
            morphoDivs.push(morphoDiv);
        }

        chrome.runtime.sendMessage({ method: "dictionaryLookup", morphos: morphos }, function (dictionaryLookupResult) {
            // console.log("dictionary lookup received!");

            let uniqueResults = getUniqueResults(dictionaryLookupResult);

            for (let i = 0; i < uniqueResults.length; i++) {
                let uniqueResult = uniqueResults[i];

                let morphoDiv = morphoDivs[i];
                morphoDiv.removeClass("searching-morpho");
                morphoDiv.empty();

                let heading = $("<h1 class='morphos-heading'></h1>");

                let searchBaseform = text; // default value if no morpho analysis found
                let resultMorphos = uniqueResult.morphos;
                for (let rm = 0; rm < resultMorphos.length; rm++) {
                    let morpho = resultMorphos[rm];
                    let baseform = morpho.baseform;

                    if (rm == 0) {
                        searchBaseform = baseform;
                    } else {
                        searchBaseform += ", " + baseform;
                    }

                    let morphoHeading = $("<span class='morpho-heading'></span>");
                    let morphoLemma = $("<span class='lemma'></span>");
                    morphoLemma.text(baseform);
                    morphoHeading.prepend(morphoLemma);
                    heading.append(morphoHeading);
                    if (morpho.morphoanalysis && morpho.morphoanalysis.length > 0) {
                        for (let m = morpho.morphoanalysis.length - 1; m >= 0; m--) {
                            let morphoanalysis = morpho.morphoanalysis[m];
                            // let link = $("<a class='morpho-url' title='" + morphoanalysis.pos + " - show on http://bin.arnastofnun.is' target='ia-arnastofnun' href='" + morphoanalysis.url + "'></a>");
                            let link = $("<span class='morpho-url' title='" + morphoanalysis.pos + " - show on http://bin.arnastofnun.is'></span>");
                            morphoHeading.prepend(link);
                            let linkElt = link.get(0);
                            linkElt.addEventListener("click", function (e) {
                                showMorphoAnalysis(morphoanalysis.url);
                            });
                        }
                    }
                }
                heading.appendTo(morphoDiv);

                let entries = uniqueResult.entries;
                if (entries.length > 0) {
                    for (let j = 0; j < entries.length; j++) {
                        let entry = entries[j];
                        // enrichEntry(entry); // now done in background.js
                        let entryDiv = $("<div class='entry'></div>");
                        // let link = $("<a class='entry-url' title='Show on UWDC Icelandic Online Dictionary' target='ia-uwdc' href='" + entry.url + "'></a>");
                        let link = $("<span class='entry-url' title='Show on UWDC Icelandic Online Dictionary' target='ia-uwdc'></span>");
                        link.appendTo(entryDiv);
                        let uwdcDiv = $("<div class='entry-uwdc'></div>");
                        uwdcDiv.html(entry.html);
                        uwdcDiv.appendTo(entryDiv);
                        entryDiv.appendTo(morphoDiv);
                        let linkElt = link.get(0);
                        linkElt.addEventListener("click", function (e) {
                            showDictionaryLookup(entry.url);
                        });
                    }
                } else {
                    // let noResultDiv = $("<div class='entry'></div>");
                    // noResultDiv.text("Found no dictionary entry for " + searchBaseform);
                    // morphoDiv.append(noResultDiv);
                    morphoDiv.addClass("no-entry");
                }
            }

            for (let i = uniqueResults.length; i < morphos.length; i++) {
                // $(".searching-morpho", searchItemDiv).remove();
                morphoDivs[i].remove();
            }

            // // scroll result div to bottom
            // let scrollHeight = result.prop("scrollHeight");
            // result.scrollTop(scrollHeight);

            // showSidebar();
        });
    });

    // chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
    //     if (response.options.googleTranslate == "on") {
    //         chrome.tabs.query({ currentWindow: true }, function (tabs) {
    //             if (tabs) {
    //                 for (let i = 0; i < tabs.length; i++) {
    //                     let url = tabs[i].url;
    //                     // if a google translate tab exists, update it
    //                     if (url.startsWith(GOOGLE_TRANSLATE_BASE_URL)) {
    //                         let googleTranslateUrl = GOOGLE_TRANSLATE_BASE_URL + response.options.googleTranslateTarget + "&text=" + encodeURIComponent(text); // loka%C3%B0
    //                         chrome.tabs.update(tabs[i].id, { url: googleTranslateUrl });
    //                         return;
    //                     }
    //                 }

    //                 // if no existing google translate tab, open one
    //                 googleTranslate(text);
    //             }
    //         });
    //     }
    // });
}

function hlusta(text) {
    // let p = document.getElementById('readspeaker-hit').getElementsByTagName('p')[0];
    // p.textContent = 'text to read';
    // let range = document.createRange();
    // range.selectNodeContents(p);
    // let selection = window.getSelection();
    // selection.removeAllRanges();
    // selection.addRange(range);
    // let a = document.getElementById("readspeaker_button1").getElementsByClassName('rsbtn_play');
    // if (a.length > 0) {
    //  a[0].click();
    // }

    // chrome.tabs.query({ url: 'https://www.hi.is/haskolinn/saga', currentWindow: true }, function (tabs) {
    //     if (tabs.length > 0) {
    //         let t = tabs[0];
    //         chrome.tabs.sendMessage(t.id, { method: "hlusta", param: text }, function (response) {
    //             console.log("hlusta: done");
    //         });
    //     }
    // });
}

function showMorphoAnalysis(url) {
    console.log("sendMessage showMorphoAnalysis " + url);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { method: "showMorphoAnalysis", param: url }, function (response) {
        });
    });
}

function showDictionaryLookup(url) {
    console.log("sendMessage showDictionaryLookup " + url);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { method: "showDictionaryLookup", param: url }, function (response) {
        });
    });
}

const DEFAULT_OPTIONS = { sidebarStatus: "off", autoHelpSelection: "on", darkMode: "on", googleTranslate: "off", googleTranslateTarget: "en" };

function loadOptions() {
    chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
        let options = Object.assign(DEFAULT_OPTIONS, response ? response.options : {});

        updateSlider(options.sidebarStatus);

        updateDarkMode(options.darkMode);
        let darkModeCheckbox = $("#option-dark-mode");
        if (options.darkMode == "on") {
            darkModeCheckbox.prop('checked', true);
        } else {
            darkModeCheckbox.prop('checked', false);
        }

        let autoHelpSelectionCheckbox = $("#option-auto-help-selection");
        if (options.autoHelpSelection == "on") {
            autoHelpSelectionCheckbox.prop('checked', true);
        } else {
            autoHelpSelectionCheckbox.prop('checked', false);
        }

        let googleTranslateCheckbox = $("#option-use-google-translate");
        let googleTranslateSelect = $("#google-translate-target");
        if (options.googleTranslate == "on") {
            googleTranslateCheckbox.prop('checked', true);
            googleTranslateSelect.prop("disabled", false);
        } else {
            googleTranslateCheckbox.prop('checked', false);
            googleTranslateSelect.prop("disabled", true);
        }

        let target = options.googleTranslateTarget;
        $("#option-google-translate-target option[value=" + target + "]", googleTranslateSelect).prop('selected', true);
    });
}

function saveOption(option, value) {
    let options = {};
    options[option] = value;
    saveOptions(options);
}

function saveOptions(options) {
    chrome.runtime.sendMessage({ method: "setOptions", options: options }, function (response) {
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { method: "setOptions", param: options });
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
        } else if (e.data.method && e.data.method == "hlusta") {
            let text = e.data.param;
            hlusta(text);
        }
    });

    // credits https://stackoverflow.com/questions/1064089/inserting-a-text-where-cursor-is-using-javascript-jquery
    $(".key").click(function (e) {
        let input = $("#user-input").get(0);
        let ch = $(this).text();
        if (e.shiftKey) {
            ch = ch.toUpperCase();
        }
        // let code = $(this).text().charCodeAt(0);
        // if (e.shiftKey) {
        //     code += 32;
        // }
        // let ch = String.fromCharCode(code);
        if (document.selection) {
            input.focus();
            var sel = document.selection.createRange();
            sel.text = ch;
            input.focus();
        } else if (input.selectionStart || input.selectionStart === 0) {
            var startPos = input.selectionStart;
            var endPos = input.selectionEnd;
            var scrollTop = input.scrollTop;
            input.value = input.value.substring(0, startPos) +
                ch + input.value.substring(endPos, input.value.length);
            input.focus();
            input.selectionStart = startPos + ch.length;
            input.selectionEnd = startPos + ch.length;
            input.scrollTop = scrollTop;
        } else {
            input.value += ch;
            input.focus();
        }
    });

    loadOptions();

    let autoHelpSelectionCheckbox = $("#option-auto-help-selection");
    autoHelpSelectionCheckbox.change(function () {
        if (autoHelpSelectionCheckbox.is(":checked")) {
            saveOption("autoHelpSelection", "on");
        } else {
            saveOption("autoHelpSelection", "off");
        }
    });

    let googleTranslateCheckbox = $("#option-use-google-translate");
    let select = $("#option-google-translate-target");

    googleTranslateCheckbox.change(function () {
        if (googleTranslateCheckbox.is(":checked")) {
            saveOption("googleTranslate", "on");
            select.prop("disabled", false);
        } else {
            saveOption("googleTranslate", "off");
            select.prop("disabled", true);
        }
    });

    select.change(function () {
        let option = $(this).find('option:selected');
        let languageCode = option.val();
        saveOption("googleTranslateTarget", languageCode);
    });

    let darkModeCheckbox = $("#option-dark-mode");
    darkModeCheckbox.change(function () {
        let darkMode = "off";
        if (darkModeCheckbox.is(":checked")) {
            darkMode = "on";
        }
        saveOption("darkMode", darkMode);
        updateDarkMode(darkMode);
    });

    $("#controls-form").submit(function (e) {
        e.preventDefault();
        withSelectedText(getHelp);
        return false;
    });

    $('#hlusta').click(function (e) {
        e.preventDefault();
        withSelectedText(hlusta);
        return false;
    });

    $('#clear').click(function (e) {
        $('#result').empty();
        e.preventDefault();
        return false;
    });

    $('#settings').click(function (e) {
        $('#settings-form').show();
        e.preventDefault();
        return false;
    });
    $('#close-settings').click(function (e) {
        $('#settings-form').hide();
        e.preventDefault();
        return false;
    });

    $('#slider').click(function () {
        toggleSidebar();
    });

    $("#result").on("click", ".search-item .morpho .morpho-heading", function (e) {
        if (e.target == e.currentTarget) {
            let morphoObj = $(this).closest(".morpho");
            if (morphoObj.hasClass("off")) {
                $(".entry", morphoObj).show(500);
                morphoObj.removeClass("off");
            } else {
                $(".entry", morphoObj).hide(500);
                morphoObj.addClass("off");
            }
        }
    });
});
