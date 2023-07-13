var manifestData = chrome.runtime.getManifest();
document.getElementById('_version-text').textContent = `Version: ${manifestData.version}`;
