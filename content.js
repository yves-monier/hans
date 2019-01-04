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

function assistantMessageListener(request, sender) {
    if (request.method === "showSidebar") {
        let sidebarStatus = request.param;
        showSidebar(sidebarStatus);
    }
}

// https://stackoverflow.com/questions/10100540/chrome-extension-inject-sidebar-into-page

// Avoid recursive frame insertion...
let iframe;
let extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
if (!location.ancestorOrigins.contains(extensionOrigin)) {
    iframe = document.createElement('iframe');
    iframe.style.background = "transparent";
    iframe.style.height = "100%";
    iframe.style.width = "24px";
    iframe.style.position = "fixed";
    iframe.style.top = "0px";
    iframe.style.right = "0px";
    iframe.style.zIndex = "9000000000000000000";
    iframe.style.boxSizing = "border-box";
    // iframe.style.boxShadow = "inset 1px 0 0 steelblue";
    iframe.frameBorder = "none";
    iframe.src = chrome.extension.getURL("assistant.html")
    document.body.appendChild(iframe);

    $(iframe).load(function () {
        chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
            // response.sidebarStatus: on / off or undefined
            console.log(response.sidebarStatus);
            showSidebar(response.sidebarStatus);
        });
    });
}

function showSidebar(onOrOff) {
    if (iframe) {
        let newWidth;
        if ("on" == onOrOff) {
            newWidth = "300px";
        } else {
            newWidth = "24px";
        }
        // iframe.style.width = newWidth;
        $(iframe).animate({
            width: newWidth
        }, 500, function () {
            // Animation complete
        });
    }
}
