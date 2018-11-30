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

function processURL(url, firstTry) {
    var jqxhr = $.get(url, function (data) {
        // success
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(data, "text/html");
        var lis = $("ul li", htmlDoc);
        lis.each(function (i) {
            var a = $("a", this);
            var lemma = a.text();
            lemma = lemma.trim();
            var pos = $(this).contents().filter(function () {
                return this.nodeType == 3;
            })[0].nodeValue;
            pos = pos.trim();
            var onclick = a[0].getAttribute("onclick");
            var regex = /'(\d+)'/gm;
            var m = regex.exec(onclick);
            if (m !== null) {
                var id = m[1];
                var url2 = "http://bin.arnastofnun.is/leit/?id=" + id
                console.log("Analysis " + i + ": " + lemma + " (" + pos + ") " + url2);
            }
        });

        if (lis.length == 0) {
            var h2s = $(".page-header h2", htmlDoc);
            if (h2s.length > 0) {
                var h2 = h2s[0];
                var lemma = $(h2).contents().filter(function () {
                    return this.nodeType == 3;
                })[0].nodeValue;
                lemma = lemma.trim();
                var small = $("small", h2);
                var pos = small.text();
                pos = pos.trim();
                console.log("Analysis: " + lemma + " (" + pos + ")");
            } else if (firstTry) {
                var nextUrl = url + "&id=&ordmyndir=on";
                processURL(nextUrl, false);    
            } else {
                // found nothing...
            }
        }

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

}

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

        // http://bin.arnastofnun.is/leit/?q=heiti
        // http://dev.phpbin.ja.is/ajax_leit.php?q=heiti
        // http://bin.arnastofnun.is/leit/?id=434170
        var url1 = "http://dev.phpbin.ja.is/ajax_leit.php?q=" + encodeURIComponent(selectedText);
        processURL(url1, true);
    });
}