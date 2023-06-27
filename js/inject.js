var script = document.createElement('script');
script.src = chrome.runtime.getURL('js/content.js');
// see also "Dynamic values in the injected code" section in this answer
(document.head || document.documentElement).appendChild(script);
script.remove();
