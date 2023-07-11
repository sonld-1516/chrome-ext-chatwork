chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ["css/foreground_styles.css"]
    })
    .then(() => {
      console.log("INJECTED THE FOREGROUND STYLES.");

      chrome.scripting.executeScript({
        target: { tabId: tabId},
        files: ["js/lib/jquery-3.7.0.min.js", "js/inject.js"]
      })
      .then(() => {
        console.log("OK");
      });
    }).catch(err => console.log(err));
  }
});
