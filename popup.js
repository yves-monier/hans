let changeColor = document.getElementById('changeColor');

chrome.storage.sync.get('color', function (data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function (element) {
    let color = element.target.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
            { code: 'document.body.style.backgroundColor = "' + color + '";' });
    });
};

$(function () {
    $('#paste').click(function () {
        pasteSelection();
    });
});
function pasteSelection() {
    /*
    chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
        function (tab) {
            chrome.tabs.sendMessage(tab[0].id, { method: "getSelection" },
                function (response) {
                    var text = document.getElementById('text');
                    text.innerHTML = response.data;
                });
        });
        */
    chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
    }, function (selection) {
        // var query = encodeURIComponent(selection[0] || '汉典')
        // document.querySelector('iframe').src =
        //     'http://www.zdic.net/search/?c=3&q=' + query
        var selectedText = selection[0];
        console.log(selectedText);

        var jqxhr = $.get("http://bin.arnastofnun.is/leit/?id=434170", function (data) {
            // success
            var parser = new DOMParser();
            var htmlDoc = parser.parseFromString(data, "text/html");
            
            var text = document.getElementById('text');
            text.innerHTML = data;
        })
            .done(function () {
                // console.log("second success");
            })
            .fail(function () {
                console.log("error");
            })
            .always(function () {
                // finished
            });
    });
}