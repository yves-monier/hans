/*
// Unique ID for the className.
var MOUSE_VISITED_CLASSNAME = 'crx_mouse_visited';

// Previous dom, that we want to track, so we can remove the previous styling.
var prevDOM = null;

// Mouse listener for any move event on the current document.
document.addEventListener('mousemove', function (e) {
    let srcElement = e.srcElement;

    // Lets check if our underlying element is a IMG.
    if (prevDOM != srcElement && srcElement.nodeName == 'IMG') {

        // For NPE checking, we check safely. We need to remove the class name
        // Since we will be styling the new one after.
        if (prevDOM != null) {
            prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
        }

        // Add a visited class name to the element. So we can style it.
        srcElement.classList.add(MOUSE_VISITED_CLASSNAME);

        // The current element is now the previous. So we can remove the class
        // during the next ieration.
        prevDOM = srcElement;
        console.info(srcElement.currentSrc);
        console.dir(srcElement);
    }
}, false);
*/

if (!chrome.runtime.onMessage.hasListener(assistantMessageListener)) {
    console.log("Add assistant message listener");
    chrome.runtime.onMessage.addListener(assistantMessageListener);
} else {
    console.log("Assistant message listener is already added");
}


let currentOptions = { sidebarStatus: "off", autoHelpSelection: "off", googleTranslate: "off", googleTranslateTarget: "en" };
chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
    currentOptions = Object.assign(currentOptions, response.options);
});

function assistantMessageListener(request, sender) {
    if (request.method === "showSidebar") {
        let sidebarStatus = request.param;
        showSidebar(sidebarStatus);
    } else if (request.method === "setOptions") {
        currentOptions = Object.assign(currentOptions, request.param);
    }
}

// https://stackoverflow.com/questions/10100540/chrome-extension-inject-sidebar-into-page

let assistantIframe;

// Avoid recursive frame insertion...
let extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
if (!location.ancestorOrigins.contains(extensionOrigin)) {
    assistantIframe = document.createElement('iframe');
    assistantIframe.style.background = "transparent";
    assistantIframe.style.height = "100%";
    assistantIframe.style.width = "24px";
    assistantIframe.style.position = "fixed";
    assistantIframe.style.top = "0px";
    assistantIframe.style.right = "0px";
    assistantIframe.style.zIndex = "9000000000000000000";
    assistantIframe.style.boxSizing = "border-box";
    // iframe.style.boxShadow = "inset 1px 0 0 steelblue";
    assistantIframe.frameBorder = "none";
    assistantIframe.src = chrome.extension.getURL("assistant.html")
    document.body.appendChild(assistantIframe);

    $(assistantIframe).load(function () {
        chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
            // response.sidebarStatus: on / off or undefined
            // console.log(response.sidebarStatus);
            showSidebar(response.sidebarStatus);
        });
    });
}

function showSidebar(onOrOff) {
    if (assistantIframe) {
        let newWidth;
        if ("on" == onOrOff) {
            newWidth = "300px";
        } else {
            newWidth = "24px";
        }
        // iframe.style.width = newWidth;
        $(assistantIframe).animate({
            width: newWidth
        }, 500, function () {
            // Animation complete
        });
    }
}

function getSelectedText() {
    let text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text.trim();
}

let currentAnchorNode = null;
let currentAnchorOffset = 0;
let currentFocusNode = null;
let currentFocusOffset = 0;
let currentSelection = "";
let timeoutId = null;

// document.onkeypress = function (e) {
//     console.log("kp");
// }
// Mouse listener for any move event on the current document.
document.addEventListener('keypress', function (e) {
    let srcElement = e.srcElement;

    // 65/97: 'A'/'a'
    if ((e.keyCode == 65 || e.keyCode == 97) && assistantIframe && srcElement && srcElement.nodeName == 'BODY') {
        let selectedText = getSelectedText();
        // see https://javascript.info/cross-window-communication
        assistantIframe.contentWindow.postMessage({ method: "getHelp", param: selectedText }, "*");
    }
}, false);

document.addEventListener('keyup', function (e) {
    let srcElement = e.srcElement;

    if (srcElement.tagName == 'INPUT')
        return;

    if (e.keyCode == 39) {
        console.log("right");
        if (currentFocusNode == currentAnchorNode) {
            let maxOffset = Math.max(currentFocusOffset, currentAnchorOffset);
            let [nextAnchorNode, nextAnchorOffset, nextFocusNode, nextFocusOffset] = selectNextWord(currentFocusNode, maxOffset);
        } else {
            console.log("current selection is multi-nodes!");
        }
    } else if (e.keyCode == 37) {
        console.log("left");
        if (currentFocusNode == currentAnchorNode) {
            let minOffset = Math.min(currentFocusOffset, currentAnchorOffset);
            let [nextAnchorNode, nextAnchorOffset, nextFocusNode, nextFocusOffset] = selectPrevWord(currentFocusNode, minOffset);
        } else {
            console.log("current selection is multi-nodes!");
        }
    }
});

