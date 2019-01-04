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
    setSidebarButtonTitle();

    $('#toggle-sidebar').click(function () {
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
                setSidebarButtonTitle();

                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    tabId = tabs[0].id;
                    chrome.tabs.sendMessage(tabId, { method: "showSidebar", param: newStatus });
                });
            });
        });
    });
});

function setSidebarButtonTitle() {
    // chrome.storage.sync.get(['sidebar'], function (result) {
    //     let button = document.getElementById("toggle-sidebar");
    //     let sidebarStatus = result.sidebar;
    //     if ("on" === sidebarStatus) {
    //         button.innerHTML= "Sýna skenkur";
    //     } else {
    //         button.innerHTML= "Fela skenkur";
    //     }
    // });

    let button = document.getElementById("toggle-sidebar");
    chrome.runtime.sendMessage({ method: "getSidebarStatus" }, function (response) {
        // response.sidebarStatus: on / off or undefined
        console.log(response.sidebarStatus);
        if ("on" === response.sidebarStatus) {
            button.innerHTML = "Fela skenkur";
        } else {
            button.innerHTML = "Sýna skenkur";
        }
    });
}
