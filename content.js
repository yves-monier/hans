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

if (! chrome.runtime.onMessage.hasListener(assistantMessageListener)) {
    console.log("Add assistant message listener");
    chrome.runtime.onMessage.addListener(assistantMessageListener);
} else {
    console.log("Assistant message listener is already added");
}

function assistantMessageListener(msg, sender) {
    if (msg == "toggle-sidebar") {
        toggleSidebar();
    }
}

// https://stackoverflow.com/questions/10100540/chrome-extension-inject-sidebar-into-page

// Avoid recursive frame insertion...
var extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
if (!location.ancestorOrigins.contains(extensionOrigin)) {
    var iframe = document.createElement('iframe');
    iframe.style.background = "#eee";
    iframe.style.height = "100%";
    iframe.style.width = "0px";
    iframe.style.position = "fixed";
    iframe.style.top = "0px";
    iframe.style.right = "0px";
    iframe.style.zIndex = "9000000000000000000";
    iframe.frameBorder = "none";
    iframe.src = chrome.extension.getURL("assistant.html")
    document.body.appendChild(iframe);
}


function toggleSidebar() {
    // chrome.storage.sync.get(['sidebar'], function (result) {
    //     let sidebarStatus = result.sidebar;
    //     if ("on" === sidebarStatus) {
    //         showSidebar(false);
    //     } else {
    //         showSidebar(true);
    //     }
    // });
    let sidebarStatus = localStorage.getItem('sidebar');
    if ("on" === sidebarStatus) {
        showSidebar(false);
    } else {
        showSidebar(true);
    }
}

function showSidebar(visible) {
    let sidebarStatus;
    if (visible) {
        iframe.style.width = "400px";
        sidebarStatus = 'on';
    } else {
        iframe.style.width = "0px";
        sidebarStatus = 'off';
    }
    // chrome.storage.sync.set({ "sidebar": sidebarStatus }, function () {
    //     // done
    // });
    localStorage.setItem('sidebar', sidebarStatus);
}
