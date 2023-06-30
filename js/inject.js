function CWPlusInjectScript(src) {
  let script = document.createElement('script');

  script.src = chrome.runtime.getURL(src);
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

CWPlusInjectScript('js/lib/caretposition.js');
CWPlusInjectScript('js/lib/fuse.min.js');
CWPlusInjectScript('js/content.js');

