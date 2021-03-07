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


let currentOptions = { sidebarStatus: "off", autoHelpSelection: "on", googleTranslate: "off", googleTranslateTarget: "en" };
chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
    currentOptions = Object.assign(currentOptions, response.options);
});

function assistantMessageListener(request, sender) {
    if (request.method === "showSidebar") {
        let sidebarStatus = request.param;
        showSidebar(sidebarStatus);
    } else if (request.method === "setOptions") {
        currentOptions = Object.assign(currentOptions, request.param);
    } else if (request.method === "hlusta") {
        hlusta(request.param);
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

function hlusta(text) {
    console.log("content.js received 'hlusta' message: " + text);

    let p = document.getElementById('readspeaker-hit').getElementsByTagName('p')[0];
    p.textContent = text;
    let range = document.createRange();
    range.selectNodeContents(p);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    let a = document.getElementById("readspeaker_button1").getElementsByClassName('rsbtn_play');
    if (a.length > 0) {
        a[0].click();
    }
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

    // see https://javascript.info/cross-window-communication

    if ((e.keyCode == 65 || e.keyCode == 97) && assistantIframe && srcElement && srcElement.nodeName == 'BODY') {
        // 65/97: 'A'/'a'
        let selectedText = getSelectedText();
        assistantIframe.contentWindow.postMessage({ method: "getHelp", param: selectedText }, "*");
    } else if ((e.keyCode == 72 || e.keyCode == 104) && assistantIframe && srcElement && srcElement.nodeName == 'BODY') {
        // 72/104: 'H'/'h'
        let selectedText = getSelectedText();
        // assistantIframe.contentWindow.postMessage({ method: "hlusta", param: selectedText }, "*");
        console.log("content.js, text: " + selectedText);
    }

}, false);

document.addEventListener('keyup', function (e) {
    let srcElement = e.srcElement;

    if (srcElement.tagName == 'INPUT')
        return;

    if (e.keyCode == 39) {
        // console.log("right");
        if (currentFocusNode == currentAnchorNode) {
            let maxOffset = Math.max(currentFocusOffset, currentAnchorOffset);
            let [nextAnchorNode, nextAnchorOffset, nextFocusNode, nextFocusOffset] = selectNextWord(currentFocusNode, maxOffset);
        } else {
            console.log("current selection is multi-nodes!");
        }
    } else if (e.keyCode == 37) {
        // console.log("left");
        if (currentFocusNode == currentAnchorNode) {
            let minOffset = Math.min(currentFocusOffset, currentAnchorOffset);
            let [nextAnchorNode, nextAnchorOffset, nextFocusNode, nextFocusOffset] = selectPrevWord(currentFocusNode, minOffset);
        } else {
            console.log("current selection is multi-nodes!");
        }
    }
});

document.addEventListener('selectionchange', function (e) {
    let selection = window.getSelection();

    currentAnchorNode = selection.anchorNode;
    currentAnchorOffset = selection.anchorOffset;
    currentFocusNode = selection.focusNode;
    currentFocusOffset = selection.focusOffset;
    currentSelection = selection.toString().trim();

    // ignore single-char selection
    if (currentSelection.length > 1 && currentOptions != null && currentOptions.autoHelpSelection == "on") {
        if (timeoutId != null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(getCurrentSelectionHelp, 1000);
    }
});

function dumpCurrentSelection() {
    if (currentAnchorNode == null || currentFocusNode == null)
        return;

    // console.log("selection: " + currentSelection + ", anchorOffset: " + currentAnchorOffset + ", focusOffset: " + currentFocusOffset);

    // if (currentFocusNode == currentAnchorNode) {
    //     console.log("currentFocusNode == currentAnchorNode");
    // } else {
    //     let comp = currentAnchorNode.compareDocumentPosition(currentFocusNode);

    //     // if (comp & Node.DOCUMENT_POSITION_DISCONNECTED) {
    //     // }
    //     if (comp & Node.DOCUMENT_POSITION_PRECEDING) {
    //         console.log("currentFocusNode PRECEDING currentAnchorNode");
    //     }
    //     if (comp & Node.DOCUMENT_POSITION_FOLLOWING) {
    //         console.log("currentFocusNode FOLLOWING currentAnchorNode");
    //     }
    //     if (comp & Node.DOCUMENT_POSITION_CONTAINS) {
    //         console.log("currentFocusNode CONTAINS currentAnchorNode");
    //     }
    //     if (comp & Node.DOCUMENT_POSITION_CONTAINED_BY) {
    //         console.log("currentFocusNode CONTAINED_BY currentAnchorNode");
    //     }
    //     if (comp & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC) {
    //         console.log("currentFocusNode IMPLEMENTATION_SPECIFIC currentAnchorNode");
    //     }
    // }
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

// -------------------------------------------------------------------
//
const IGNORED_ELEMENTS = [];
const ACCEPTED_ELEMENTS = ["input", "INPUT", "select", "SELECT"];

function collectTextOrInputNodes(node, arr) {
    if (node.nodeType === 3) {
        arr.push(node);
        return;
    }
    if (node.nodeType === 1 && ACCEPTED_ELEMENTS.includes(node.nodeName)) {
        // let type = node.getAttribute("type");
        // if (!type || type == "text" || type == "TEXT") {
        //     arr.push(node);
        //     return;
        // }
        arr.push(node);
        return;
    }
    if (node.hasChildNodes && !IGNORED_ELEMENTS.includes(node.nodeName)) {
        if (!node.hasChildNodes()) return;
        let children = node.childNodes;
        for (let ii = 0; ii < children.length; ii++) {
            collectTextOrInputNodes(children[ii], arr);
        }
    }
}

function getParents(node, max = -1) {
    const result = [];
    while (node = node.parentElement) {
        result.push(node);
        if (max > 0 && result.length == max) return result;
    }
    return result;
}

function getFirstCommonAncestor(pathA, pathB) {
    return pathA.find((item) => pathB.indexOf(item) !== -1);
}

function getCurrentSelectionExt() {
    let selectedText = undefined;
    let selection = window.getSelection();
    if (window.getSelection().rangeCount == 1) {
        let range = window.getSelection().getRangeAt(0);
        if (range.startContainer != range.endContainer) {
            let startParents = getParents(range.startContainer, 5);
            let endParents = getParents(range.endContainer, 5);
            let commonParent = getFirstCommonAncestor(startParents, endParents);
            if (commonParent) {
                let nodes = [];
                collectTextOrInputNodes(commonParent, nodes);
                let ii = 0;
                while (ii < nodes.length && nodes[ii] != range.startContainer) {
                    ii++;
                }
                selectedText = "";
                for (; ii < nodes.length; ii++) {
                    let end = false;
                    let nodeVal;
                    if (nodes[ii].nodeType == 3) {
                        nodeVal = nodes[ii].textContent;
                        if (nodes[ii] == range.startContainer) {
                            nodeVal = nodeVal.substring(range.startOffset);
                        } else if (nodes[ii] == range.endContainer) {
                            nodeVal = nodeVal.substring(0, range.endOffset);
                            end = true;
                        }
                    } else {
                        // input element
                        nodeVal = nodes[ii].value;
                    }
                    nodeVal = nodeVal.replace(/\n/g, " ");
                    nodeVal = nodeVal.replace(/\s+/g, " ");
                    selectedText += nodeVal;
                    if (end) {
                        break;
                    }
                }
            }
        }
    }
    return selectedText;
}
//
// -------------------------------------------------------------------

function getCurrentSelectionHelp() {
    if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }

    if (currentSelection.length > 0) {
        currentSelection = getCurrentSelectionExt() || currentSelection;
        // see https://javascript.info/cross-window-communication
        assistantIframe.contentWindow.postMessage({ method: "getHelp", param: currentSelection }, "*");
    }
}
