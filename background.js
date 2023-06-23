chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ["./foreground_styles.css"]
    })
    .then(() => {
        console.log("INJECTED THE FOREGROUND STYLES.");

        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["jquery-3.7.0.min.js", "./foreground.js"]
        })
            .then(() => {
                debugger
                console.log("INJECTED THE FOREGROUND SCRIPT.");
            });
    })
    .catch(err => console.log(err));
  }
});