document.addEventListener('selectionchange', function (e) {
    // if (timeoutId != null) {
    //     clearTimeout(timeoutId);
    // }
    // timeoutId = setTimeout(onSelectionChange, 1000);

    onSelectionChange();

    if (currentSelection.length > 0 && currentOptions != null && currentOptions.autoHelpSelection == "on") {
        if (timeoutId != null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(getCurrentSelectionHelp, 1000);
    }
});

function dumpCurrentSelection() {
    if (currentAnchorNode == null || currentFocusNode == null)
        return;

    console.log("selection: " + currentSelection + ", anchorOffset: " + currentAnchorOffset + ", focusOffset: " + currentFocusOffset);

    if (currentFocusNode == currentAnchorNode) {
        console.log("currentFocusNode == currentAnchorNode");
    } else {
        let comp = currentAnchorNode.compareDocumentPosition(currentFocusNode);

        // if (comp & Node.DOCUMENT_POSITION_DISCONNECTED) {
        // }
        if (comp & Node.DOCUMENT_POSITION_PRECEDING) {
            console.log("currentFocusNode PRECEDING currentAnchorNode");
        }
        if (comp & Node.DOCUMENT_POSITION_FOLLOWING) {
            console.log("currentFocusNode FOLLOWING currentAnchorNode");
        }
        if (comp & Node.DOCUMENT_POSITION_CONTAINS) {
            console.log("currentFocusNode CONTAINS currentAnchorNode");
        }
        if (comp & Node.DOCUMENT_POSITION_CONTAINED_BY) {
            console.log("currentFocusNode CONTAINED_BY currentAnchorNode");
        }
        if (comp & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC) {
            console.log("currentFocusNode IMPLEMENTATION_SPECIFIC currentAnchorNode");
        }
    }
}

function isWordCharacter(ch) {
    if (/[,.?!–\-]/.test(ch))
        return false;
    if (/\s/.test(ch))
        return false;

    return true;
}

function selectNextWord(fromFocusNode, fromFocusOffset) {
    let nextAnchorNode = null;
    let nextAnchorOffset = null;
    let nextFocusNode = null;
    let nextFocusOffset = null;

    let text = fromFocusNode.nodeValue;

    if (fromFocusOffset < text.length) {
        let nextStartPos = fromFocusOffset;
        while (nextStartPos < text.length && !isWordCharacter(text[nextStartPos])) {
            nextStartPos++;
        }
        let nextEndPos = nextStartPos + 1;
        while (nextEndPos < text.length && isWordCharacter(text[nextEndPos])) {
            nextEndPos++;
        }
        if (nextEndPos > nextStartPos) {
            selectWord(fromFocusNode, nextStartPos, nextEndPos);
        }

    } else {
        // currentFocusNode.nextSibling
    }

    return [nextAnchorNode, nextAnchorOffset, nextFocusNode, nextFocusOffset];
}

function selectPrevWord(fromFocusNode, fromFocusOffset) {
    let nextAnchorNode = null;
    let nextAnchorOffset = null;
    let nextFocusNode = null;
    let nextFocusOffset = null;

    let text = fromFocusNode.nodeValue;

    if (fromFocusOffset > 0) {
        let nextStartPos = fromFocusOffset - 1;
        while (nextStartPos > 0 && !isWordCharacter(text[nextStartPos])) {
            nextStartPos--;
        }
        let nextEndPos = nextStartPos - 1;
        while (nextEndPos >= 0 && isWordCharacter(text[nextEndPos])) {
            nextEndPos--;
        }
        if (nextEndPos + 1 < nextStartPos + 1) {
            selectWord(fromFocusNode, nextEndPos + 1, nextStartPos + 1);
        }

    } else {
        // currentFocusNode.nextSibling
    }

    return [nextAnchorNode, nextAnchorOffset, nextFocusNode, nextFocusOffset];
}

function selectWord(node, startPos, endPos) {
    let range = document.createRange();
    range.setStart(node, startPos);
    range.setEnd(node, endPos);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function getCurrentSelectionHelp() {
    if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }

    // see https://javascript.info/cross-window-communication
    assistantIframe.contentWindow.postMessage({ method: "getHelp", param: currentSelection }, "*");
}

function onSelectionChange() {
    let selection = window.getSelection();

    currentAnchorNode = selection.anchorNode;
    currentAnchorOffset = selection.anchorOffset;
    currentFocusNode = selection.focusNode;
    currentFocusOffset = selection.focusOffset;
    currentSelection = selection.toString().trim();

    if (currentSelection.length > 0) {
        // dumpCurrentSelection();

        // if (selection.rangeCount > 0) {
        //     for (let i = 0; i < selection.rangeCount; i++) {
        //         let range = selection.getRangeAt(i);
        //         console.log("range " + i + ": " + range);
        //     }
        // }
    } else {
        // console.log("no selection");
    }
}
