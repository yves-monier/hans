# Icelandic assistant

I use [https://icelandiconline.com](https://icelandiconline.com) for learning Icelandic. Apart from its own learning resources, icelandiconline.com provides grammatical and is-en dictionary links that I've been using often enough to decide to develop a Chrome extension doing automatically for me what I had to do manually before: copy a word somewhere from my current lesson, display its [grammatical analysis](http://bin.arnastofnun.is/leit) web site, then search the displayed base form in the [IS-EN dictionary lookup](http://digicoll.library.wisc.edu/IcelOnline/Search.TEId.html) web site.

**Note**: in my humble opinion, using Google-translate services for brute force translation of the whole lesson would be unfair and unproductive, in terms of learning.

## Getting Started

- Clone or donwload/unzip the project wherever you want
- Follow [instructions](https://developer.chrome.com/extensions/getstarted) about installing a Chrome developer/unpacked extension:

  1. *Open the Extension Management page by navigating to chrome://extensions. The Extension Management page can also be opened by clicking on the Chrome menu, hovering over More Tools then selecting Extensions.*
  2. *Enable Developer Mode by clicking the toggle switch next to Developer mode.*
  3. *Click the LOAD UNPACKED button and select the extension directory.*

### Using Icelandic assistant

The extension is currently configured/active on icelandiconline.com and *.is web sites.
The extension appears as a right-sidebar. When it's active, a small handle is displayed that can be used to toggle the sidebar.

TO BE COMPLETED

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- Thanks to [Stofnun Árna Magnússonar í íslenskum fræðum](http://bin.arnastofnun.is/leit/) and [University of Wisconsin-Madison's Icelandic Online Dictionary](http://digicoll.library.wisc.edu/IcelOnline/Search.TEId.html): the icelandic assistant is nothing but a wrapper on top of their online services.
- BTW also thanks to [https://icelandiconline.com](https://icelandiconline.com) for providing their online resources.
  
## TODO

- Find a smarter name than Icelandic assistant :-)
- In case of N>1 parts of speech (e.g. slaka being either Kvenkynsnafnorð or Sagnorð, veik beyging), display one icon per analysis targeting the relevant url + tooltip showing the part of speech
- Use github Issues for TODOs  