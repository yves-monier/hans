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
    loadOptions();

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

    let checkbox = $("#use-google-translate");
    let select = $("#google-translate-target");

    checkbox.change(function () {
        if (checkbox.is(":checked")) {
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
});

function loadOptions() {
    // chrome.storage.sync.get(['sidebar'], function (result) {
    //     let button = document.getElementById("toggle-sidebar");
    //     let sidebarStatus = result.sidebar;
    //     if ("on" === sidebarStatus) {
    //         button.innerHTML= "Sýna skenkur";
    //     } else {
    //         button.innerHTML= "Fela skenkur";
    //     }
    // });

    chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
        let options = response.options;
        let button = document.getElementById("toggle-sidebar");
        // options.sidebarStatus: on / off
        if ("on" === options.sidebarStatus) {
            button.innerHTML = "Fela skenkur / Hide sidebar";
        } else {
            button.innerHTML = "Sýna skenkur / Show sidebar";
        }

        let checkbox = $("#use-google-translate");
        let select = $("#google-translate-target");
        if (options.googleTranslate == "on") {
            checkbox.prop('checked', true);
            select.prop("disabled", false);
        } else {
            checkbox.prop('checked', false);
            select.prop("disabled", true);
        }

        let target = options.googleTranslateTarget;
        $("option[value=" + target + "]", select).prop('selected', true);
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
}